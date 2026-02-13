import "dotenv/config";
import { readFileSync } from "node:fs";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { resources } from "./drizzle/schema";

const client = createClient({
  url: "file:./virgil_st_dev.db",
});

const db = drizzle(client);

type ResourceSeed = {
  name: string;
  type: "transportation" | "housing" | "shelter" | "legal";
  description: string;
  phone?: string;
  website?: string;
  hours?: string;
  filters: Record<string, unknown>;
};

const sourcePath = "knowledge files/TRANSPORTATION AND HOUSING OPTIONS.txt";
const rawSource = readFileSync(sourcePath, "utf8");

const seeds: ResourceSeed[] = [
  {
    name: "Metro LIFE Program (Low-Income Fare is Easy)",
    type: "transportation",
    description:
      "LA County low-income transit program providing up to 20 free rides monthly or discounted passes, including a free 90-day pass for new participants.",
    phone: "213-922-2378",
    website: "https://www.metro.net/riding/fares/life/",
    hours: "Monthly enrollment via TAP account",
    filters: {
      freeRides: true,
      lowIncome: true,
      transit: true,
      sourceFile: "TRANSPORTATION AND HOUSING OPTIONS.txt",
    },
  },
  {
    name: "LADOT Cityride",
    type: "transportation",
    description:
      "Discounted transportation for Los Angeles seniors and eligible riders with disabilities, including DASH rides and subsidized taxi/dial-a-ride value.",
    phone: "818-808-7433",
    website: "https://www.ladottransit.com/cityride/",
    filters: {
      seniorSupport: true,
      disabilitySupport: true,
      transit: true,
      sourceFile: "TRANSPORTATION AND HOUSING OPTIONS.txt",
    },
  },
  {
    name: "Metro GoPass Program",
    type: "transportation",
    description:
      "Free unlimited rides for eligible K-12 and community college students at participating schools across Metro and partner systems.",
    phone: "213-922-6235",
    website: "https://www.metro.net/riding/fares/gopass/",
    filters: {
      students: true,
      freeRides: true,
      transit: true,
      sourceFile: "TRANSPORTATION AND HOUSING OPTIONS.txt",
    },
  },
  {
    name: "Access Services Free-Fare Program",
    type: "transportation",
    description:
      "ADA paratransit riders can use an Access ID for free fares on participating Los Angeles County bus and rail services.",
    phone: "800-827-0829",
    website: "https://accessla.org/",
    filters: {
      disabilitySupport: true,
      freeRides: true,
      transit: true,
      sourceFile: "TRANSPORTATION AND HOUSING OPTIONS.txt",
    },
  },
  {
    name: "DPSS GROW/START Transportation Assistance",
    type: "transportation",
    description:
      "Transportation support for General Relief GROW/START participants, including bus passes or gas vouchers for required program activities.",
    phone: "866-613-3777",
    website: "https://dpss.lacounty.gov/",
    filters: {
      generalRelief: true,
      workforceSupport: true,
      transportationAssistance: true,
      sourceFile: "TRANSPORTATION AND HOUSING OPTIONS.txt",
    },
  },
  {
    name: "LACDA Section 8 Housing Choice Voucher",
    type: "housing",
    description:
      "Rental assistance for very-low-income households, seniors, and people with disabilities in LA County through voucher subsidies.",
    phone: "626-262-4510",
    website: "https://www.lacda.org/",
    filters: {
      section8: true,
      voucherProgram: true,
      lowIncome: true,
      sourceFile: "TRANSPORTATION AND HOUSING OPTIONS.txt",
    },
  },
  {
    name: "HACLA Housing Choice Voucher Program",
    type: "housing",
    description:
      "Section 8, project-based vouchers, and emergency voucher pathways administered for residents in the City of Los Angeles.",
    phone: "213-523-7328",
    website: "https://www.hacla.org/",
    filters: {
      section8: true,
      cityOfLA: true,
      voucherProgram: true,
      sourceFile: "TRANSPORTATION AND HOUSING OPTIONS.txt",
    },
  },
  {
    name: "Emergency Housing Vouchers (EHV) via CES",
    type: "housing",
    description:
      "HUD-funded rental vouchers for people who are homeless, at risk, or fleeing domestic violence, accessed through Coordinated Entry referrals.",
    phone: "800-548-6047",
    website: "https://www.hud.gov/ehv",
    filters: {
      emergencyVoucher: true,
      homelessPriority: true,
      coordinatedEntryRequired: true,
      sourceFile: "TRANSPORTATION AND HOUSING OPTIONS.txt",
    },
  },
  {
    name: "CalWORKs Homeless Assistance Programs (DPSS)",
    type: "housing",
    description:
      "Housing stabilization support for CalWORKs families including temporary shelter help, move-in assistance, rent arrears support, and short-term rental aid.",
    phone: "866-613-3777",
    website: "https://dpss.lacounty.gov/",
    filters: {
      familySupport: true,
      rentAssistance: true,
      homelessnessPrevention: true,
      sourceFile: "TRANSPORTATION AND HOUSING OPTIONS.txt",
    },
  },
  {
    name: "Housing for Health (LA County DHS)",
    type: "housing",
    description:
      "Permanent supportive housing and intensive services for chronically homeless people with complex medical or behavioral health needs.",
    phone: "323-274-3600",
    website: "https://dhs.lacounty.gov/housing-for-health/",
    filters: {
      permanentSupportiveHousing: true,
      chronicHomelessness: true,
      caseManagement: true,
      sourceFile: "TRANSPORTATION AND HOUSING OPTIONS.txt",
    },
  },
  {
    name: "HOPWA (Housing Opportunities for Persons with AIDS)",
    type: "housing",
    description:
      "Housing subsidies and supportive services for low-income people living with HIV/AIDS, including short-term rent and utility support.",
    phone: "877-724-4775",
    website: "https://housing.lacity.org/residents/hopwa",
    filters: {
      hivAidsSupport: true,
      rentUtilityAssistance: true,
      lowIncome: true,
      sourceFile: "TRANSPORTATION AND HOUSING OPTIONS.txt",
    },
  },
  {
    name: "LA County Housing Resource Center",
    type: "housing",
    description:
      "County housing search and referral platform for affordable, special-needs, and emergency housing listings in Los Angeles County.",
    phone: "877-428-8844",
    website: "https://housing.lacounty.gov/",
    filters: {
      housingSearch: true,
      affordableHousing: true,
      emergencyHousing: true,
      sourceFile: "TRANSPORTATION AND HOUSING OPTIONS.txt",
    },
  },
  {
    name: "Project Roomkey (LAHSA and LA County)",
    type: "shelter",
    description:
      "Temporary hotel/motel shelter placements for high-risk people experiencing homelessness, based on screening and availability.",
    phone: "800-548-6047",
    website: "https://www.lahsa.org/",
    filters: {
      emergencyShelter: true,
      highRiskPlacement: true,
      homelessServices: true,
      sourceFile: "TRANSPORTATION AND HOUSING OPTIONS.txt",
    },
  },
  {
    name: "Stay Housed LA",
    type: "legal",
    description:
      "Free legal assistance, mediation, and eviction defense support for tenants facing displacement or harassment in LA County.",
    phone: "833-223-7368",
    website: "https://www.stayhousedla.org/",
    filters: {
      tenantRights: true,
      evictionDefense: true,
      legalAid: true,
      sourceFile: "TRANSPORTATION AND HOUSING OPTIONS.txt",
    },
  },
  {
    name: "LACDA General Housing Resources",
    type: "housing",
    description:
      "General housing support from LACDA, including affordable housing programs, landlord incentives, and related housing opportunities.",
    phone: "626-262-4511",
    website: "https://www.lacda.org/",
    filters: {
      affordableHousing: true,
      countyProgram: true,
      referrals: true,
      sourceFile: "TRANSPORTATION AND HOUSING OPTIONS.txt",
    },
  },
  {
    name: "LA Housing Department Housing Information",
    type: "housing",
    description:
      "City housing information portal with affordable rental listings and housing support navigation for Los Angeles residents.",
    phone: "866-557-7368",
    website: "https://housing.lacity.org/",
    filters: {
      housingSearch: true,
      cityProgram: true,
      affordableHousing: true,
      sourceFile: "TRANSPORTATION AND HOUSING OPTIONS.txt",
    },
  },
];

