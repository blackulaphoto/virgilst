/**
 * AI Case Manager assessment tool definitions.
 * Separate from virgilTools.ts — this is a different conversation persona
 * (structured intake) than the general Virgil resource assistant.
 */
import type { Tool } from "../_core/llm";
import { ASSESSMENT_TOPICS } from "./assessmentTopics";

export const assessmentTools: Tool[] = [
  {
    type: "function",
    function: {
      name: "record_assessment_field",
      description:
        "Record what the person told you about one topic area of their situation. Call this every time you learn something concrete about a topic, even partial information. Skip topics that don't apply to them.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: [...ASSESSMENT_TOPICS],
            description: "Which topic area this answer belongs to.",
          },
          answer: {
            type: "string",
            description: "A concise summary of what they told you about this topic.",
          },
        },
        required: ["category", "answer"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "flag_crisis_need",
      description:
        "Flag an immediate safety or crisis issue (e.g. domestic violence, nowhere safe to sleep tonight, medical emergency, active suicidal ideation). Use this the moment such a need comes up, don't wait for the rest of the interview.",
      parameters: {
        type: "object",
        properties: {
          description: {
            type: "string",
            description: "What the crisis or immediate safety issue is.",
          },
        },
        required: ["description"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mark_actionable",
      description:
        "Call this as soon as you have enough information to start helping — you do NOT need to have covered every topic. If someone is in crisis or clearly states a few concrete needs, mark actionable quickly rather than continuing to interview them. This never blocks help behind a full intake.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "complete_assessment",
      description:
        "Call this once the person has nothing more to add and you've covered the topics relevant to their situation.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
];
