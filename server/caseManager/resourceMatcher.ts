/**
 * AI Case Manager — resource matcher.
 * Reuses Virgil's existing search functions (server/db.ts) rather than
 * reimplementing search. Two conceptual phases per goal:
 *   1. screenEligibility — hard-exclude candidates that clearly don't fit
 *      (stubbed as a no-op pass-through for the vertical slice; filled in
 *      once barrier/preference-aware screening lands).
 *   2. rankRelevance — order survivors by how well they match the goal.
 */
import { eq, inArray } from "drizzle-orm";
import * as db from "../db";
import {
  carePlanGoals,
  carePlans,
  needsAssessments,
  carePlanResourceRecommendations,
  resources,
  treatmentCenters,
  mediCalProviders,
  jobs,
  type CarePlanGoal,
  type CarePlanResourceRecommendation,
} from "../../drizzle/schema";
import type { NeedsProfile } from "./assessmentEngine";

export type ResourceCandidate = {
  resourceType: "resource" | "treatmentCenter" | "mediCalProvider" | "meeting" | "job" | "event";
  resourceId: number;
  name: string;
  description?: string;
  phone?: string;
  address?: string;
};

export type ResourceRecommendation = ResourceCandidate & { rationale: string };

const RESOURCE_LIMIT = 5;

function buildQuery(goal: CarePlanGoal): string {
  return `${goal.title} ${goal.category.replace(/_/g, " ")}`;
}

