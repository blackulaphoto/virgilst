/** Deterministic, verified resource matching for AI care-plan goals. */
import { eq, inArray } from "drizzle-orm";
import * as db from "../db";
import { carePlanGoals, carePlans, needsAssessments, carePlanResourceRecommendations, resources, treatmentCenters, type CarePlanGoal, type CarePlanResourceRecommendation } from "../../drizzle/schema";
import { classifyResourceGeography, type ResourceGeography } from "../../shared/resourceGeography";
import { isDatabaseTrue } from "../../shared/treatmentPresentation";
import type { NeedsProfile } from "./assessmentEngine";
import { safePhone } from "./safety";

export type ServiceCapability = "emergency_shelter" | "housing" | "sober_living" | "food" | "hygiene" | "transportation" | "outpatient" | "residential" | "benefits" | "identification" | "medical" | "none";
export type ResourceCandidate = {
  resourceType: "resource" | "treatmentCenter";
  resourceId: number;
  name: string;
  capability: ServiceCapability;
  geography: ResourceGeography;
  verified: boolean;
  description?: string;
  phone?: string;
  address?: string;
  website?: string;
};
export type ResourceRecommendation = ResourceCandidate & { rationale: string };
const RESOURCE_LIMIT = 5;

export function inferGoalCapability(goal: Pick<CarePlanGoal, "category" | "title">): ServiceCapability {
  const text = `${goal.title} ${goal.category}`.toLowerCase();
  if (/sober (?:housing|living)|recovery residence/.test(text)) return "sober_living";
  if (/outpatient|iop|php/.test(text)) return "outpatient";
  if (/residential treatment|detox/.test(text)) return "residential";
  if (goal.category === "housing") return /shelter|sleep tonight|immediate/.test(text) ? "emergency_shelter" : "housing";
  if (goal.category === "food") return "food";
  if (goal.category === "transportation") return "transportation";
  if (goal.category === "identification") return "identification";
  if (goal.category === "benefits" || goal.category === "income" || goal.category === "insurance") return "benefits";
  if (goal.category === "primary_care" || goal.category === "dental_care" || goal.category === "vision_care") return "medical";
  if (goal.category === "substance_use") return "outpatient";
  return "none";
}

export function selectGroundedCandidates(candidates: ResourceCandidate[], capability: ServiceCapability, losAngelesRequest = true): ResourceCandidate[] {
  if (["none", "benefits", "identification", "medical"].includes(capability)) return [];
  const rank: Record<ResourceGeography, number> = { los_angeles: 0, statewide: 1, unknown: 2, outside_los_angeles: 3 };
  return candidates
    .filter(candidate => candidate.verified && candidate.capability === capability)
    .filter(candidate => !losAngelesRequest || candidate.geography === "los_angeles" || candidate.geography === "statewide")
    .sort((a, b) => rank[a.geography] - rank[b.geography] || a.resourceId - b.resourceId)
    .slice(0, RESOURCE_LIMIT);
}

const RESOURCE_TYPES: Partial<Record<ServiceCapability, string[]>> = {
  emergency_shelter: ["shelter"], housing: ["housing", "shelter"], food: ["food"], hygiene: ["hygiene"], transportation: ["transportation"],
};

async function searchCandidates(goal: CarePlanGoal): Promise<ResourceCandidate[]> {
  const capability = inferGoalCapability(goal);
  const candidates: ResourceCandidate[] = [];
  for (const type of RESOURCE_TYPES[capability] ?? []) {
    const rows = await db.getResources({ type, limit: 100 });
    candidates.push(...rows.map(row => ({ resourceType: "resource" as const, resourceId: row.id, name: row.name, capability, geography: classifyResourceGeography(row), verified: isDatabaseTrue(row.isVerified), description: row.description ?? undefined, phone: safePhone(row.phone), address: row.address ?? undefined, website: row.website ?? undefined })));
  }
  const treatmentType = capability === "sober_living" ? "sober_living" : capability === "outpatient" ? "outpatient" : capability === "residential" ? "residential" : null;
  if (treatmentType) {
    const rows = await db.getAllTreatmentCenters({ type: treatmentType });
    candidates.push(...rows.map(row => ({ resourceType: "treatmentCenter" as const, resourceId: row.id, name: row.name, capability, geography: classifyResourceGeography({ ...row, address: [row.address, row.city, row.zipCode].filter(Boolean).join(", ") }), verified: isDatabaseTrue(row.isVerified), description: row.description ?? undefined, phone: safePhone(row.phone), address: row.address ?? row.city ?? undefined, website: row.website ?? undefined })));
  }
  const seen = new Set<string>();
  return candidates.filter(candidate => { const key = `${candidate.resourceType}:${candidate.resourceId}`; if (seen.has(key)) return false; seen.add(key); return true; });
}

