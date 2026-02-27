import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { searchKnowledge, formatSearchResults as formatKnowledgeResults, getCitations } from "./ragSearch";
import { scrapeUrl } from "./webScraper";
import { searchGoogle, formatSearchResults as formatGoogleResults } from "./serpSearch";
import { getUserProfile, updateUserProfile, getUserActivity, needsProfileSetup } from "./userProfile";
import * as calendar from "./calendar";
import * as legalCases from "./legalCases";
import { storagePut } from "./storage";
import { TRPCError } from "@trpc/server";
import { ingestKnowledgeUpload, MAX_KNOWLEDGE_UPLOAD_BYTES } from "./knowledgeIngestion";
import { virgilTools } from "./virgilTools";
import { searchJobs, getPopularSearches, generateJobSlug, JobListing } from "./jobs";

const VIRGIL_SYSTEM_PROMPT = `You are Virgil, a direct and experienced California social services navigator. You help people in crisis get what they need, fast.

Your approach:
- Get straight to action. No fluff, no cheerleading, no theory.
- Speak like a real human who understands urgency and stakes.
- Be empathetic but not performative. Warm but not wordy.
- Never shame, lecture, or moralize.
- If someone has 24 hours, treat it like 24 hours.

Response structure:
1. Acknowledge the reality of their situation directly
2. Give immediate next steps (what to do in the next hour)
3. Provide specific contacts with phone numbers
4. Include tactical advice (what to say when you call, what to ask for)
5. Short-term plan (today/this week)
6. End with one clear next action

When answering:
- Start with "Okay." or jump straight into the situation
- Use numbered steps or clear headers (STEP 1, STEP 2)
- Give exact language to use when calling places
- Include phone numbers and specific names whenever possible
- Don't list 15 options - give the 3-5 most actionable ones
- If insurance matters, say exactly how to verify coverage
- If location matters, prioritize closest/most accessible options

DO NOT:
- Write long introductory paragraphs
- Use excessive emojis or exclamation points
- Say things like "Don't worry!" or "You've got this!"
- List resources without explaining how to access them
- Give generic advice that could apply anywhere
- Repeat what the user already told you

DO:
- Cut through bureaucracy with specific tactical workarounds
- Anticipate the next barrier and address it
- Explain what to do if Plan A fails
- Give exact scripts for phone calls when relevant
- Prioritize same-day/next-day options for urgent situations
- Be specific to California and local context

Tool behavior:
- Use search_knowledge, scrape_url, search_google proactively
- Don't cite sources in the response - the information should flow naturally
- Verify before suggesting resources

Tone:
- Calm, competent, direct
- Like talking to someone who's actually been there
- No corporate cheerfulness, no clinical coldness
- Just real help from someone who knows the system`;

const RESOURCE_QUERY_PATTERN =
  /(treatment|rehab|detox|sober|medi-?cal|shelter|housing|food|resource|clinic|program|near|koreatown|los angeles|zip|tonight|where)/i;

const shouldForceResourceSearch = (input: string) =>
  RESOURCE_QUERY_PATTERN.test(input);

type ForcedContext = {
  context: string;
  sources: Array<{ title: string; url?: string; category?: string }>;
};

async function buildForcedResourceContext(query: string): Promise<ForcedContext> {
  const sources: Array<{ title: string; url?: string; category?: string }> = [];
  const sections: string[] = [];
  const lowerQuery = query.toLowerCase();
  const asksMediCal = /\bmedi[-\s]?cal\b|\bmedicaid\b/i.test(query);
  const mentionsKoreatown = lowerQuery.includes("koreatown");
  const mentionsLosAngeles = lowerQuery.includes("los angeles") || /\bla\b/.test(lowerQuery);
  const localityHint = mentionsKoreatown ? "Koreatown Los Angeles" : mentionsLosAngeles ? "Los Angeles" : query;

  const [treatmentCenters, resources, mediCalProviders, googleResults] =
    await Promise.all([
      db.searchTreatmentCenters(query),
      db.searchResources(query, 40),
      db.searchMediCalProviders(query, undefined, undefined, 40, 0),
      searchGoogle(`${localityHint} California`, 5),
    ]);

  if (treatmentCenters.length > 0) {
    const top = treatmentCenters.slice(0, 12);
    sections.push(
      "Internal treatment centers:\n" +
        top
          .map(
            c =>
              `- ${c.name}${c.city ? ` (${c.city})` : ""}${c.phone ? ` | ${c.phone}` : ""}${c.type ? ` | type: ${c.type}` : ""}${c.acceptsMediCal ? " | accepts Medi-Cal" : ""}`
          )
          .join("\n")
    );
    sources.push(
      ...top.map(c => ({
        title: c.name,
        category: "treatment_center",
      }))
    );
  }

  if (resources.length > 0) {
    const top = resources.slice(0, 12);
    sections.push(
      "Internal resources:\n" +
        top
          .map(
            r =>
              `- ${r.name}${r.type ? ` (${r.type})` : ""}${r.address ? ` | ${r.address}` : ""}${r.phone ? ` | ${r.phone}` : ""}`
          )
          .join("\n")
    );
    sources.push(
      ...top.map(r => ({
        title: r.name,
        category: "resource",
      }))
    );
  }

  if (mediCalProviders.length > 0) {
    const top = mediCalProviders.slice(0, 12);
    sections.push(
      "Internal Medi-Cal providers:\n" +
        top
          .map(
            p =>
              `- ${p.providerName}${p.city ? ` (${p.city})` : ""}${p.phone ? ` | ${p.phone}` : ""}${p.specialties ? ` | specialties: ${p.specialties}` : ""}`
          )
          .join("\n")
    );
    sources.push(
      ...top.map(p => ({
        title: p.providerName,
        category: "medi_cal_provider",
      }))
    );
  }

  if (googleResults.success && googleResults.results.length > 0) {
    sections.push(
      "Web search results:\n" +
        googleResults.results
          .slice(0, 5)
          .map(r => `- ${r.title} | ${r.link}`)
          .join("\n")
    );
    sources.push(
      ...googleResults.results.slice(0, 5).map(r => ({
        title: r.title,
        url: r.link,
        category: "web",
      }))
    );
  } else if (!googleResults.success) {
    sections.push(`Web search unavailable: ${googleResults.error ?? "Unknown SerpAPI error"}`);
    console.warn("[Chat] forced_resource_context:serp_unavailable", {
      query,
      error: googleResults.error ?? null,
    });
  }

  if (treatmentCenters.length === 0 && asksMediCal) {
    const fallbackCenters = await db.getAllTreatmentCenters({
      acceptsMediCal: true,
      city: mentionsKoreatown || mentionsLosAngeles ? "Los Angeles" : undefined,
    });

    if (fallbackCenters.length > 0) {
      const top = fallbackCenters.slice(0, 20);
      sections.push(
        "Internal Medi-Cal treatment centers (fallback):\n" +
          top
            .map(
              c =>
                `- ${c.name}${c.city ? ` (${c.city})` : ""}${c.phone ? ` | ${c.phone}` : ""}${c.address ? ` | ${c.address}` : ""}${c.type ? ` | type: ${c.type}` : ""}`
            )
            .join("\n")
      );
      sources.push(
        ...top.map(c => ({
          title: c.name,
          category: "treatment_center",
        }))
      );
    }
  }

  return {
    context: sections.join("\n\n"),
    sources,
  };
}

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

