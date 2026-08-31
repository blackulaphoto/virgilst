import type { AssessmentTopic } from "./assessmentTopics";

export type DeterministicGuidance = {
  response: string;
  category: AssessmentTopic;
  needId: string;
  priorityTier: "immediate" | "high" | "medium" | "long_term";
};

const CRISIS = {
  suicide:
    "Call or text 988 now, or use the 988 Lifeline chat at 988lifeline.org. If you may act now or cannot stay safe, call 911 or go to the nearest emergency department. Move away from anything you could use to hurt yourself and stay with another person if you can. Are you in immediate danger right now?",
  threat:
    "Get to a safer place if you can do so without confronting the person, then call 911 now. If speaking could put you at risk, use your phone's emergency SOS or text 911 where available. Are you able to move somewhere safer right now?",
  overdose:
    "Call 911 now and say the person is not breathing after a suspected overdose. Follow the dispatcher's instructions. Give naloxone if it is available and you know how, and begin CPR if the dispatcher tells you to. Do not leave the person alone.",
  domesticViolence:
    "If you are in immediate danger, move to a safer place without confronting your partner and call 911. For confidential safety planning, call 800-799-SAFE (7233), text START to 88788, or use thehotline.org. If your device may be monitored, use a safer device when possible. Are you physically safe enough to make a call or text?",
} as const;

export function classifyCrisis(message: string): keyof typeof CRISIS | null {
  const text = message.toLowerCase();
  if (/\b(kill myself|suicide|suicidal|end my life|hurt myself)\b/.test(text)) return "suicide";
  if (/\b(overdos(?:e|ed)|not breathing|stopped breathing)\b/.test(text)) return "overdose";
  if (/\b(gun|weapon|threatening me|immediate physical danger|attacking me)\b/.test(text)) return "threat";
  if (/\b(partner|spouse|boyfriend|girlfriend|domestic violence|dv)\b/.test(text) && /\b(hit|hurt|attack|unsafe|danger|threat|abuse)\b/.test(text)) return "domesticViolence";
  return null;
}

export function deterministicCrisisGuidance(message: string): DeterministicGuidance | null {
  const crisis = classifyCrisis(message);
  if (!crisis) return null;
  return {
    response: CRISIS[crisis],
    category: crisis === "domesticViolence" ? "domestic_violence" : "crisis",
    needId: `crisis_${crisis}`,
    priorityTier: "immediate",
  };
}

