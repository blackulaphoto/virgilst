/**
 * AI Case Manager — assessment engine.
 * Runs the adaptive conversational intake and produces a structured needs profile.
 * Transcript reuses the existing chat_conversations/chat_messages tables
 * (chatConversations.contextType = "case_assessment") rather than duplicating storage.
 */
import { eq, and, desc } from "drizzle-orm";
import { getDb } from "../db";
import {
  needsAssessments,
  chatConversations,
  chatMessages,
  type NeedsAssessment,
} from "../../drizzle/schema";
import { invokeLLM, type Message } from "../_core/llm";
import { assessmentTools } from "./assessmentTools";
import { ASSESSMENT_TOPICS } from "./assessmentTopics";

export type NeedsProfile = {
  needs: Array<{
    id: string;
    category: string;
    description: string;
    priorityTier: "immediate" | "high" | "medium" | "long_term";
    rationale: string;
  }>;
  barriers: string[];
  strengths: string[];
  preferences: string[];
  risks: string[];
  existingConnections: string[];
};

const EMPTY_PROFILE: NeedsProfile = {
  needs: [],
  barriers: [],
  strengths: [],
  preferences: [],
  risks: [],
  existingConnections: [],
};

const NEEDS_PROFILE_SCHEMA = {
  name: "needs_profile",
  strict: true,
  schema: {
    type: "object",
    properties: {
      needs: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string", description: "A short stable slug, e.g. 'housing_instability'." },
            category: { type: "string", enum: [...ASSESSMENT_TOPICS] },
            description: { type: "string" },
            priorityTier: { type: "string", enum: ["immediate", "high", "medium", "long_term"] },
            rationale: { type: "string" },
          },
          required: ["id", "category", "description", "priorityTier", "rationale"],
          additionalProperties: false,
        },
      },
      barriers: { type: "array", items: { type: "string" } },
      strengths: { type: "array", items: { type: "string" } },
      preferences: { type: "array", items: { type: "string" } },
      risks: { type: "array", items: { type: "string" } },
      existingConnections: { type: "array", items: { type: "string" } },
    },
    required: ["needs", "barriers", "strengths", "preferences", "risks", "existingConnections"],
    additionalProperties: false,
  },
};

const ASSESSMENT_SYSTEM_PROMPT = `You are Virgil's AI Case Manager, conducting a needs assessment the way an experienced, warm community case manager would — a real conversation, not a form.

Cover these topics as they become relevant, adapting to what the person tells you:
${ASSESSMENT_TOPICS.filter(t => t !== "crisis").join(", ")}

Rules:
- If they already have something handled (e.g. stable housing), don't dwell on it — acknowledge briefly and move on.
- If they report a serious problem in an area, explore it a bit further before moving to the next topic.
- Ask one or two things at a time, never a wall of questions.
- If someone doesn't want to discuss a topic, respect that and move on — call record_assessment_field with whatever they did share, and don't force it.
- Call record_assessment_field whenever you learn something concrete, even partial.
- Call flag_crisis_need immediately if you hear anything safety-critical (nowhere safe tonight, DV, medical emergency, active crisis) — don't wait.
- Call mark_actionable as soon as you have enough to start helping. You do NOT need every topic covered. Never make someone finish a full intake before getting help.
- Call complete_assessment only once they have nothing more to add.
- Keep your responses short and human — this is a conversation, not a questionnaire read aloud.`;

function parseResponses(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function parseProfile(raw: string | null): NeedsProfile {
  if (!raw) return EMPTY_PROFILE;
  try {
    return { ...EMPTY_PROFILE, ...JSON.parse(raw) };
  } catch {
    return EMPTY_PROFILE;
  }
}

export async function getAssessmentById(assessmentId: number, userId: number): Promise<NeedsAssessment | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [row] = await db
    .select()
    .from(needsAssessments)
    .where(and(eq(needsAssessments.id, assessmentId), eq(needsAssessments.userId, userId)))
    .limit(1);

  return row || null;
}

export async function getLatestAssessment(userId: number): Promise<NeedsAssessment | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [row] = await db
    .select()
    .from(needsAssessments)
    .where(eq(needsAssessments.userId, userId))
    .orderBy(desc(needsAssessments.createdAt))
    .limit(1);

  return row || null;
}

async function createAssessment(userId: number): Promise<NeedsAssessment> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [conversation] = await db
    .insert(chatConversations)
    .values({ userId, title: "AI Case Manager assessment", contextType: "case_assessment" })
    .returning({ id: chatConversations.id });

  const [assessment] = await db
    .insert(needsAssessments)
    .values({ userId, conversationId: conversation.id, status: "in_progress", responses: "{}" })
    .returning();

  return assessment;
}

