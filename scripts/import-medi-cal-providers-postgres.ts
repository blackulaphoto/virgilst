import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import {
  buildProviderSearchTerms,
  categorizeSpecialties,
  normalizeSpecialties,
  type MediCalCategoryKey,
} from "../shared/mediCalTaxonomy";

type ParsedProvider = {
  providerName: string;
  facilityName: string | null;
  address: string | null;
  city: string | null;
  state: string;
  zipCode: string | null;
  phone: string | null;
  npi: string;
  stateLicense: string | null;
  distance: string | null;
  specialties: string[];
  normalizedSpecialties: string[];
  gender: string | null;
  languagesSpoken: string[];
  boardCertifications: string[];
  networks: string[];
  hospitalAffiliations: string[];
  medicalGroups: string[];
  categories: MediCalCategoryKey[];
  searchTerms: string;
};

const SOURCE_PATH = path.resolve(process.cwd(), "knowledge files", "Provider Search Results - Medi-cal.txt");

const SECTION_MARKERS = [
  "State License Number:",
  "Distance:",
  "Specialties:",
  "Gender:",
  "Languages Spoken:",
  "Board Certifications:",
  "Networks:",
  "Hospital Affiliations:",
  "Medical Groups:",
];

const FACILITY_WORDS = /\b(MEDICAL|CENTER|CLINIC|HOSPITAL|HEALTH|GROUP|NETWORK|PLAN|IPA|ASSOCIATES)\b/i;
const BAD_PROVIDER_VALUES = new Set([
  "PHYSICIAN",
  "PRACTITIONER",
  "SURGERY",
  "NONE REPORTED",
  "UNKNOWN",
  "SPANISH",
  "FARSI",
  "ENGLISH",
]);

function cleanLine(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function startsProviderRecord(line: string): boolean {
  return /^NPI:\s*/i.test(line);
}

function parseDelimitedList(value: string): string[] {
  return value
    .split(/[,;]+/)
    .map(item => cleanLine(item))
    .filter(item => item.length > 0 && !/^none reported$/i.test(item));
}

function parseCityStateZip(lines: string[]): { city: string | null; state: string; zipCode: string | null; consumed: Set<number> } {
  const consumed = new Set<number>();
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const fullMatch = line.match(/^(.+?),\s*([A-Z]{2})\s+(\d{5})(?:-\d{4})?$/i);
    if (fullMatch) {
      consumed.add(i);
      return {
        city: cleanLine(fullMatch[1].toUpperCase()),
        state: fullMatch[2].toUpperCase(),
        zipCode: fullMatch[3],
        consumed,
      };
    }

    const splitMatch = line.match(/^(.+?),\s*([A-Z]{2})$/i);
    if (splitMatch && i + 1 < lines.length) {
      const next = lines[i + 1].match(/^(\d{5})(?:-\d{4})?$/);
      if (next) {
        consumed.add(i);
        consumed.add(i + 1);
        return {
          city: cleanLine(splitMatch[1].toUpperCase()),
          state: splitMatch[2].toUpperCase(),
          zipCode: next[1],
          consumed,
        };
      }
    }
  }

  return { city: null, state: "CA", zipCode: null, consumed };
}

function parsePrelude(lines: string[]): {
  providerName: string | null;
  facilityName: string | null;
  address: string | null;
  city: string | null;
  state: string;
  zipCode: string | null;
  phone: string | null;
} {
  const cleaned = lines
    .map(cleanLine)
    .filter(line =>
      line.length > 0 &&
      !/^Page\s+\d+$/i.test(line) &&
      !/^Provider Search Results/i.test(line) &&
      !/^Within\s+/i.test(line) &&
      !/^Specialties:\s*Any Specialty/i.test(line)
    );

  const phoneLine = cleaned.find(line => /^\(?\d{3}\)?[\s-]*\d{3}-\d{4}$/.test(line)) || null;
  const cityStateZip = parseCityStateZip(cleaned);

  const addressParts = cleaned.filter((line, idx) => {
    if (cityStateZip.consumed.has(idx)) return false;
    if (/^\(?\d{3}\)?[\s-]*\d{3}-\d{4}$/.test(line)) return false;
    return /^\d{1,6}\s+/.test(line) || /\b(SUITE|STE|BLVD|AVE|ST|DR|RD|WAY)\b/i.test(line);
  });
  const address = addressParts.length > 0 ? addressParts.join(" ") : null;

  const identityCandidates = cleaned.filter((line, idx) => {
    if (cityStateZip.consumed.has(idx)) return false;
    if (line === phoneLine) return false;
    if (addressParts.includes(line)) return false;
    if (SECTION_MARKERS.some(marker => line.startsWith(marker))) return false;
    return true;
  });

  const personName = [...identityCandidates].reverse().find(line => {
    const tokenCount = line.split(" ").filter(Boolean).length;
    return tokenCount >= 2 && tokenCount <= 5 && !FACILITY_WORDS.test(line);
  });

  const fallbackName = identityCandidates.find(line => !BAD_PROVIDER_VALUES.has(line.toUpperCase())) || null;
  const providerName = personName || fallbackName;

  const facilityName = identityCandidates.find(line => line !== providerName && FACILITY_WORDS.test(line)) || null;

  return {
    providerName,
    facilityName,
    address,
    city: cityStateZip.city,
    state: cityStateZip.state,
    zipCode: cityStateZip.zipCode,
    phone: phoneLine,
  };
}

