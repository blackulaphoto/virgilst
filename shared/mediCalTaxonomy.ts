export const MEDI_CAL_CATEGORY_DEFS = [
  { key: "primary_care", label: "Primary Care" },
  { key: "obgyn", label: "OBGYN" },
  { key: "dental", label: "Dental" },
  { key: "pediatrics", label: "Pediatrics" },
  { key: "mental_health", label: "Mental Health" },
  { key: "vision", label: "Vision" },
  { key: "specialty_care", label: "Specialty Care" },
  { key: "urgent_care", label: "Urgent Care" },
  { key: "other", label: "Other" },
] as const;

export type MediCalCategoryKey = (typeof MEDI_CAL_CATEGORY_DEFS)[number]["key"];

const CATEGORY_SET = new Set<MediCalCategoryKey>(MEDI_CAL_CATEGORY_DEFS.map(c => c.key));

const GENERIC_SPECIALTY_VALUES = new Set([
  "available",
  "clinic assignment",
  "physician",
  "nurse",
  "practitioner",
  "none reported",
  "unknown",
]);

const SPECIALTY_NORMALIZATION: Array<[RegExp, string]> = [
  [/\bob\s*[-/]?\s*gyn\b/gi, "obstetrics and gynecology"],
  [/\bobstetrics\s*&\s*gynecology\b/gi, "obstetrics and gynecology"],
  [/\bobstetrics\/gynecology\b/gi, "obstetrics and gynecology"],
  [/\bfamily medicine physician\b/gi, "family medicine"],
  [/\binternal medicine physician\b/gi, "internal medicine"],
  [/\bgeneral practice physician\b/gi, "general practice"],
  [/\bpsychiatry and neurology\b/gi, "psychiatry"],
  [/\bbehavioral health\b/gi, "mental health"],
  [/\boptometry\b/gi, "vision care"],
  [/\bophthalmology\b/gi, "vision care"],
  [/\bdentistry\b/gi, "dental care"],
  [/\bpediatric medicine\b/gi, "pediatrics"],
];

const SPLIT_PATTERN = /[,;]| and /gi;

function toTitleCase(input: string): string {
  return input
    .split(" ")
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function normalizeSpecialty(raw: string): string | null {
  if (!raw) return null;

  let text = raw
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return null;

  for (const [pattern, normalized] of SPECIALTY_NORMALIZATION) {
    text = text.replace(pattern, normalized);
  }

  text = text.replace(/[^a-z0-9/&\-\s]/g, " ").replace(/\s+/g, " ").trim();
  if (!text || GENERIC_SPECIALTY_VALUES.has(text)) return null;

  return toTitleCase(text);
}

export function normalizeSpecialties(values: string[]): string[] {
  const out = new Set<string>();

  for (const value of values || []) {
    const pieces = String(value)
      .split(SPLIT_PATTERN)
      .map(piece => piece.trim())
      .filter(Boolean);

    for (const piece of pieces) {
      const normalized = normalizeSpecialty(piece);
      if (normalized) out.add(normalized);
    }
  }

  return Array.from(out);
}

function includesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some(pattern => pattern.test(text));
}

export function categorizeSpecialties(specialties: string[]): MediCalCategoryKey[] {
  const categories = new Set<MediCalCategoryKey>();
  const normalizedText = specialties.join(" ").toLowerCase();

  if (includesAny(normalizedText, [/\bfamily medicine\b/, /\binternal medicine\b/, /\bgeneral practice\b/])) {
    categories.add("primary_care");
  }
  if (includesAny(normalizedText, [/\bobstetrics\b/, /\bgynecology\b/, /\bobgyn\b/])) {
    categories.add("obgyn");
  }
  if (includesAny(normalizedText, [/\bdental\b/, /\bdentist\b/, /\borthodont/i, /\bperiodont/i])) {
    categories.add("dental");
  }
  if (includesAny(normalizedText, [/\bpediatrics?\b/, /\bpediatric\b/])) {
    categories.add("pediatrics");
  }
  if (includesAny(normalizedText, [/\bpsychiatry\b/, /\bpsychology\b/, /\bmental health\b/, /\bbehavioral\b/])) {
    categories.add("mental_health");
  }
  if (includesAny(normalizedText, [/\bvision\b/, /\boptometry\b/, /\bophthalmology\b/])) {
    categories.add("vision");
  }
  if (includesAny(normalizedText, [/\burgent care\b/, /\bemergency medicine\b/])) {
    categories.add("urgent_care");
  }

  if (categories.size === 0) {
    categories.add("other");
  }

  if (
    includesAny(normalizedText, [
      /\bcardio/,
      /\bdermat/,
      /\bneurolog/,
      /\boncology/,
      /\bnephrolog/,
      /\bgastro/,
      /\burology/,
      /\bendocrin/,
      /\bpodiatr/,
      /\bhemat/,
      /\bpulmon/,
      /\borthopedic/,
      /\brheumat/,
      /\bsurgery/,
    ])
  ) {
    categories.add("specialty_care");
  }

  return Array.from(categories);
}

export function isValidMediCalCategory(input: string | undefined | null): input is MediCalCategoryKey {
  return !!input && CATEGORY_SET.has(input as MediCalCategoryKey);
}

export function expandMediCalSearchTerms(query: string): string[] {
  const normalized = (query || "").toLowerCase().trim();
  if (!normalized) return [];

  const terms = new Set(
    normalized
      .replace(/[^a-z0-9/\-\s]/g, " ")
      .split(/[\s]+/)
      .map(t => t.trim())
      .filter(Boolean)
  );

  const compact = normalized.replace(/\s+/g, " ");

  if (/\bobgyn\b|\bob[-/\s]?gyn\b|\bobstetrics\b|\bgynecology\b/.test(compact)) {
    terms.add("obgyn");
    terms.add("obstetrics");
    terms.add("gynecology");
    terms.add("obstetrics and gynecology");
  }
  if (/\bpcp\b|\bprimary care\b|\bfamily doctor\b/.test(compact)) {
    terms.add("primary care");
    terms.add("family medicine");
    terms.add("internal medicine");
  }
  if (/\bdentist\b|\bdental\b/.test(compact)) {
    terms.add("dental");
    terms.add("dentist");
    terms.add("dentistry");
  }
  if (/\beye\b|\bvision\b|\boptomet/.test(compact)) {
    terms.add("vision");
    terms.add("optometry");
    terms.add("ophthalmology");
  }
  if (/\bkid\b|\bchild\b|\bpediatric/.test(compact)) {
    terms.add("pediatrics");
    terms.add("pediatric");
  }
  if (/\btherapy\b|\bpsychiat/.test(compact)) {
    terms.add("mental health");
    terms.add("psychiatry");
    terms.add("psychology");
  }

  return Array.from(terms);
}

export function buildProviderSearchTerms(input: {
  providerName?: string | null;
  facilityName?: string | null;
  city?: string | null;
  specialties?: string[];
  normalizedSpecialties?: string[];
  categories?: MediCalCategoryKey[];
}): string {
  const chunks: string[] = [];
  if (input.providerName) chunks.push(input.providerName);
  if (input.facilityName) chunks.push(input.facilityName);
  if (input.city) chunks.push(input.city);
  (input.specialties || []).forEach(s => chunks.push(s));
  (input.normalizedSpecialties || []).forEach(s => chunks.push(s));
  (input.categories || []).forEach(c => chunks.push(c.replace(/_/g, " ")));

  return chunks
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