async function extractNeedsProfile(
  assessment: NeedsAssessment,
  targetStatus: "actionable" | "completed"
): Promise<NeedsProfile> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const transcript = assessment.conversationId
    ? await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.conversationId, assessment.conversationId))
        .orderBy(chatMessages.createdAt)
    : [];

  const responses = parseResponses(assessment.responses);
  const existingProfile = parseProfile(assessment.needsProfile);

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are extracting a structured needs profile from a case-management intake conversation. " +
          "Use the recorded topic answers and the raw transcript together. " +
          "needs: distinct underlying problems (not one per topic area — merge related issues, split unrelated ones). " +
          "barriers: concrete things standing in the way of solving those needs (documents, records, transportation, etc). " +
          "strengths: existing assets/resources the person already has. " +
          "preferences: constraints on what kind of help is acceptable to them. " +
          "risks: safety-relevant flags. existingConnections: support/services already in place. " +
          "If a category has nothing to report, return an empty array — do not invent entries.",
      },
      {
        role: "user",
        content:
          `Recorded topic answers so far:\n${JSON.stringify(responses, null, 2)}\n\n` +
          `Previously extracted profile (extend/refine, don't discard real findings):\n${JSON.stringify(existingProfile, null, 2)}\n\n` +
          `Full conversation transcript:\n` +
          transcript.map(m => `${m.role}: ${m.content}`).join("\n"),
      },
    ],
    outputSchema: NEEDS_PROFILE_SCHEMA,
  });

  const content = response.choices[0]?.message?.content;
  const raw = typeof content === "string" ? content : "";
  let profile: NeedsProfile = existingProfile;
  try {
    profile = { ...EMPTY_PROFILE, ...JSON.parse(raw) };
  } catch {
    // keep existing profile if extraction failed to parse
  }

  await db
    .update(needsAssessments)
    .set({
      status: targetStatus,
      needsProfile: JSON.stringify(profile),
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(needsAssessments.id, assessment.id));

  return profile;
}

export type SendAssessmentMessageInput = {
  userId: number;
  assessmentId?: number;
  message: string;
};

export type SendAssessmentMessageResult = {
  assessmentId: number;
  conversationId: number;
  message: string;
  status: string;
};

export async function sendAssessmentMessage(
  input: SendAssessmentMessageInput
): Promise<SendAssessmentMessageResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let assessment = input.assessmentId
    ? await getAssessmentById(input.assessmentId, input.userId)
    : await getLatestAssessment(input.userId);

  if (!assessment || assessment.status === "completed") {
    assessment = await createAssessment(input.userId);
  }

  if (!assessment.conversationId) {
    throw new Error("Assessment is missing its conversation");
  }
  const conversationId = assessment.conversationId;

  const historyBeforeSend = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(chatMessages.createdAt);

  // If the last message is this same user message with no assistant reply yet,
  // this is a retry of a request that failed after saving (e.g. the LLM call
  // errored) — resume from there instead of inserting a duplicate.
  const lastMessage = historyBeforeSend[historyBeforeSend.length - 1];
  const isResuming = lastMessage?.role === "user" && lastMessage.content === input.message;

  if (!isResuming) {
    await db.insert(chatMessages).values({
      conversationId,
      role: "user",
      content: input.message,
    });
  }

  const history = isResuming
    ? historyBeforeSend
    : await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.conversationId, conversationId))
        .orderBy(chatMessages.createdAt);

  const baseMessages: Message[] = [
    { role: "system", content: ASSESSMENT_SYSTEM_PROMPT },
    ...history.map(m => ({ role: m.role as Message["role"], content: m.content })),
  ];

  const response = await invokeLLM({
    messages: baseMessages,
    tools: assessmentTools,
    tool_choice: "auto",
  });

  const choice = response.choices[0];
  let assistantMessage = "";
  let currentAssessment = assessment;

  if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
    const toolResults: Array<{ tool_call_id: string; role: "tool"; content: string }> = [];
    let responses = parseResponses(currentAssessment.responses);

    for (const toolCall of choice.message.tool_calls) {
      const name = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments || "{}");
      let result = "ok";

      if (name === "record_assessment_field") {
        responses = { ...responses, [args.category]: args.answer };
        await db
          .update(needsAssessments)
          .set({ responses: JSON.stringify(responses), updatedAt: Math.floor(Date.now() / 1000) })
          .where(eq(needsAssessments.id, currentAssessment.id));
        result = `Recorded ${args.category}.`;
      } else if (name === "flag_crisis_need") {
        const crisisFlags = Array.isArray(responses._crisisFlags) ? responses._crisisFlags : [];
        responses = { ...responses, _crisisFlags: [...crisisFlags, args.description] };
        await db
          .update(needsAssessments)
          .set({ responses: JSON.stringify(responses), updatedAt: Math.floor(Date.now() / 1000) })
          .where(eq(needsAssessments.id, currentAssessment.id));
        result = "Crisis need flagged.";
      } else if (name === "mark_actionable") {
        await extractNeedsProfile(currentAssessment, "actionable");
        const refreshed = await getAssessmentById(currentAssessment.id, input.userId);
        if (refreshed) currentAssessment = refreshed;
        result = "Assessment marked actionable — a care plan can now be generated.";
      } else if (name === "complete_assessment") {
        await extractNeedsProfile(currentAssessment, "completed");
        const refreshed = await getAssessmentById(currentAssessment.id, input.userId);
        if (refreshed) currentAssessment = refreshed;
        result = "Assessment marked complete.";
      }

      toolResults.push({ tool_call_id: toolCall.id, role: "tool", content: result });
    }

    const finalResponse = await invokeLLM({
      messages: [
        ...baseMessages,
        {
          role: "assistant",
          content: choice.message.content || "",
          tool_calls: choice.message.tool_calls,
        },
        ...toolResults,
      ],
    });

    const finalContent = finalResponse.choices[0]?.message?.content;
    assistantMessage = typeof finalContent === "string" ? finalContent : "";
  } else {
    const content = choice.message.content;
    assistantMessage = typeof content === "string" ? content : "";
  }

  if (!assistantMessage.trim()) {
    assistantMessage = "Got it — tell me more about what's going on.";
  }

  await db.insert(chatMessages).values({
    conversationId,
    role: "assistant",
    content: assistantMessage,
  });

  return {
    assessmentId: currentAssessment.id,
    conversationId,
    message: assistantMessage,
    status: currentAssessment.status,
  };
}