function collectPrelude(lines: string[], indexBeforeNpi: number): string[] {
  const prelude: string[] = [];
  const maxLookback = 20;
  for (let i = indexBeforeNpi; i >= 0 && prelude.length < maxLookback; i -= 1) {
    const line = cleanLine(lines[i] || "");
    if (!line) break;
    if (
      startsProviderRecord(line) ||
      SECTION_MARKERS.some(marker => line.startsWith(marker)) ||
      /^Page\s+\d+$/i.test(line) ||
      /^Provider Search Results/i.test(line) ||
      /^Within\s+/i.test(line)
    ) {
      break;
    }
    prelude.push(line);
  }
  return prelude.reverse();
}

function parseProvidersFromText(content: string): ParsedProvider[] {
  const lines = content.split(/\r?\n/);
  const providers: ParsedProvider[] = [];

  let idx = 0;
  while (idx < lines.length) {
    const current = cleanLine(lines[idx] || "");
    if (!startsProviderRecord(current)) {
      idx += 1;
      continue;
    }

    const npi = cleanLine(current.replace(/^NPI:\s*/i, ""));
    const preludeLines = collectPrelude(lines, idx - 1);

    const sections: Record<string, string[]> = {
      stateLicense: [],
      distance: [],
      specialties: [],
      gender: [],
      languages: [],
      certifications: [],
      networks: [],
      hospitals: [],
      medicalGroups: [],
    };

    let currentSection: keyof typeof sections | null = null;
    let cursor = idx + 1;
    while (cursor < lines.length) {
      const line = cleanLine(lines[cursor] || "");
      if (startsProviderRecord(line)) break;
      if (!line || /^Page\s+\d+$/i.test(line)) {
        cursor += 1;
        continue;
      }

      if (/^State License Number:/i.test(line)) {
        currentSection = "stateLicense";
        const value = cleanLine(line.replace(/^State License Number:/i, ""));
        if (value) sections.stateLicense.push(value);
      } else if (/^Distance:/i.test(line)) {
        currentSection = "distance";
        const value = cleanLine(line.replace(/^Distance:/i, ""));
        if (value) sections.distance.push(value);
      } else if (/^Specialties:/i.test(line)) {
        currentSection = "specialties";
        const value = cleanLine(line.replace(/^Specialties:/i, ""));
        if (value) sections.specialties.push(value);
      } else if (/^Gender:/i.test(line)) {
        currentSection = "gender";
        const value = cleanLine(line.replace(/^Gender:/i, ""));
        if (value) sections.gender.push(value);
      } else if (/^Languages Spoken:/i.test(line)) {
        currentSection = "languages";
        const value = cleanLine(line.replace(/^Languages Spoken:/i, ""));
        if (value) sections.languages.push(value);
      } else if (/^Board Certifications:/i.test(line)) {
        currentSection = "certifications";
        const value = cleanLine(line.replace(/^Board Certifications:/i, ""));
        if (value) sections.certifications.push(value);
      } else if (/^Networks:/i.test(line)) {
        currentSection = "networks";
        const value = cleanLine(line.replace(/^Networks:/i, ""));
        if (value) sections.networks.push(value);
      } else if (/^Hospital Affiliations:/i.test(line)) {
        currentSection = "hospitals";
        const value = cleanLine(line.replace(/^Hospital Affiliations:/i, ""));
        if (value) sections.hospitals.push(value);
      } else if (/^Medical Groups:/i.test(line)) {
        currentSection = "medicalGroups";
        const value = cleanLine(line.replace(/^Medical Groups:/i, ""));
        if (value) sections.medicalGroups.push(value);
      } else if (currentSection) {
        sections[currentSection].push(line);
      }

      cursor += 1;
    }

    const preludeData = parsePrelude(preludeLines);
    const specialties = parseDelimitedList(sections.specialties.join(", "));
    const normalizedSpecialties = normalizeSpecialties(specialties);
    const categories = categorizeSpecialties(normalizedSpecialties);
    const providerName = preludeData.providerName ? cleanLine(preludeData.providerName) : null;

    const looksInvalidName =
      !providerName ||
      providerName.length < 3 ||
      BAD_PROVIDER_VALUES.has(providerName.toUpperCase());

    if (!looksInvalidName && /^\d{10}$/.test(npi)) {
      const searchTerms = buildProviderSearchTerms({
        providerName,
        facilityName: preludeData.facilityName,
        city: preludeData.city,
        specialties,
        normalizedSpecialties,
        categories,
      });

      providers.push({
        providerName,
        facilityName: preludeData.facilityName,
        address: preludeData.address,
        city: preludeData.city,
        state: preludeData.state,
        zipCode: preludeData.zipCode,
        phone: preludeData.phone,
        npi,
        stateLicense: sections.stateLicense.length > 0 ? cleanLine(sections.stateLicense.join(" ")) : null,
        distance: sections.distance.length > 0 ? cleanLine(sections.distance.join(" ")) : null,
        specialties,
        normalizedSpecialties,
        gender: sections.gender.length > 0 ? cleanLine(sections.gender.join(" ")) : null,
        languagesSpoken: parseDelimitedList(sections.languages.join(", ")),
        boardCertifications: parseDelimitedList(sections.certifications.join(", ")),
        networks: parseDelimitedList(sections.networks.join(", ")),
        hospitalAffiliations: parseDelimitedList(sections.hospitals.join(", ")),
        medicalGroups: parseDelimitedList(sections.medicalGroups.join(", ")),
        categories,
        searchTerms,
      });
    }

    idx = cursor;
  }

  const deduped = new Map<string, ParsedProvider>();
  for (const provider of providers) {
    const key = `${provider.npi}:${provider.providerName.toLowerCase()}`;
    if (!deduped.has(key)) {
      deduped.set(key, provider);
    }
  }

  return Array.from(deduped.values());
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const source = await fs.readFile(SOURCE_PATH, "utf8");
  const parsed = parseProvidersFromText(source);

  const categoryCounts = new Map<string, number>();
  parsed.forEach(provider => {
    provider.categories.forEach(category => {
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    });
  });

  console.log(`[medi-cal import] Parsed providers: ${parsed.length}`);

  const sqlClient = postgres(databaseUrl, {
    max: 1,
  });

  try {
    await sqlClient.begin(async tx => {
      await tx.unsafe("DELETE FROM provider_categories");
      await tx.unsafe("DELETE FROM medi_cal_providers");

      const insertProviderSql = `
        INSERT INTO medi_cal_providers (
          "providerName",
          "facilityName",
          address,
          city,
          state,
          "zipCode",
          phone,
          npi,
          "stateLicense",
          distance,
          specialties,
          "normalizedSpecialties",
          "searchTerms",
          gender,
          "languagesSpoken",
          "boardCertifications",
          networks,
          "hospitalAffiliations",
          "medicalGroups",
          "isVerified"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        )
        RETURNING id
      `;

      const insertCategorySql = `
        INSERT INTO provider_categories ("providerId", "categoryKey")
        VALUES ($1, $2)
      `;

      for (const provider of parsed) {
        const inserted = await tx.unsafe(insertProviderSql, [
          provider.providerName,
          provider.facilityName,
          provider.address,
          provider.city,
          provider.state,
          provider.zipCode,
          provider.phone,
          provider.npi,
          provider.stateLicense,
          provider.distance,
          JSON.stringify(provider.specialties),
          JSON.stringify(provider.normalizedSpecialties),
          provider.searchTerms,
          provider.gender,
          JSON.stringify(provider.languagesSpoken),
          JSON.stringify(provider.boardCertifications),
          JSON.stringify(provider.networks),
          JSON.stringify(provider.hospitalAffiliations),
          JSON.stringify(provider.medicalGroups),
          1,
        ]);

        const providerId = Number(inserted[0]?.id);
        for (const category of provider.categories) {
          await tx.unsafe(insertCategorySql, [providerId, category]);
        }
      }
    });

    console.log("[medi-cal import] Import complete");
    console.log("[medi-cal import] Category distribution:");
    for (const [category, count] of Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1])) {
      console.log(`  - ${category}: ${count}`);
    }
  } finally {
    await sqlClient.end();
  }
}

main().catch(error => {
  console.error("[medi-cal import] Failed:", error);
  process.exit(1);
});