export function deterministicActionGuidance(message: string): DeterministicGuidance | null {
  const crisis = deterministicCrisisGuidance(message);
  if (crisis) return crisis;
  const text = message.toLowerCase();

  if (/\b(denied|rejected)\b.*\bcalfresh\b|\bcalfresh\b.*\b(denied|rejected)\b/.test(text)) {
    return {
      category: "benefits",
      needId: "calfresh_denial",
      priorityTier: "high",
      response:
        "First, find your CalFresh denial notice and the stated reason. If it is a missing-document issue, submit the requested proof and ask LA County DPSS to review the case; if you disagree with the decision, the notice should explain how to request a state hearing. You can contact LA County DPSS at 866-613-3777 or use BenefitsCal.com for your case and document uploads. Do not discard the notice, and use the deadline printed on it rather than guessing. What reason does the notice give?",
    };
  }

  if (/\bmedi[- ]?cal\b|\bdpss\b/.test(text)) {
    return {
      category: "insurance",
      needId: "medi_cal_application",
      priorityTier: "high",
      response:
        "Start a Medi-Cal application through BenefitsCal.com or LA County DPSS at 866-613-3777. DPSS is the Los Angeles County agency that handles Medi-Cal, CalFresh, General Relief, and CalWORKs applications. You can start the application even if you do not have every document yet; provide what you have and ask DPSS what alternatives it will accept. Do you already have a BenefitsCal account or a DPSS case number?",
    };
  }

  if (/\b(lost|replace|missing|no)\b.*\b(id|identification)\b.*\b(benefit|calfresh|medi[- ]?cal|dpss|gr|general relief)\b|\bbenefit/.test(text) && /\b(no|lost|missing)\b.*\bid\b/.test(text)) {
    return {
      category: "identification",
      needId: "id_and_benefits",
      priorityTier: "high",
      response:
        "Start the benefits application now rather than waiting for a replacement ID. LA County DPSS can tell you which alternative identity documents it can accept for General Relief, CalFresh, or Medi-Cal; apply through BenefitsCal.com or call 866-613-3777. In parallel, start the California DMV replacement-ID process and ask DPSS or a document-assistance provider about fee or document barriers. Which benefit do you need first?",
    };
  }

  if (/\b(homeless|nowhere.*sleep|sleep tonight|shelter tonight)\b/.test(text)) {
    const detailed = /\b(food|eat|hungry|charge|battery|phone|\$\d|money)\b/.test(text);
    return {
      category: "housing",
      needId: "homeless_tonight_la",
      priorityTier: "immediate",
      response: detailed
        ? "Tonight: if you are in immediate danger, call 911. Otherwise call 211 LA by dialing 2-1-1 for current LA County shelter navigation; tell them you also need food, a place to charge your phone, and transportation help, and conserve your battery while you wait. Shelter availability changes, so I cannot promise a bed. Tomorrow: contact LA County DPSS at 866-613-3777 or BenefitsCal.com to start CalFresh, General Relief, and Medi-Cal, then ask about document and longer-term housing navigation. What neighborhood or nearest cross street are you in?"
        : "Tonight, call 211 LA by dialing 2-1-1 for current LA County shelter navigation. If you are in immediate danger, call 911. Shelter availability changes, so I cannot promise a bed; keep your phone available for callbacks. If you tell me your neighborhood or nearest cross street, I can narrow verified LA-area options.",
    };
  }

  if (/\b(shower|charge my phone|charging)\b/.test(text) && /\b(eat|food|meal)\b/.test(text)) {
    return {
      category: "safety",
      needId: "basic_needs_day_services",
      priorityTier: "immediate",
      response:
        "Call 211 LA by dialing 2-1-1 and ask for a currently open day center near you with meals, showers, and phone charging. Hours and availability change, so confirm before traveling. If your battery is low, ask 211 to prioritize the closest option and any transportation help. What neighborhood or nearest cross street are you in?",
    };
  }

  if (/\b(residential treatment|sober housing|sober living)\b/.test(text)) {
    return {
      category: "substance_use",
      needId: "recovery_continuity",
      priorityTier: "high",
      response:
        "Separate this into four tracks: (1) confirm a sober-living placement and price directly with an LA-area provider—do not assume a bed or insurance coverage; (2) ask your discharge team or Medi-Cal plan for an outpatient assessment; (3) use Virgil's meetings directory for a meeting today; and (4) start or update Medi-Cal through BenefitsCal.com or LA County DPSS at 866-613-3777. If you may lose a safe place tonight, call 211 LA now. What LA neighborhood are you trying to stay near?",
    };
  }

  if (/\b(no money|can't afford|cannot afford)\b.*\b(transport|bus|ride)|\btransportation\b/.test(text)) {
    return {
      category: "transportation",
      needId: "transportation_cost",
      priorityTier: "high",
      response:
        "First, call 211 LA at 2-1-1 and ask for transportation assistance tied to the appointment or service you need; programs vary by purpose and eligibility. If the trip is for medical care, ask your Medi-Cal plan about non-emergency medical transportation. I cannot promise a voucher without a verified program match. Where do you need to travel from and to?",
    };
  }

  return null;
}

export function extractNamedResourceQuery(message: string): string | null {
  const match = message.match(/(?:apply for|where (?:do|can) i apply for|is|does|can i use|tell me about)\s+(?:the\s+)?(.{4,120}?(?:program|grant|voucher|shelter|center|clinic))(?:\?|\.|,|\s+(?:accepting|open|at|help|offer|provide)\b|$)/i);
  return match?.[1]?.trim() ?? null;
}

export function normalizeEntityName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function findVerifiedEntityName(requested: string, trustedNames: string[]): string | null {
  const target = normalizeEntityName(requested);
  return trustedNames.find(name => normalizeEntityName(name) === target) ?? null;
}

export function safePhone(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (/\b2-?1-?1\b/.test(value)) return value.trim();
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15 ? value.trim() : undefined;
}

export function containsUngroundedConcreteClaim(message: string, trustedNames: string[]): boolean {
  if (/https?:\/\/|www\.|\b\$\d|\b\d{3}[-. )]+\d{3}[-. ]+\d{4}\b/i.test(message)) return true;
  const namedEntity = extractNamedResourceQuery(`Tell me about ${message}`);
  return Boolean(namedEntity && !findVerifiedEntityName(namedEntity, trustedNames));
}
