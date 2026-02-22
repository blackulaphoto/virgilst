import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { getDb } from "../db";
import { resources, meetings, mediCalProviders, jobs } from "../../drizzle/schema";
import { sql } from "drizzle-orm";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  publicStats: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) {
        return {
          resourcesCount: 0,
          meetingsCount: 0,
          mediCalProvidersCount: 0,
          jobsCount: 0,
        };
      }

      const [resourcesCount, meetingsCount, mediCalProvidersCount, jobsCount] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(resources),
        db.select({ count: sql<number>`count(*)` }).from(meetings),
        db.select({ count: sql<number>`count(*)` }).from(mediCalProviders),
        db.select({ count: sql<number>`count(*)` }).from(jobs),
      ]);

      return {
        resourcesCount: Number(resourcesCount[0]?.count || 0),
        meetingsCount: Number(meetingsCount[0]?.count || 0),
        mediCalProvidersCount: Number(mediCalProvidersCount[0]?.count || 0),
        jobsCount: Number(jobsCount[0]?.count || 0),
      };
    }),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),
});
