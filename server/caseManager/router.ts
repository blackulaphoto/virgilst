/**
 * AI Case Manager — thin tRPC router.
 * Mirrors the legalCases router pattern: protectedProcedure wrappers that
 * pass straight through to the module functions, no business logic here.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { sendAssessmentMessage, getAssessmentById, getLatestAssessment } from "./assessmentEngine";
import { generateOrExtendCarePlan, getActivePlanForUser } from "./carePlanGenerator";
import { matchAndPersistForPlan, getResourceRecommendationsForGoal } from "./resourceMatcher";
import { updateGoalStatus, updateObjectiveStatus, getRecommendedTasks } from "./progressTracker";

/**
 * LLM/network failures (rate limits, exhausted credits, timeouts) shouldn't
 * surface their raw technical text to users — log the real error, show
 * something human. Other errors (validation, "not found", etc.) are already
 * written to be user-safe, so they pass through as-is.
 */
function isInfrastructureError(error: unknown): boolean {
  return error instanceof Error && /LLM invoke failed|OPENAI_API_KEY/i.test(error.message);
}

function toClientError(error: unknown, friendlyMessage: string, logLabel: string): TRPCError {
  console.error(`[CaseManager] ${logLabel}:`, error);

  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: isInfrastructureError(error)
      ? friendlyMessage
      : error instanceof Error
        ? error.message
        : "Something went wrong. Please try again.",
  });
}

export const caseManagerRouter = router({
  assessment: router({
    send: protectedProcedure
      .input(z.object({
        assessmentId: z.number().optional(),
        message: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          return await sendAssessmentMessage({
            userId: ctx.user.id,
            assessmentId: input.assessmentId,
            message: input.message,
          });
        } catch (error) {
          throw toClientError(
            error,
            "Virgil is temporarily unable to respond. Your progress has been saved. Please try again shortly.",
            "assessment.send failed"
          );
        }
      }),

    latest: protectedProcedure
      .query(async ({ ctx }) => {
        return await getLatestAssessment(ctx.user.id);
      }),

    get: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await getAssessmentById(input.assessmentId, ctx.user.id);
      }),
  }),

  plan: router({
    generate: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        try {
          const result = await generateOrExtendCarePlan(ctx.user.id, input.assessmentId);
          await matchAndPersistForPlan(result.plan.id);
          return await getActivePlanForUser(ctx.user.id);
        } catch (error) {
          throw toClientError(
            error,
            "Virgil couldn't build your plan right now. Your assessment is saved — please try again shortly.",
            "plan.generate failed"
          );
        }
      }),

    active: protectedProcedure
      .query(async ({ ctx }) => {
        return await getActivePlanForUser(ctx.user.id);
      }),
  }),

  goals: router({
    updateStatus: protectedProcedure
      .input(z.object({
        goalId: z.number(),
        status: z.enum(["not_started", "in_progress", "completed", "blocked"]),
      }))
      .mutation(async ({ input, ctx }) => {
        await updateGoalStatus(input.goalId, ctx.user.id, input.status);
        return { success: true };
      }),

    resourceRecommendations: protectedProcedure
      .input(z.object({ goalId: z.number() }))
      .query(async ({ input }) => {
        return await getResourceRecommendationsForGoal(input.goalId);
      }),
  }),

  objectives: router({
    updateStatus: protectedProcedure
      .input(z.object({
        objectiveId: z.number(),
        status: z.enum(["not_started", "in_progress", "completed", "blocked"]),
      }))
      .mutation(async ({ input, ctx }) => {
        await updateObjectiveStatus(input.objectiveId, ctx.user.id, input.status);
        return { success: true };
      }),
  }),

  dashboard: router({
    recommendedTasks: protectedProcedure
      .query(async ({ ctx }) => {
        return await getRecommendedTasks(ctx.user.id);
      }),
  }),
});