async function getGoalAndProfile(goalId: number): Promise<{ goal: CarePlanGoal; profile: NeedsProfile } | null> {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");
  const [goal] = await database.select().from(carePlanGoals).where(eq(carePlanGoals.id, goalId)).limit(1);
  if (!goal) return null;
  const [plan] = await database.select().from(carePlans).where(eq(carePlans.id, goal.carePlanId)).limit(1);
  if (!plan) return null;
  const [assessment] = await database.select().from(needsAssessments).where(eq(needsAssessments.id, plan.assessmentId)).limit(1);
  const empty: NeedsProfile = { needs: [], barriers: [], strengths: [], preferences: [], risks: [], existingConnections: [] };
  if (!assessment?.needsProfile) return { goal, profile: empty };
  try { return { goal, profile: { ...empty, ...JSON.parse(assessment.needsProfile) } }; } catch { return { goal, profile: empty }; }
}

export async function matchAndPersistForGoal(goalId: number) {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");
  const context = await getGoalAndProfile(goalId);
  if (!context) throw new Error("Goal not found");
  const capability = inferGoalCapability(context.goal);
  const candidates = await searchCandidates(context.goal);
  const selected = selectGroundedCandidates(candidates, capability, true);
  const recommended: ResourceRecommendation[] = selected.map(candidate => ({ ...candidate, rationale: candidate.geography === "statewide" ? `Verified statewide ${capability.replace(/_/g, " ")} listing relevant to this goal.` : `Verified Los Angeles-area ${capability.replace(/_/g, " ")} listing relevant to this goal.` }));
  await database.delete(carePlanResourceRecommendations).where(eq(carePlanResourceRecommendations.goalId, goalId));
  for (let index = 0; index < recommended.length; index++) {
    const rec = recommended[index];
    await database.insert(carePlanResourceRecommendations).values({ goalId, resourceType: rec.resourceType, resourceId: rec.resourceId, rationale: rec.rationale, sortOrder: index });
  }
  return { recommended, excludedCount: candidates.length - selected.length, screeningNotes: recommended.length ? `Attached ${recommended.length} verified matching resources.` : "No verified matching resource found yet." };
}

export async function matchAndPersistForPlan(carePlanId: number): Promise<void> {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");
  const goals = await database.select().from(carePlanGoals).where(eq(carePlanGoals.carePlanId, carePlanId));
  for (const goal of goals) await matchAndPersistForGoal(goal.id);
}

type HydratedRecommendation = CarePlanResourceRecommendation & { name: string; address?: string; phone?: string };
async function hydrateRecommendations(rows: CarePlanResourceRecommendation[]): Promise<HydratedRecommendation[]> {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");
  const idsByType = new Map<string, number[]>();
  for (const row of rows) idsByType.set(row.resourceType, [...(idsByType.get(row.resourceType) ?? []), row.resourceId]);
  const details = new Map<string, { name: string; address?: string; phone?: string }>();
  const resourceIds = idsByType.get("resource") ?? [];
  if (resourceIds.length) {
    const sourceRows = await database.select().from(resources).where(inArray(resources.id, resourceIds));
    for (const row of sourceRows) if (isDatabaseTrue(row.isVerified)) details.set(`resource:${row.id}`, { name: row.name, address: row.address ?? undefined, phone: safePhone(row.phone) });
  }
  const centerIds = idsByType.get("treatmentCenter") ?? [];
  if (centerIds.length) {
    const sourceRows = await database.select().from(treatmentCenters).where(inArray(treatmentCenters.id, centerIds));
    for (const row of sourceRows) if (isDatabaseTrue(row.isVerified)) details.set(`treatmentCenter:${row.id}`, { name: row.name, address: row.address ?? row.city ?? undefined, phone: safePhone(row.phone) });
  }
  return rows.flatMap(row => { const detail = details.get(`${row.resourceType}:${row.resourceId}`); return detail ? [{ ...row, ...detail }] : []; });
}

export async function getResourceRecommendationsForGoal(goalId: number): Promise<HydratedRecommendation[]> {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");
  const rows = await database.select().from(carePlanResourceRecommendations).where(eq(carePlanResourceRecommendations.goalId, goalId)).orderBy(carePlanResourceRecommendations.sortOrder);
  return hydrateRecommendations(rows);
}