function sourceLooksCorrect(): boolean {
  const lower = rawSource.toLowerCase();
  return (
    lower.includes("transportation and housing options") &&
    lower.includes("metro life") &&
    lower.includes("section 8")
  );
}

async function importTransportationHousingOptions() {
  console.log("Importing transportation and housing resources from source file");
  console.log(`Source: ${sourcePath}\n`);

  if (!sourceLooksCorrect()) {
    throw new Error("Source file content did not match expected transportation/housing dataset.");
  }

  let imported = 0;
  let skipped = 0;

  for (const item of seeds) {
    const existing = await db
      .select({ id: resources.id })
      .from(resources)
      .where(eq(resources.name, item.name))
      .limit(1);

    if (existing.length > 0) {
      skipped += 1;
      console.log(`Skipped existing: ${item.name}`);
      continue;
    }

    await db.insert(resources).values({
      name: item.name,
      type: item.type,
      description: item.description,
      phone: item.phone ?? null,
      website: item.website ?? null,
      hours: item.hours ?? null,
      filters: JSON.stringify(item.filters),
      isVerified: 1,
    });

    imported += 1;
    console.log(`Imported: ${item.name}`);
  }

  console.log("\nImport complete");
  console.log(`Imported: ${imported}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total in seed: ${seeds.length}`);
}

importTransportationHousingOptions()
  .catch((error) => {
    console.error("Import failed:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    client.close();
  });