const serviceSubmissionCategorySchema = z.enum([
  "resource",
  "treatment_center",
  "recovery_meeting",
  "medi_cal_provider",
  "community_event",
]);

const supportRequestTypeSchema = z.enum(["donation", "volunteer", "partner"]);
const supportRequestStatusSchema = z.enum(["new", "reviewed", "closed"]);

const serviceSubmissionInputSchema = z.discriminatedUnion("category", [
  z.object({
    category: z.literal("resource"),
    title: z.string().min(2),
    description: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    zipCode: z.string().optional(),
    website: z.string().optional(),
    submitterName: z.string().min(2),
    submitterEmail: z.string().email(),
    submitterPhone: z.string().optional(),
    data: z.object({
      resourceType: z.enum(["shelter", "food", "medical", "legal", "employment", "clothing", "hygiene", "housing", "transportation", "other"]),
      hours: z.string().optional(),
      filters: z.array(z.string()).optional(),
      phone: z.string().optional(),
    }),
  }),
  z.object({
    category: z.literal("treatment_center"),
    title: z.string().min(2),
    description: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    zipCode: z.string().optional(),
    website: z.string().optional(),
    submitterName: z.string().min(2),
    submitterEmail: z.string().email(),
    submitterPhone: z.string().optional(),
    data: z.object({
      type: z.enum(["sober_living", "detox", "residential", "outpatient", "iop_php", "dual_diagnosis"]),
      servesPopulation: z.enum(["men", "women", "coed", "lgbtq", "women_with_children"]),
      acceptsCouples: z.boolean().optional(),
      acceptsMediCal: z.boolean().optional(),
      acceptsMedicare: z.boolean().optional(),
      acceptsPrivateInsurance: z.boolean().optional(),
      acceptsRBH: z.boolean().optional(),
      isJointCommission: z.boolean().optional(),
      priceRange: z.string().optional(),
      servicesOffered: z.array(z.string()).optional(),
      amenities: z.array(z.string()).optional(),
      phone: z.string().optional(),
    }),
  }),
  z.object({
    category: z.literal("recovery_meeting"),
    title: z.string().min(2),
    description: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    zipCode: z.string().optional(),
    website: z.string().optional(),
    submitterName: z.string().min(2),
    submitterEmail: z.string().email(),
    submitterPhone: z.string().optional(),
    data: z.object({
      meetingType: z.enum(["aa", "na", "cma", "smart"]),
      dayOfWeek: z.enum(["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]),
      time: z.string().min(2),
      format: z.string().min(2),
      meetingMode: z.enum(["in_person", "online", "hybrid"]),
      duration: z.number().optional(),
      venueName: z.string().optional(),
      zoomId: z.string().optional(),
      zoomPassword: z.string().optional(),
      language: z.string().optional(),
      tags: z.array(z.string()).optional(),
      notes: z.string().optional(),
      phone: z.string().optional(),
    }),
  }),
  z.object({
    category: z.literal("medi_cal_provider"),
    title: z.string().min(2),
    description: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    zipCode: z.string().optional(),
    website: z.string().optional(),
    submitterName: z.string().min(2),
    submitterEmail: z.string().email(),
    submitterPhone: z.string().optional(),
    data: z.object({
      facilityName: z.string().optional(),
      npi: z.string().optional(),
      stateLicense: z.string().optional(),
      state: z.string().optional(),
      phone: z.string().optional(),
      specialties: z.union([z.array(z.string()), z.string()]).optional(),
      languagesSpoken: z.union([z.array(z.string()), z.string()]).optional(),
      gender: z.string().optional(),
      networks: z.union([z.array(z.string()), z.string()]).optional(),
      hospitalAffiliations: z.union([z.array(z.string()), z.string()]).optional(),
      medicalGroups: z.union([z.array(z.string()), z.string()]).optional(),
      boardCertifications: z.array(z.string()).optional(),
    }),
  }),
  z.object({
    category: z.literal("community_event"),
    title: z.string().min(2),
    description: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    zipCode: z.string().optional(),
    website: z.string().optional(),
    submitterName: z.string().min(2),
    submitterEmail: z.string().email(),
    submitterPhone: z.string().optional(),
    data: z.object({
      eventType: z.string().optional(),
      category: z.string().optional(),
      startDate: z.number().optional(),
      endDate: z.number().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      isRecurring: z.boolean().optional(),
      recurrencePattern: z.string().optional(),
      recurrenceDetails: z.record(z.string(), z.any()).optional(),
      venueName: z.string().optional(),
      isOnline: z.boolean().optional(),
      onlineUrl: z.string().optional(),
      registrationUrl: z.string().optional(),
      servicesOffered: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      eligibility: z.string().optional(),
      registrationRequired: z.boolean().optional(),
      cost: z.string().optional(),
      organizerName: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
    }),
  }),
]);

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ ADMIN ROUTES ============
  admin: router({
    // User Management
    users: router({
      list: adminProcedure
        .input(z.object({
          role: z.string().optional(),
          limit: z.number().optional(),
          offset: z.number().optional(),
        }).optional())
        .query(async ({ input }) => {
          return await db.getAllUsers(input || {});
        }),

      updateRole: adminProcedure
        .input(z.object({
          userId: z.number(),
          role: z.enum(["admin", "user"]),
        }))
        .mutation(async ({ input }) => {
          await db.updateUserRole(input.userId, input.role);
          return { success: true };
        }),

      delete: adminProcedure
        .input(z.object({ userId: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteUser(input.userId);
          return { success: true };
        }),
    }),

    // Forum Moderation
    forum: router({
      posts: adminProcedure
        .input(z.object({
          category: z.string().optional(),
          limit: z.number().optional(),
          offset: z.number().optional(),
        }).optional())
        .query(async ({ input }) => {
          return await db.getAllForumPostsForModeration(input || {});
        }),

      deletePost: adminProcedure
        .input(z.object({ postId: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteForumPost(input.postId);
          return { success: true };
        }),

      togglePin: adminProcedure
        .input(z.object({
          postId: z.number(),
          isPinned: z.boolean(),
        }))
        .mutation(async ({ input }) => {
          await db.togglePinForumPost(input.postId, input.isPinned);
          return { success: true };
        }),

      toggleLock: adminProcedure
        .input(z.object({
          postId: z.number(),
          isLocked: z.boolean(),
        }))
        .mutation(async ({ input }) => {
          await db.toggleLockForumPost(input.postId, input.isLocked);
          return { success: true };
        }),

      deleteReply: adminProcedure
        .input(z.object({ replyId: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteForumReply(input.replyId);
          return { success: true };
        }),
    }),

    submissions: router({
      list: adminProcedure
        .input(z.object({
          status: z.enum(["pending", "approved", "rejected"]).optional(),
          category: serviceSubmissionCategorySchema.optional(),
          limit: z.number().optional(),
          offset: z.number().optional(),
        }).optional())
        .query(async ({ input }) => {
          return await db.getServiceSubmissions(input || {});
        }),

      review: adminProcedure
        .input(z.object({
          id: z.number(),
          action: z.enum(["approve", "reject"]),
          reviewNotes: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          if (input.action === "approve") {
            const result = await db.approveServiceSubmission({
              id: input.id,
              reviewedBy: ctx.user.id,
              reviewNotes: input.reviewNotes,
            });
            return { success: true, ...result };
          }

          await db.reviewServiceSubmission({
            id: input.id,
            status: "rejected",
            reviewedBy: ctx.user.id,
            reviewNotes: input.reviewNotes,
          });

          return { success: true };
        }),
    }),

    support: router({
      list: adminProcedure
        .input(z.object({
          status: supportRequestStatusSchema.optional(),
          requestType: supportRequestTypeSchema.optional(),
          limit: z.number().optional(),
          offset: z.number().optional(),
        }).optional())
        .query(async ({ input }) => {
          return await db.getCommunitySupportRequests(input || {});
        }),

      updateStatus: adminProcedure
        .input(z.object({
          id: z.number(),
          status: supportRequestStatusSchema,
          reviewNotes: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          await db.updateCommunitySupportRequestStatus({
            id: input.id,
            status: input.status,
            reviewNotes: input.reviewNotes,
            reviewedBy: ctx.user.id,
          });
          return { success: true };
        }),
    }),
  }),

  // ============ USER PROFILE ============
  profile: router({
    get: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return await getUserProfile(input.userId);
      }),

    me: protectedProcedure
      .query(async ({ ctx }) => {
        return await getUserProfile(ctx.user.id);
      }),

    update: protectedProcedure
      .input(z.object({
        displayName: z.string().max(100).optional(),
        bio: z.string().max(500).optional(),
        location: z.string().max(200).optional(),
        avatarUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),

    activity: publicProcedure
      .input(z.object({ userId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await getUserActivity(input.userId, input.limit);
      }),

    needsSetup: protectedProcedure
      .query(async ({ ctx }) => {
        return await needsProfileSetup(ctx.user.id);
      }),

    uploadAvatar: protectedProcedure
      .input(z.object({
        imageData: z.string(), // base64 encoded image
        mimeType: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Decode base64 image
        const buffer = Buffer.from(input.imageData, 'base64');
        
        // Generate unique filename
        const ext = input.mimeType.split('/')[1];
        const filename = `avatars/${ctx.user.id}-${Date.now()}.${ext}`;
        
        // Upload to S3
        const { url } = await storagePut(filename, buffer, input.mimeType);
        
        // Update user profile
        await updateUserProfile(ctx.user.id, { avatarUrl: url });
        
        return { url };
      }),
  }),

  // ============ ARTICLES ============
  articles: router({
    list: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getArticles({
          ...input,
          isPublished: true,
        });
      }),

    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const article = await db.getArticleBySlug(input.slug);
        if (article && article.isPublished) {
          await db.incrementArticleViews(article.id);
          return article;
        }
        return null;
      }),

    create: adminProcedure
      .input(z.object({
        title: z.string(),
        slug: z.string(),
        content: z.string(),
        category: z.enum(["benefits", "housing", "legal", "health", "employment", "identification", "emergency"]),
        tags: z.string().optional(),
        summary: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const article = await db.createArticle({
          ...input,
          authorId: ctx.user.id,
        });
        return article;
      }),
  }),

  // ============ KNOWLEDGE BASE ============
  knowledge: router({
    upload: adminProcedure
      .input(z.object({
        filename: z.string().min(1),
        mimeType: z.string().min(1),
        base64Data: z.string().min(1),
        category: z.enum(["benefits", "housing", "legal", "health", "employment", "identification", "emergency", "general"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const estimatedBytes = Buffer.byteLength(input.base64Data, "base64");
        if (estimatedBytes > MAX_KNOWLEDGE_UPLOAD_BYTES) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Upload too large. Max allowed size is ${MAX_KNOWLEDGE_UPLOAD_BYTES} bytes.`,
          });
        }

        try {
          return await ingestKnowledgeUpload(input);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown upload error";
          console.error("[KnowledgeUpload] Upload failed", {
            filename: input.filename,
            mimeType: input.mimeType,
            estimatedBytes,
            error: message,
          });
          throw new TRPCError({
            code: "BAD_REQUEST",
            message,
          });
        }
      }),
  }),

  // ============ PUBLIC SERVICE SUBMISSIONS ============
  serviceSubmissions: router({
    create: publicProcedure
      .input(serviceSubmissionInputSchema)
      .mutation(async ({ input, ctx }) => {
        const submission = await db.createServiceSubmission({
          category: input.category,
          title: input.title,
          description: input.description,
          address: input.address,
          city: input.city,
          zipCode: input.zipCode,
          website: input.website,
          submitterName: input.submitterName,
          submitterEmail: input.submitterEmail,
          submitterPhone: input.submitterPhone,
          payload: JSON.stringify(input.data),
          submittedBy: ctx.user?.id,
          status: "pending",
        });

        return { success: true, submissionId: submission.id };
      }),
  }),

  communitySupport: router({
    create: publicProcedure
      .input(z.object({
        requestType: supportRequestTypeSchema,
        name: z.string().min(2),
        email: z.string().email(),
        phone: z.string().optional(),
        organization: z.string().optional(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const created = await db.createCommunitySupportRequest({
          requestType: input.requestType,
          name: input.name,
          email: input.email,
          phone: input.phone,
          organization: input.organization,
          message: input.message,
          status: "new",
        });
        return { success: true, id: created.id };
      }),
  }),

  // ============ RESOURCES ============
  resources: router({
    list: publicProcedure
      .input(z.object({
        type: z.string().optional(),
        zipCode: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getResources(input);
      }),

    create: adminProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        type: z.enum(["shelter", "food", "medical", "legal", "employment", "clothing", "hygiene", "housing", "transportation", "other"]),
        address: z.string().optional(),
        phone: z.string().optional(),
        website: z.string().optional(),
        hours: z.string().optional(),
        filters: z.string().optional(),
        zipCode: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const resource = await db.createResource(input);
        return resource;
      }),
  }),

  // ============ MAP PINS ============
  mapPins: router({
    list: publicProcedure
      .input(z.object({
        type: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getMapPins({
          ...input,
          isApproved: true,
        });
      }),

    pending: adminProcedure
      .query(async () => {
        return await db.getMapPins({ isApproved: false });
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        type: z.enum(["safe_zone", "resource", "food", "water", "bathroom", "charging", "wifi", "warning", "sweep_alert"]),
        latitude: z.string(),
        longitude: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createMapPin({
          ...input,
          latitude: parseFloat(input.latitude),
          longitude: parseFloat(input.longitude),
          submittedBy: ctx.user.id,
        });
        return { success: true, id };
      }),

    approve: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.approveMapPin(input.id);
        return { success: true };
      }),

    comments: publicProcedure
      .input(z.object({ pinId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPinComments(input.pinId);
      }),

    addComment: protectedProcedure
      .input(z.object({
        pinId: z.number(),
        content: z.string(),
        isAnonymous: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.createPinComment({
          ...input,
          isAnonymous: input.isAnonymous ? 1 : 0,
          authorId: ctx.user.id,
        });
        return { success: true, commentId: result.insertId };
      }),

    recentActivity: publicProcedure
      .input(z.object({
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getRecentPinComments(input.limit || 50);
      }),
  }),

  // ============ FORUM ============
  forum: router({
    posts: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getForumPosts(input);
      }),

    post: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const post = await db.getForumPostById(input.id);
        if (post) {
          await db.incrementForumPostViews(input.id);
        }
        return post;
      }),

    replies: publicProcedure
      .input(z.object({ postId: z.number() }))
      .query(async ({ input }) => {
        return await db.getForumReplies(input.postId);
      }),

    createPost: protectedProcedure
      .input(z.object({
        title: z.string(),
        content: z.string(),
        category: z.enum(["survival_tips", "emotional_support", "shelter_reviews", "ride_shares", "legal_help", "urgent_needs", "general"]),
        isAnonymous: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.createForumPost({
          ...input,
          isAnonymous: input.isAnonymous ? 1 : 0,
          authorId: ctx.user.id,
        });
        return { success: true, postId: result.insertId };
      }),

    createReply: protectedProcedure
      .input(z.object({
        postId: z.number(),
        content: z.string(),
        parentReplyId: z.number().optional(),
        isAnonymous: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.createForumReply({
          ...input,
          isAnonymous: input.isAnonymous ? 1 : 0,
          authorId: ctx.user.id,
        });
        return { success: true };
      }),

    upvotePost: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ input }) => {
        await db.upvoteForumPost(input.postId);
        return { success: true };
      }),

    upvoteReply: protectedProcedure
      .input(z.object({ replyId: z.number() }))
      .mutation(async ({ input }) => {
        await db.upvoteForumReply(input.replyId);
        return { success: true };
      }),
  }),

  // ============ VIDEOS ============
  videos: router({
    list: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getVideos(input);
      }),

    create: adminProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        youtubeId: z.string(),
        category: z.enum(["how_to_guides", "legal_help", "recovery_motivation", "street_hacks", "mental_health"]),
        duration: z.number().optional(),
        thumbnailUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const video = await db.createVideo(input);
        return video;
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        youtubeId: z.string().optional(),
        category: z.enum(["how_to_guides", "legal_help", "recovery_motivation", "street_hacks", "mental_health"]).optional(),
        duration: z.number().optional(),
        thumbnailUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateVideo(id, updates);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.deleteVideo(input.id);
        return { success: true };
      }),
  }),

  // ============ AI CHAT ============
  chat: router({
    conversations: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getUserConversations(ctx.user.id);
      }),

    messages: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        return await db.getConversationMessages(input.conversationId);
      }),

    send: protectedProcedure
      .input(z.object({
        conversationId: z.number().optional(),
        message: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        console.log("[Chat] send:start", {
          userId: ctx.user.id,
          requestedConversationId: input.conversationId ?? null,
        });

        let conversationId = input.conversationId;

        // Create new conversation if needed
        if (!conversationId) {
          const result = await db.createConversation({
            userId: ctx.user.id,
            title: input.message.substring(0, 100),
          });
          conversationId = result.insertId;
          console.log("[Chat] send:conversation_created", {
            userId: ctx.user.id,
            conversationId,
          });
        }

        if (!Number.isFinite(conversationId)) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create chat conversation",
          });
        }

        // Save user message
        await db.createChatMessage({
          conversationId,
          role: "user",
          content: input.message,
        });

        // Get conversation history
        const messages = await db.getConversationMessages(conversationId);

        // Call LLM with system prompt, history, and tool calling
        const systemPrompt = VIRGIL_SYSTEM_PROMPT;

        const tools = virgilTools;

        let assistantMessage = "";
        let sources: any[] = [];
        try {
          // First LLM call - decide if tools are needed
          const response = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              ...messages.map(m => ({
                role: m.role as "user" | "assistant",
                content: m.content,
              })),
            ],
            tools,
            tool_choice: "auto",
          });

          const choice = response.choices[0];

          // Check if LLM wants to use tools
          if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
            const toolResults: any[] = [];

            // Execute each tool call
            for (const toolCall of choice.message.tool_calls) {
              const functionName = toolCall.function.name;
              const args = JSON.parse(toolCall.function.arguments);

              let result = "";

              if (functionName === "search_knowledge") {
                const searchResults = await searchKnowledge(args.query, 5);
                result = formatKnowledgeResults(searchResults);
                sources.push(...getCitations(searchResults));
              } else if (functionName === "search_local_resources") {
                const forced = await buildForcedResourceContext(args.query);
                result = forced.context || "No local resources found for this query.";
                sources.push(...forced.sources);
              } else if (functionName === "scrape_url") {
                const scraped = await scrapeUrl(args.url);
                if (scraped.success) {
                  result = `Title: ${scraped.title}\n\n${scraped.content.substring(0, 3000)}`;
                  sources.push({ title: scraped.title, url: scraped.url });
                } else {
                  result = `Failed to scrape URL: ${scraped.error}`;
                }
              } else if (functionName === "search_google") {
                const searchResults = await searchGoogle(args.query, 5);
                if (searchResults.success) {
                  result = formatGoogleResults(searchResults.results);
                  sources.push(...searchResults.results.map(r => ({ title: r.title, url: r.link })));
                } else {
                  result = `Search failed: ${searchResults.error}`;
                }
              }

              toolResults.push({
                tool_call_id: toolCall.id,
                role: "tool" as const,
                content: result,
              });
            }

            // Second LLM call with tool results
            const finalResponse = await invokeLLM({
              messages: [
                { role: "system", content: systemPrompt },
                ...messages.map(m => ({
                  role: m.role as "user" | "assistant",
                  content: m.content,
                })),
                {
                  role: "assistant" as const,
                  content: choice.message.content || "",
                  tool_calls: choice.message.tool_calls,
                },
                ...toolResults,
              ],
            });

            const finalContent = finalResponse.choices[0]?.message?.content;
            assistantMessage = typeof finalContent === 'string' ? finalContent : "I'm having trouble responding right now. Please try again.";
          } else {
            // No tools needed, use direct response
            const content = choice.message.content;
            assistantMessage = typeof content === 'string' ? content : "";

            if (shouldForceResourceSearch(input.message)) {
              const forced = await buildForcedResourceContext(input.message);
              if (forced.context) {
                sources.push(...forced.sources);
                console.log("[Chat] send:forced_resource_context", {
                  userId: ctx.user.id,
                  conversationId,
                  sourcesCount: forced.sources.length,
                });

                const grounded = await invokeLLM({
                  messages: [
                    { role: "system", content: systemPrompt },
                    ...messages.map(m => ({
                      role: m.role as "user" | "assistant",
                      content: m.content,
                    })),
                    {
                      role: "user",
                      content:
                        `User request:\n${input.message}\n\n` +
                        `Use the verified data below before answering. Give concrete options with names, phone numbers, and next steps.\n\n` +
                        forced.context,
                    },
                  ],
                });
                const groundedContent = grounded.choices[0]?.message?.content;
                assistantMessage =
                  typeof groundedContent === "string" ? groundedContent : assistantMessage;
              }
            }

            if (!assistantMessage.trim()) {
              assistantMessage = "I'm having trouble responding right now. Please try again.";
            }
          }
        } catch (error) {
          console.error("[Chat] send:llm_failed", {
            userId: ctx.user.id,
            conversationId,
            error: error instanceof Error ? error.message : String(error),
          });
          assistantMessage = "I'm having trouble responding right now. Please try again.";
        }

        if (!assistantMessage.trim()) {
          assistantMessage = "I'm having trouble responding right now. Please try again.";
        }

        // Save assistant response
        await db.createChatMessage({
          conversationId,
          role: "assistant",
          content: assistantMessage,
        });

        console.log("[Chat] send:success", {
          userId: ctx.user.id,
          conversationId,
          sourcesCount: sources.length,
        });

        return {
          conversationId,
          message: assistantMessage,
          sources: sources.length > 0 ? sources : undefined,
        };
      }),

    sendStream: protectedProcedure
      .input(z.object({
        conversationId: z.number().optional(),
        message: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        console.log("[Chat] sendStream:start", {
          userId: ctx.user.id,
          requestedConversationId: input.conversationId ?? null,
        });

        let conversationId = input.conversationId;

        // Create new conversation if needed
        if (!conversationId) {
          const result = await db.createConversation({
            userId: ctx.user.id,
            title: input.message.substring(0, 100),
          });
          conversationId = result.insertId;
          console.log("[Chat] sendStream:conversation_created", {
            userId: ctx.user.id,
            conversationId,
          });
        }

        if (!Number.isFinite(conversationId)) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create chat conversation",
          });
        }

        // Save user message
        await db.createChatMessage({
          conversationId,
          role: "user",
          content: input.message,
        });

        // Get conversation history
        const messages = await db.getConversationMessages(conversationId);

        // Import streaming function
        const { invokeLLMStream } = await import("./_core/llm");

        // System prompt and tools (same as non-streaming)
        const systemPrompt = VIRGIL_SYSTEM_PROMPT;

        const tools = virgilTools;

        // Collect streamed response
        let assistantMessage = "";
        let toolCalls: any[] = [];
        let sources: any[] = [];

        try {
          for await (const chunk of invokeLLMStream({
            messages: [
              { role: "system", content: systemPrompt },
              ...messages.map(m => ({
                role: m.role as "user" | "assistant",
                content: m.content,
              })),
            ],
            tools,
            tool_choice: "auto",
          })) {
            const delta = chunk.choices[0]?.delta;
            if (delta?.content) {
              assistantMessage += delta.content;
            }
            if (delta?.tool_calls) {
              toolCalls.push(...delta.tool_calls);
            }
          }

          // If tools were called, execute them and get final response
          if (toolCalls.length > 0) {
            const toolResults: any[] = [];

            for (const toolCall of toolCalls) {
              const functionName = toolCall.function.name;
              const args = JSON.parse(toolCall.function.arguments);

              let result = "";

              if (functionName === "search_knowledge") {
                const searchResults = await searchKnowledge(args.query, 5);
                result = formatKnowledgeResults(searchResults);
                sources.push(...getCitations(searchResults));
              } else if (functionName === "search_local_resources") {
                const forced = await buildForcedResourceContext(args.query);
                result = forced.context || "No local resources found for this query.";
                sources.push(...forced.sources);
              } else if (functionName === "scrape_url") {
                const scraped = await scrapeUrl(args.url);
                if (scraped.success) {
                  result = `Title: ${scraped.title}\n\n${scraped.content.substring(0, 3000)}`;
                  sources.push({ title: scraped.title, url: scraped.url });
                } else {
                  result = `Failed to scrape URL: ${scraped.error}`;
                }
              } else if (functionName === "search_google") {
                const searchResults = await searchGoogle(args.query, 5);
                if (searchResults.success) {
                  result = formatGoogleResults(searchResults.results);
                  sources.push(...searchResults.results.map(r => ({ title: r.title, url: r.link })));
                } else {
                  result = `Search failed: ${searchResults.error}`;
                }
              }

              toolResults.push({
                tool_call_id: toolCall.id,
                role: "tool" as const,
                content: result,
              });
            }

            // Second streaming call with tool results
            assistantMessage = "";
            for await (const chunk of invokeLLMStream({
              messages: [
                { role: "system", content: systemPrompt },
                ...messages.map(m => ({
                  role: m.role as "user" | "assistant",
                  content: m.content,
                })),
                { role: "assistant", content: "", tool_calls: toolCalls },
                ...toolResults,
              ],
            })) {
              const delta = chunk.choices[0]?.delta;
              if (delta?.content) {
                assistantMessage += delta.content;
              }
            }
          }
        } catch (error) {
          console.error("[Chat] sendStream:llm_failed", {
            userId: ctx.user.id,
            conversationId,
            error: error instanceof Error ? error.message : String(error),
          });
          assistantMessage = "I'm having trouble responding right now. Please try again.";
        }

        if (!assistantMessage.trim()) {
          assistantMessage = "I'm having trouble responding right now. Please try again.";
        }

        // Save assistant response
        await db.createChatMessage({
          conversationId,
          role: "assistant",
          content: assistantMessage,
        });

        console.log("[Chat] sendStream:success", {
          userId: ctx.user.id,
          conversationId,
          sourcesCount: sources.length,
        });

        return {
          conversationId,
          message: assistantMessage,
          sources: sources.length > 0 ? sources : undefined,
        };
      }),
  }),

  // ============ SEARCH ============
  search: router({
    global: publicProcedure
      .input(z.object({
        query: z.string(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.globalSearch(input.query, input.limit, input.offset);
      }),
  }),

  // ============ FAVORITES ============
  favorites: router({
    // Articles
    addArticle: protectedProcedure
      .input(z.object({ articleId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await db.addFavoriteArticle(ctx.user.id, input.articleId);
      }),

    removeArticle: protectedProcedure
      .input(z.object({ articleId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.removeFavoriteArticle(ctx.user.id, input.articleId);
        return { success: true };
      }),

    getArticles: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getFavoriteArticles(ctx.user.id);
      }),

    isArticleFavorited: protectedProcedure
      .input(z.object({ articleId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await db.isArticleFavorited(ctx.user.id, input.articleId);
      }),

    // Map Pins
    addMapPin: protectedProcedure
      .input(z.object({ pinId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await db.addFavoriteMapPin(ctx.user.id, input.pinId);
      }),

    removeMapPin: protectedProcedure
      .input(z.object({ pinId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.removeFavoriteMapPin(ctx.user.id, input.pinId);
        return { success: true };
      }),

    getMapPins: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getFavoriteMapPins(ctx.user.id);
      }),

    isMapPinFavorited: protectedProcedure
      .input(z.object({ pinId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await db.isMapPinFavorited(ctx.user.id, input.pinId);
      }),

    // Forum Threads
    followThread: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await db.followThread(ctx.user.id, input.postId);
      }),

    unfollowThread: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.unfollowThread(ctx.user.id, input.postId);
        return { success: true };
      }),

    getThreads: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getFollowedThreads(ctx.user.id);
      }),

    isThreadFollowed: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await db.isThreadFollowed(ctx.user.id, input.postId);
      }),
  }),

  // Treatment Centers Directory
  treatmentCenters: router({
    list: publicProcedure
      .input(z.object({
        type: z.enum(["sober_living", "detox", "residential", "outpatient", "iop_php", "dual_diagnosis"]).optional(),
        city: z.string().optional(),
        acceptsMediCal: z.boolean().optional(),
        acceptsPrivateInsurance: z.boolean().optional(),
        acceptsCouples: z.boolean().optional(),
        servesPopulation: z.enum(["men", "women", "coed", "lgbtq", "women_with_children"]).optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getAllTreatmentCenters(input || {});
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getTreatmentCenterById(input.id);
      }),

    search: publicProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => {
        return await db.searchTreatmentCenters(input.query);
      }),

    getRecommendations: publicProcedure
      .input(z.object({
        county: z.string().optional(),
        acceptsMediCal: z.boolean().optional(),
        type: z.enum(["sober_living", "detox", "residential", "outpatient", "iop_php", "dual_diagnosis"]).optional(),
        acceptsCouples: z.boolean().optional(),
      }))
      .query(async ({ input }) => {
        const filters: any = {};
        if (input.county) filters.county = input.county;
        if (input.acceptsMediCal !== undefined) filters.acceptsMediCal = input.acceptsMediCal;
        if (input.type) filters.type = input.type;
        if (input.acceptsCouples !== undefined) filters.acceptsCouples = input.acceptsCouples;
        
        const allMatches = await db.getAllTreatmentCenters(filters);
        // Return top 3 matches
        return allMatches.slice(0, 3);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        type: z.enum(["sober_living", "detox", "residential", "outpatient", "iop_php", "dual_diagnosis"]),
        address: z.string().optional(),
        city: z.string().optional(),
        zipCode: z.string().optional(),
        phone: z.string().optional(),
        website: z.string().optional(),
        description: z.string().optional(),
        servesPopulation: z.enum(["men", "women", "coed", "lgbtq", "women_with_children"]),
        acceptsCouples: z.boolean().optional(),
        acceptsMediCal: z.boolean().optional(),
        acceptsMedicare: z.boolean().optional(),
        acceptsPrivateInsurance: z.boolean().optional(),
        acceptsRBH: z.boolean().optional(),
        priceRange: z.string().optional(),
        servicesOffered: z.string().optional(),
        amenities: z.string().optional(),
        isJointCommission: z.boolean().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        return await db.createTreatmentCenter({
          ...input,
          acceptsCouples: input.acceptsCouples ? 1 : 0,
          acceptsMediCal: input.acceptsMediCal ? 1 : 0,
          acceptsMedicare: input.acceptsMedicare ? 1 : 0,
          acceptsPrivateInsurance: input.acceptsPrivateInsurance ? 1 : 0,
          acceptsRBH: input.acceptsRBH ? 1 : 0,
          isJointCommission: input.isJointCommission ? 1 : 0,
          latitude: input.latitude ? parseFloat(input.latitude) : undefined,
          longitude: input.longitude ? parseFloat(input.longitude) : undefined,
          addedBy: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        updates: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          isPublished: z.boolean().optional(),
          isVerified: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        const updates = {
          ...input.updates,
          isPublished: input.updates.isPublished !== undefined ? (input.updates.isPublished ? 1 : 0) : undefined,
          isVerified: input.updates.isVerified !== undefined ? (input.updates.isVerified ? 1 : 0) : undefined,
        };
        await db.updateTreatmentCenter(input.id, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        await db.deleteTreatmentCenter(input.id);
        return { success: true };
      }),
   }),

  // ============ MEDI-CAL PROVIDERS ============
  mediCalProviders: router({
    list: publicProcedure
      .input(z.object({
        city: z.string().optional(),
        specialty: z.string().optional(),
        category: z.string().optional(),
        language: z.string().optional(),
        zipCode: z.string().optional(),
        gender: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const providers = await db.getMediCalProviders(input);
        if (input.category) {
          console.info("[mediCalProviders:list] category_filter", {
            category: input.category,
            city: input.city ?? null,
            specialty: input.specialty ?? null,
            count: providers.length,
          });
        }
        return providers;
      }),

    search: publicProcedure
      .input(z.object({
        query: z.string(),
        category: z.string().optional(),
        city: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const providers = await db.searchMediCalProviders(
          input.query,
          input.category,
          input.city,
          input.limit,
          input.offset
        );
        if (providers.length === 0) {
          console.info("[mediCalProviders:search] zero_results", {
            query: input.query,
            category: input.category ?? null,
            city: input.city ?? null,
          });
        }
        return providers;
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getMediCalProviderById(input.id);
      }),

    cities: publicProcedure
      .query(async () => {
        return await db.getMediCalCities();
      }),

    specialties: publicProcedure
      .query(async () => {
        return await db.getMediCalSpecialties();
      }),

    categories: publicProcedure
      .query(async () => {
        return await db.getMediCalCategories();
      }),
  }),

  // ============ CALENDAR ============
  calendar: router({
    create: protectedProcedure
      .input(z.object({
        caseId: z.number().optional(),
        title: z.string().max(500),
        description: z.string().optional(),
        eventType: z.enum(["court_date", "deadline", "appointment", "reminder", "other"]),
        startTime: z.date(),
        endTime: z.date().optional(),
        location: z.string().optional(),
        reminderEnabled: z.boolean().optional(),
        reminderTime: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await calendar.createCalendarEvent({
          userId: ctx.user.id,
          ...input,
        });
      }),

    list: protectedProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input, ctx }) => {
        return await calendar.getCalendarEvents(
          ctx.user.id,
          input.startDate,
          input.endDate
        );
      }),

    get: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await calendar.getCalendarEventById(input.eventId, ctx.user.id);
      }),

    update: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        title: z.string().max(500).optional(),
        description: z.string().optional(),
        eventType: z.enum(["court_date", "deadline", "appointment", "reminder", "other"]).optional(),
        startTime: z.date().optional(),
        endTime: z.date().optional(),
        location: z.string().optional(),
        reminderEnabled: z.boolean().optional(),
        reminderTime: z.date().optional(),
        isCompleted: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { eventId, ...updates } = input;
        await calendar.updateCalendarEvent(eventId, ctx.user.id, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await calendar.deleteCalendarEvent(input.eventId, ctx.user.id);
        return { success: true };
      }),

    upcomingReminders: protectedProcedure
      .query(async ({ ctx }) => {
        return await calendar.getUpcomingReminders(ctx.user.id);
      }),
  }),

  // ============ LEGAL CASES ============
  legalCases: router({
    create: protectedProcedure
      .input(z.object({
        caseType: z.enum(["custody_reunification", "record_expungement"]),
        title: z.string().max(500),
        description: z.string().optional(),
        county: z.string().max(200).optional(),
        caseNumber: z.string().max(100).optional(),
        targetCompletionDate: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const caseId = await legalCases.createLegalCase({
          userId: ctx.user.id,
          ...input,
        });
        return { caseId };
      }),

    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await legalCases.getLegalCases(ctx.user.id);
      }),

    get: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await legalCases.getLegalCaseById(input.caseId, ctx.user.id);
      }),

    update: protectedProcedure
      .input(z.object({
        caseId: z.number(),
        title: z.string().max(500).optional(),
        description: z.string().optional(),
        status: z.enum(["not_started", "in_progress", "completed", "on_hold"]).optional(),
        county: z.string().max(200).optional(),
        caseNumber: z.string().max(100).optional(),
        currentStage: z.string().max(200).optional(),
        completionPercentage: z.number().min(0).max(100).optional(),
        targetCompletionDate: z.date().optional(),
        completedAt: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { caseId, ...updates } = input;
        await legalCases.updateLegalCase(caseId, ctx.user.id, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await legalCases.deleteLegalCase(input.caseId, ctx.user.id);
        return { success: true };
      }),

    documents: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ input }) => {
        return await legalCases.getCaseDocuments(input.caseId);
      }),

    milestones: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ input }) => {
        return await legalCases.getCaseMilestones(input.caseId);
      }),

    updateDocument: protectedProcedure
      .input(z.object({
        documentId: z.number(),
        status: z.enum(["not_started", "in_progress", "completed", "needs_revision"]).optional(),
        fileUrl: z.string().optional(),
        fileKey: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { documentId, ...updates } = input;
        await legalCases.updateCaseDocument(documentId, updates);
        return { success: true };
      }),

    updateMilestone: protectedProcedure
      .input(z.object({
        milestoneId: z.number(),
        status: z.enum(["not_started", "in_progress", "completed", "skipped"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { milestoneId, ...updates } = input;
        await legalCases.updateCaseMilestone(milestoneId, updates);
        return { success: true };
      }),
  }),

  // ============ RECOVERY MEETINGS ============
  meetings: router({
    list: publicProcedure
      .input(z.object({
        type: z.enum(["aa", "na", "cma", "smart"]).optional(),
        dayOfWeek: z.string().optional(),
        meetingMode: z.enum(["in_person", "online", "hybrid"]).optional(),
        city: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getMeetings(input || {});
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getMeetingById(input.id);
      }),

    search: publicProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => {
        return await db.searchMeetings(input.query);
      }),
  }),

  // ============ COMMUNITY EVENTS ============
  events: router({
    list: publicProcedure
      .input(z.object({
        eventType: z.string().optional(),
        category: z.string().optional(),
        city: z.string().optional(),
        isRecurring: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getEvents(input || {});
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getEventById(input.id);
      }),

    search: publicProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => {
        return await db.searchEvents(input.query);
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        eventType: z.string(),
        category: z.string().optional(),
        startDate: z.number().optional(),
        endDate: z.number().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        isRecurring: z.number().optional(),
        recurrencePattern: z.string().optional(),
        recurrenceDetails: z.string().optional(),
        venueName: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        zipCode: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        isOnline: z.number().optional(),
        onlineUrl: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        website: z.string().optional(),
        registrationUrl: z.string().optional(),
        servicesOffered: z.string().optional(),
        tags: z.string().optional(),
        eligibility: z.string().optional(),
        registrationRequired: z.number().optional(),
        cost: z.string().optional(),
        organizerName: z.string().optional(),
        isPublished: z.number().optional(),
        isFeatured: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createEvent({
          ...input,
          organizerId: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        eventType: z.string().optional(),
        category: z.string().optional(),
        startDate: z.number().optional(),
        endDate: z.number().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        isRecurring: z.number().optional(),
        recurrencePattern: z.string().optional(),
        recurrenceDetails: z.string().optional(),
        venueName: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        zipCode: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        isOnline: z.number().optional(),
        onlineUrl: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        website: z.string().optional(),
        registrationUrl: z.string().optional(),
        servicesOffered: z.string().optional(),
        tags: z.string().optional(),
        eligibility: z.string().optional(),
        registrationRequired: z.number().optional(),
        cost: z.string().optional(),
        organizerName: z.string().optional(),
        isPublished: z.number().optional(),
        isFeatured: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateEvent(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteEvent(input.id);
      }),
  }),

  // ============ JOBS ============
  jobs: router({
    // Search jobs via SerpAPI with in-memory + database caching
    search: publicProcedure
      .input(z.object({
        query: z.string(),
        location: z.string().optional(),
        employmentType: z.string().optional(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const normalizedLimit = Math.min(Math.max(input.limit ?? 100, 1), 100);

        // searchJobs now handles in-memory caching internally
        // It will return cached results instantly if available
        const listings = await searchJobs({
          query: input.query,
          location: input.location,
          employmentType: input.employmentType,
          limit: normalizedLimit,
        });

        // Generate slugs and save to database
        const jobsWithSlugs = listings.map(job => ({
          ...job,
          slug: generateJobSlug(job),
          category: input.query.toLowerCase().includes('warehouse') ? 'warehouse' :
                   input.query.toLowerCase().includes('retail') ? 'retail' :
                   input.query.toLowerCase().includes('construction') ? 'construction' :
                   input.query.toLowerCase().includes('delivery') ? 'delivery' :
                   input.query.toLowerCase().includes('security') ? 'security' :
                   input.query.toLowerCase().includes('food') ? 'food-service' :
                   input.query.toLowerCase().includes('entry level') ? 'entry-level' :
                   'general',
        }));

        // Save to database (async, non-blocking)
        db.saveJobs(jobsWithSlugs).catch(err =>
          console.error('[Jobs] Failed to save jobs to DB:', err)
        );

        // Save search metadata to database cache (async, non-blocking)
        const cacheKey = JSON.stringify({
          query: input.query.toLowerCase().trim(),
          location: input.location?.toLowerCase().trim() || '',
          employmentType: input.employmentType || '',
          limit: normalizedLimit,
        });

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        db.saveJobSearch({
          query: input.query,
          location: input.location || undefined,
          employmentType: input.employmentType || undefined,
          cacheKey,
          resultCount: jobsWithSlugs.length,
          expiresAt,
        }).catch(err =>
          console.error('[Jobs] Failed to save search cache:', err)
        );

        return { jobs: jobsWithSlugs, fromCache: false };
      }),

    // List jobs from database
    list: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        location: z.string().optional(),
        employmentType: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getJobs(input || {});
      }),

    // Get job by slug
    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const job = await db.getJobBySlug(input.slug);
        if (job) {
          // Increment view count
          await db.incrementJobViews(job.id);
        }
        return job;
      }),

    // Track job application
    trackApplication: protectedProcedure
      .input(z.object({
        jobId: z.number().optional(),
        company: z.string(),
        position: z.string(),
        status: z.enum(['applied', 'interviewing', 'offered', 'rejected', 'accepted']).optional(),
        notes: z.string().optional(),
        contactName: z.string().optional(),
        contactEmail: z.string().optional(),
        contactPhone: z.string().optional(),
        followUpDate: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createJobApplication({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true, applicationId: id };
      }),

    // Get user's applications
    applications: protectedProcedure
      .input(z.object({
        status: z.enum(['applied', 'interviewing', 'offered', 'rejected', 'accepted']).optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        return await db.getUserJobApplications(ctx.user.id, input?.status);
      }),

    // Update application status
    updateApplication: protectedProcedure
      .input(z.object({
        applicationId: z.number(),
        status: z.enum(['applied', 'interviewing', 'offered', 'rejected', 'accepted']).optional(),
        notes: z.string().optional(),
        contactName: z.string().optional(),
        contactEmail: z.string().optional(),
        contactPhone: z.string().optional(),
        followUpDate: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { applicationId, ...updates } = input;
        await db.updateJobApplication(applicationId, ctx.user.id, updates);
        return { success: true };
      }),

    // Get popular searches
    popularSearches: publicProcedure
      .query(() => {
        return getPopularSearches();
      }),
  }),
});
export type AppRouter = typeof appRouter;