async function searchCandidates(goal: CarePlanGoal): Promise<ResourceCandidate[]> {
  const query = buildQuery(goal);
  const candidates: ResourceCandidate[] = [];

  const generalResources = await db.searchResources(query, 10);
  candidates.push(
    ...generalResources.map(r => ({
      resourceType: "resource" as const,
      resourceId: r.id,
      name: r.name,
      description: r.description ?? undefined,
      phone: r.phone ?? undefined,
      address: r.address ?? undefined,
    }))
  );

  if (goal.category === "mental_health" || goal.category === "substance_use") {
    const centers = await db.searchTreatmentCentersWithFilters(query, {});
    candidates.push(
      ...centers.slice(0, 10).map(c => ({
        resourceType: "treatmentCenter" as const,
        resourceId: c.id,
        name: c.name,
        description: c.description ?? undefined,
        phone: c.phone ?? undefined,
        address: c.address ?? undefined,
      }))
    );
  }

  if (
    goal.category === "insurance" ||
    goal.category === "primary_care" ||
    goal.category === "dental_care" ||
    goal.category === "vision_care"
  ) {
    const providers = await db.searchMediCalProviders(query, undefined, undefined, 10, 0);
    candidates.push(
      ...providers.map(p => ({
        resourceType: "mediCalProvider" as const,
        resourceId: p.id,
        name: p.facilityName || p.providerName || "Medi-Cal provider",
        address: p.address ?? undefined,
      }))
    );
  }

  if (goal.category === "employment" || goal.category === "income") {
    const global = await db.globalSearch(query, 10);
    candidates.push(
      ...global.jobs.slice(0, 10).map((j: any) => ({
        resourceType: "job" as const,
        resourceId: j.id,
        name: `${j.title} at ${j.company}`,
        description: j.location ?? undefined,
      }))
    );
  }

  // Dedupe by (type, id) since general + category-specific searches can overlap.
  const seen = new Set<string>();
  return candidates.filter(c => {
    const key = `${c.resourceType}:${c.resourceId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Phase 1: hard eligibility screening. No-op for the vertical slice —
 * every candidate passes through untouched. Barrier/preference-aware
 * exclusion (women-only vs. male client, no-pets vs. has a pet, etc.)
 * lands here once the intelligence-layer phase begins.
 */
function screenEligibility(candidates: ResourceCandidate[], _profile: NeedsProfile): ResourceCandidate[] {
  return candidates;
}

/**
 * Phase 2: relevance ranking + deterministic "why selected" rationale.
 * Keeps the search functions' own relevance ordering and just caps the count.
 */
function rankRelevance(candidates: ResourceCandidate[], goal: CarePlanGoal): ResourceRecommendation[] {
  return candidates.slice(0, RESOURCE_LIMIT).map(c => ({
    ...c,
    rationale: `Matches your "${goal.title}" goal (${goal.category.replace(/_/g, " ")}).`,
  }));
}

async function getGoalAndProfile(
  goalId: number
): Promise<{ goal: CarePlanGoal; profile: NeedsProfile } | null> {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");

  const [goal] = await database.select().from(carePlanGoals).where(eq(carePlanGoals.id, goalId)).limit(1);
  if (!goal) return null;

  const [plan] = await database.select().from(carePlans).where(eq(carePlans.id, goal.carePlanId)).limit(1);
  if (!plan) return null;

  const [assessment] = await database
    .select()
    .from(needsAssessments)
    .where(eq(needsAssessments.id, plan.assessmentId))
    .limit(1);

  let profile: NeedsProfile = { needs: [], barriers: [], strengths: [], preferences: [], risks: [], existingConnections: [] };
  if (assessment?.needsProfile) {
    try {
      profile = JSON.parse(assessment.needsProfile);
    } catch {
      // keep empty profile
    }
  }

  return { goal, profile };
}

export async function matchAndPersistForGoal(goalId: number): Promise<{
  recommended: ResourceRecommendation[];
  excludedCount: number;
  screeningNotes: string;
}> {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");

  const context = await getGoalAndProfile(goalId);
  if (!context) throw new Error("Goal not found");

  const candidates = await searchCandidates(context.goal);
  const survivors = screenEligibility(candidates, context.profile);
  const recommended = rankRelevance(survivors, context.goal);
  const excludedCount = candidates.length - survivors.length;

  await database.delete(carePlanResourceRecommendations).where(eq(carePlanResourceRecommendations.goalId, goalId));

  for (let index = 0; index < recommended.length; index++) {
    const rec = recommended[index];
    await database.insert(carePlanResourceRecommendations).values({
      goalId,
      resourceType: rec.resourceType,
      resourceId: rec.resourceId,
      rationale: rec.rationale,
      sortOrder: index,
    });
  }

  return {
    recommended,
    excludedCount,
    screeningNotes:
      excludedCount > 0
        ? `Found ${candidates.length}, excluded ${excludedCount} that don't fit your situation.`
        : `Found ${candidates.length} matching resources.`,
  };
}

export async function matchAndPersistForPlan(carePlanId: number): Promise<void> {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");

  const goals = await database.select().from(carePlanGoals).where(eq(carePlanGoals.carePlanId, carePlanId));
  for (const goal of goals) {
    await matchAndPersistForGoal(goal.id);
  }
}

type HydratedRecommendation = CarePlanResourceRecommendation & {
  name: string;
  address?: string;
  phone?: string;
};

/**
 * Recommendation rows only store {resourceType, resourceId} — this hydrates
 * display fields (name/address/phone) by looking each one up in its source
 * table, batched per type, rather than denormalizing data that could go stale.
 */
async function hydrateRecommendations(
  rows: CarePlanResourceRecommendation[]
): Promise<HydratedRecommendation[]> {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");

  const idsByType = new Map<string, number[]>();
  for (const row of rows) {
    const ids = idsByType.get(row.resourceType) ?? [];
    ids.push(row.resourceId);
    idsByType.set(row.resourceType, ids);
  }

  const details = new Map<string, { name: string; address?: string; phone?: string }>();

  const resourceIds = idsByType.get("resource");
  if (resourceIds && resourceIds.length > 0) {
    const resourceRows = await database.select().from(resources).where(inArray(resources.id, resourceIds));
    for (const r of resourceRows) {
      details.set(`resource:${r.id}`, { name: r.name, address: r.address ?? undefined, phone: r.phone ?? undefined });
    }
  }

  const centerIds = idsByType.get("treatmentCenter");
  if (centerIds && centerIds.length > 0) {
    const centerRows = await database.select().from(treatmentCenters).where(inArray(treatmentCenters.id, centerIds));
    for (const c of centerRows) {
      details.set(`treatmentCenter:${c.id}`, { name: c.name, address: c.address ?? undefined, phone: c.phone ?? undefined });
    }
  }

  const providerIds = idsByType.get("mediCalProvider");
  if (providerIds && providerIds.length > 0) {
    const providerRows = await database.select().from(mediCalProviders).where(inArray(mediCalProviders.id, providerIds));
    for (const p of providerRows) {
      details.set(`mediCalProvider:${p.id}`, { name: p.facilityName || p.providerName || "Medi-Cal provider", address: p.address ?? undefined });
    }
  }

  const jobIds = idsByType.get("job");
  if (jobIds && jobIds.length > 0) {
    const jobRows = await database.select().from(jobs).where(inArray(jobs.id, jobIds));
    for (const j of jobRows) {
      details.set(`job:${j.id}`, { name: `${j.title} at ${j.company}`, address: j.location ?? undefined });
    }
  }

  return rows.map(row => ({
    ...row,
    ...(details.get(`${row.resourceType}:${row.resourceId}`) ?? { name: `${row.resourceType} #${row.resourceId}` }),
  }));
}

export async function getResourceRecommendationsForGoal(goalId: number): Promise<HydratedRecommendation[]> {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");

  const rows = await database
    .select()
    .from(carePlanResourceRecommendations)
    .where(eq(carePlanResourceRecommendations.goalId, goalId))
    .orderBy(carePlanResourceRecommendations.sortOrder);

  return await hydrateRecommendations(rows);
}
