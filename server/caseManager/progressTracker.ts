/**
 * AI Case Manager — progress tracker.
 * Status mutations for goals/objectives, plus dependency-aware
 * "what should I do today" computation (read-time, nothing is
 * mutated to reflect priority — see resolveNextAction).
 */
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { carePlanGoals, carePlanObjectives, carePlans, type CarePlanGoal, type CarePlanObjective } from "../../drizzle/schema";
import { getActivePlanForUser } from "./carePlanGenerator";

const PRIORITY_ORDER: Record<string, number> = {
  immediate: 0,
  high: 1,
  medium: 2,
  long_term: 3,
};

type GoalWithObjectives = CarePlanGoal & { objectives: CarePlanObjective[] };

async function assertGoalOwnership(goalId: number, userId: number): Promise<CarePlanGoal> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [row] = await db
    .select({ goal: carePlanGoals, planUserId: carePlans.userId })
    .from(carePlanGoals)
    .innerJoin(carePlans, eq(carePlanGoals.carePlanId, carePlans.id))
    .where(eq(carePlanGoals.id, goalId))
    .limit(1);

  if (!row || row.planUserId !== userId) throw new Error("Goal not found");
  return row.goal;
}

async function assertObjectiveOwnership(objectiveId: number, userId: number): Promise<CarePlanObjective> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [row] = await db
    .select({ objective: carePlanObjectives, planUserId: carePlans.userId })
    .from(carePlanObjectives)
    .innerJoin(carePlanGoals, eq(carePlanObjectives.goalId, carePlanGoals.id))
    .innerJoin(carePlans, eq(carePlanGoals.carePlanId, carePlans.id))
    .where(eq(carePlanObjectives.id, objectiveId))
    .limit(1);

  if (!row || row.planUserId !== userId) throw new Error("Objective not found");
  return row.objective;
}

export async function updateGoalStatus(
  goalId: number,
  userId: number,
  status: "not_started" | "in_progress" | "completed" | "blocked"
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await assertGoalOwnership(goalId, userId);

  await db
    .update(carePlanGoals)
    .set({ status, updatedAt: Math.floor(Date.now() / 1000) })
    .where(eq(carePlanGoals.id, goalId));
}

export async function updateObjectiveStatus(
  objectiveId: number,
  userId: number,
  status: "not_started" | "in_progress" | "completed" | "blocked"
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await assertObjectiveOwnership(objectiveId, userId);

  await db
    .update(carePlanObjectives)
    .set({ status, updatedAt: Math.floor(Date.now() / 1000) })
    .where(eq(carePlanObjectives.id, objectiveId));
}

function parseBlockerIds(raw: string | null): number[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id: unknown) => typeof id === "number") : [];
  } catch {
    return [];
  }
}

export type NextAction = {
  objective: CarePlanObjective;
  goal: CarePlanGoal;
  reason: string;
};

/**
 * Walks a blocked objective's dependency chain to find the actual next
 * doable step. Returns null if every incomplete blocker is itself blocked
 * in a way that can't be resolved (shouldn't happen with well-formed plans,
 * but depth-capped defensively).
 */
function resolveNextAction(goals: GoalWithObjectives[]): NextAction | null {
  const objectivesById = new Map<number, { objective: CarePlanObjective; goal: CarePlanGoal }>();
  for (const goal of goals) {
    for (const objective of goal.objectives) {
      objectivesById.set(objective.id, { objective, goal });
    }
  }

  const sortedGoals = [...goals]
    .filter(g => g.status !== "completed")
    .sort((a, b) => (PRIORITY_ORDER[a.priorityTier] ?? 99) - (PRIORITY_ORDER[b.priorityTier] ?? 99) || a.sortOrder - b.sortOrder);

  for (const topGoal of sortedGoals) {
    const target = [...topGoal.objectives].sort((a, b) => a.sortOrder - b.sortOrder).find(o => o.status !== "completed");
    if (!target) continue;

    let current = target;
    const visited = new Set<number>();

    for (let depth = 0; depth < 10; depth++) {
      if (visited.has(current.id)) break; // cycle guard
      visited.add(current.id);

      const blockerIds = parseBlockerIds(current.blockedByObjectiveIds);
      const incompleteBlockers = blockerIds
        .map(id => objectivesById.get(id))
        .filter((entry): entry is { objective: CarePlanObjective; goal: CarePlanGoal } => entry !== undefined && entry.objective.status !== "completed");

      if (incompleteBlockers.length === 0) {
        if (current.id === target.id) {
          return { objective: current, goal: topGoal, reason: `Next step toward "${topGoal.title}".` };
        }
        const currentGoal = objectivesById.get(current.id)?.goal ?? topGoal;
        return {
          objective: current,
          goal: currentGoal,
          reason: `"${topGoal.title}" is still your highest-priority goal, but completing "${current.title}" is the next step — it's required first.`,
        };
      }

      current = incompleteBlockers[0].objective;
    }
  }

  return null;
}

export async function getRecommendedTasks(userId: number): Promise<{
  nextAction: NextAction | null;
  completedObjectives: number;
  totalObjectives: number;
  blockedObjectives: Array<{ objective: CarePlanObjective; goal: CarePlanGoal }>;
}> {
  const active = await getActivePlanForUser(userId);
  if (!active) {
    return { nextAction: null, completedObjectives: 0, totalObjectives: 0, blockedObjectives: [] };
  }

  const allObjectives = active.goals.flatMap(g => g.objectives.map(o => ({ objective: o, goal: g })));
  const completedObjectives = allObjectives.filter(({ objective }) => objective.status === "completed").length;

  const objectivesById = new Map<number, { objective: CarePlanObjective; goal: CarePlanGoal }>();
  for (const entry of allObjectives) objectivesById.set(entry.objective.id, entry);

  const blockedObjectives = allObjectives.filter(({ objective }) => {
    if (objective.status === "completed") return false;
    const blockerIds = parseBlockerIds(objective.blockedByObjectiveIds);
    return blockerIds.some(id => objectivesById.get(id)?.objective.status !== "completed");
  });

  return {
    nextAction: resolveNextAction(active.goals),
    completedObjectives,
    totalObjectives: allObjectives.length,
    blockedObjectives,
  };
}
