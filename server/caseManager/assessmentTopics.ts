/**
 * Topic areas covered by the AI Case Manager needs assessment.
 * Shared between assessmentTools.ts (tool schema enum), assessmentEngine.ts
 * (adaptive system prompt), and carePlanGenerator.ts (goal category alignment).
 */
export const ASSESSMENT_TOPICS = [
  "housing",
  "food",
  "income",
  "employment",
  "insurance",
  "primary_care",
  "dental_care",
  "vision_care",
  "mental_health",
  "substance_use",
  "medications",
  "transportation",
  "identification",
  "benefits",
  "legal",
  "family_support",
  "veteran_status",
  "domestic_violence",
  "safety",
  "crisis",
] as const;

export type AssessmentTopic = (typeof ASSESSMENT_TOPICS)[number];
