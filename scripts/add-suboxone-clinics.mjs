import postgres from "postgres";

function resolveDatabaseUrl() {
  const privateUrl = process.env.DATABASE_URL;
  const publicUrl = process.env.DATABASE_PUBLIC_URL;

  if (!privateUrl && !publicUrl) {
    throw new Error("DATABASE_URL or DATABASE_PUBLIC_URL is required");
  }
  if (!privateUrl) return { url: publicUrl, source: "DATABASE_PUBLIC_URL" };

  try {
    const hostname = new URL(privateUrl).hostname.toLowerCase();
    const usesInternalHost =
      hostname.endsWith(".railway.internal") || hostname === "postgres.railway.internal";
    if (usesInternalHost && publicUrl) {
      return { url: publicUrl, source: "DATABASE_PUBLIC_URL" };
    }
  } catch {
    // Fall back to DATABASE_URL
  }
  return { url: privateUrl, source: "DATABASE_URL" };
}

const resolvedDb = resolveDatabaseUrl();
const sql = postgres(resolvedDb.url);

const clinics = [
  {
    name: "Wesley Health Centers - Skid Row / San Pedro St",
    type: "outpatient",
    address: "",
    city: "Los Angeles",
    zip: "",
    phone: "(562) 867-7999",
    website: "https://wesleyhealthcenters.com",
    acceptsMediCal: 1,
    acceptsPrivateInsurance: 1,
    priceRange: "Sliding scale",
    services: ["Suboxone", "MAT", "Addiction treatment", "Primary care"],
    notes:
      "Community health center with MAT services including buprenorphine/Suboxone; low-cost and sliding-scale support.",
  },
  {
    name: "BAART Programs - Beverly",
    type: "outpatient",
    address: "",
    city: "Los Angeles",
    zip: "",
    phone: "(213) 722-4217",
    website: "https://baartprograms.com/locations/california/beverly/",
    acceptsMediCal: 1,
    acceptsPrivateInsurance: 1,
    priceRange: "Varies",
    services: ["Suboxone", "MAT", "Buprenorphine", "Counseling"],
    notes: "Opioid treatment with methadone and buprenorphine/Suboxone plus counseling.",
  },
  {
    name: "BAART Programs - Southeast",
    type: "outpatient",
    address: "",
    city: "Los Angeles",
    zip: "",
    phone: "(323) 638-5071",
    website: "https://baartprograms.com/locations/california/southeast/",
    acceptsMediCal: 1,
    acceptsPrivateInsurance: 1,
    priceRange: "Varies",
    services: ["Suboxone", "MAT", "Buprenorphine", "Case management"],
    notes: "Opioid treatment program with methadone and Suboxone services.",
  },
  {
    name: "LA Suboxone",
    type: "outpatient",
    address: "",
    city: "Los Angeles",
    zip: "",
    phone: "",
    website: "https://lasuboxone.com/sublocade/",
    acceptsMediCal: 0,
    acceptsPrivateInsurance: 1,
    priceRange: "Varies",
    services: ["Suboxone", "Sublocade", "MAT", "Outpatient addiction care"],
    notes: "Office-based buprenorphine/Suboxone treatment and Sublocade injections.",
  },
  {
    name: "Homeless Health Care Los Angeles - Beverly Clinic",
    type: "outpatient",
    address: "",
    city: "Los Angeles",
    zip: "",
    phone: "(213) 744-0724",
    website: "https://www.hhcla.org",
    acceptsMediCal: 1,
    acceptsPrivateInsurance: 0,
    priceRange: "Free/low cost",
    services: ["Harm reduction", "Needle exchange", "MAT linkage", "Suboxone referrals"],
    notes:
      "Harm reduction clinic with syringe services and linkage to MAT and Suboxone care.",
  },
  {
    name: "Center for Harm Reduction - HHCLA Downtown",
    type: "outpatient",
    address: "",
    city: "Los Angeles",
    zip: "",
    phone: "(213) 617-8408",
    website: "https://www.hhcla.org",
    acceptsMediCal: 1,
    acceptsPrivateInsurance: 0,
    priceRange: "Free",
    services: ["Needle exchange", "Naloxone", "MAT linkage", "Suboxone referrals"],
    notes:
      "Drop-in harm reduction center offering syringe services and rapid linkage to buprenorphine/Suboxone prescribers.",
  },
  {
    name: "Mariposa Detox Center",
    type: "detox",
    address: "",
    city: "Los Angeles",
    zip: "",
    phone: "(888) 251-6968",
    website: "https://mariposadetoxcenter.com",
    acceptsMediCal: 0,
    acceptsPrivateInsurance: 1,
    priceRange: "Varies",
    services: ["Detox", "MAT", "Suboxone (evaluation-based)", "Residential stabilization"],
    notes: "Medical detox and residential treatment with MAT options including Suboxone when clinically indicated.",
  },
  {
    name: "Zephyr Medical Group",
    type: "outpatient",
    address: "",
    city: "Santa Ana",
    zip: "",
    phone: "(949) 347-8721",
    website: "http://zephyrmedicalgroup.org",
    acceptsMediCal: 0,
    acceptsPrivateInsurance: 1,
    priceRange: "Varies",
    services: ["Suboxone", "MAT", "Mental health", "Outpatient addiction care"],
    notes: "Outpatient MAT with buprenorphine/Suboxone and behavioral health support.",
  },
  {
    name: "American Addiction Institute of Mind and Medicine",
    type: "outpatient",
    address: "",
    city: "Santa Ana",
    zip: "",
    phone: "(800) 779-4715",
    website: "http://american-addiction.com",
    acceptsMediCal: 0,
    acceptsPrivateInsurance: 1,
    priceRange: "Varies",
    services: ["Suboxone", "MAT", "IOP", "Counseling"],
    notes: "Outpatient addiction center with Suboxone and related MAT support.",
  },
  {
    name: "Recovery Solutions of Santa Ana (CTC)",
    type: "outpatient",
    address: "",
    city: "Santa Ana",
    zip: "",
    phone: "(714) 581-9181",
    website: "https://www.southerncaliforniactc.com/location/santa-ana/",
    acceptsMediCal: 1,
    acceptsPrivateInsurance: 1,
    priceRange: "Varies",
    services: ["Suboxone", "MAT", "Buprenorphine", "Counseling"],
    notes: "Comprehensive opioid treatment program including buprenorphine/Suboxone.",
  },
  {
    name: "Windward Way Recovery",
    type: "residential",
    address: "",
    city: "Newport Beach",
    zip: "",
    phone: "(949) 703-0488",
    website: "https://windwardway.com",
    acceptsMediCal: 0,
    acceptsPrivateInsurance: 1,
    priceRange: "Varies",
    services: ["Detox", "Residential", "IOP/PHP", "Suboxone (evaluation-based)"],
    notes: "Addiction treatment program with MAT pathways that may include Suboxone.",
  },
  {
    name: "Simple Recovery / Laguna Treatment Hospital Outpatient",
    type: "outpatient",
    address: "",
    city: "Newport Beach",
    zip: "",
    phone: "(888) 743-0490",
    website: "https://www.simplerecovery.com",
    acceptsMediCal: 0,
    acceptsPrivateInsurance: 1,
    priceRange: "Varies",
    services: ["Suboxone", "MAT", "Outpatient addiction care"],
    notes: "Outpatient programs with physician-supervised MAT including Suboxone where appropriate.",
  },
  {
    name: "Opiate Detox Institute",
    type: "detox",
    address: "",
    city: "Costa Mesa",
    zip: "",
    phone: "(888) 268-9646",
    website: "https://opiatedetoxinstitute.com",
    acceptsMediCal: 0,
    acceptsPrivateInsurance: 1,
    priceRange: "Varies",
    services: ["Detox", "Medical management", "Buprenorphine stabilization"],
    notes: "Specialty detox provider; confirm Suboxone availability and aftercare process.",
  },
  {
    name: "Fashion Valley Comprehensive Treatment Center",
    type: "outpatient",
    address: "",
    city: "San Diego",
    zip: "",
    phone: "(619) 966-3352",
    website: "https://www.ctcprograms.com/location/fashion-valley-comprehensive-treatment-center/",
    acceptsMediCal: 1,
    acceptsPrivateInsurance: 1,
    priceRange: "Varies",
    services: ["Suboxone", "MAT", "Buprenorphine", "Counseling"],
    notes: "Comprehensive treatment center with buprenorphine/Suboxone services.",
  },
  {
    name: "Akua Strong - San Diego",
    type: "outpatient",
    address: "",
    city: "San Diego",
    zip: "",
    phone: "(619) 340-0082",
    website: "https://akuamindbody.com/akua-mental-health-addiction-treatment-san-diego/",
    acceptsMediCal: 0,
    acceptsPrivateInsurance: 1,
    priceRange: "Varies",
    services: ["Outpatient treatment", "MAT", "Suboxone (program-based)"],
    notes: "Outpatient addiction and psychiatric program with MAT options.",
  },
  {
    name: "Healthy U Behavioral Health",
    type: "outpatient",
    address: "",
    city: "San Diego",
    zip: "",
    phone: "(619) 897-2165",
    website: "https://healthyubh.com",
    acceptsMediCal: 0,
    acceptsPrivateInsurance: 1,
    priceRange: "Varies",
    services: ["Suboxone", "MAT", "Therapy", "Psychiatry"],
    notes: "Behavioral health clinic offering MAT including buprenorphine/Suboxone.",
  },
  {
    name: "Crownview Medical Group - Sublocade Clinic",
    type: "outpatient",
    address: "",
    city: "San Diego",
    zip: "",
    phone: "",
    website: "https://sandiegopsychiatrist.com/sublocade-clinic-san-diego/",
    acceptsMediCal: 0,
    acceptsPrivateInsurance: 1,
    priceRange: "Varies",
    services: ["Sublocade", "Suboxone", "MAT", "Psychiatry"],
    notes: "Clinic-based Sublocade and MAT treatment for opioid use disorder.",
  },
  {
    name: "Alicja Steiner, MD",
    type: "outpatient",
    address: "",
    city: "San Diego",
    zip: "",
    phone: "(619) 948-8464",
    website: "https://www.steinermd.com",
    acceptsMediCal: 0,
    acceptsPrivateInsurance: 1,
    priceRange: "Varies",
    services: ["Pain management", "Buprenorphine consultation", "Suboxone (confirm)"],
    notes: "Pain and addiction-adjacent care; confirm OUD-focused MAT availability directly.",
  },
  {
    name: "Bicycle Health (Telehealth)",
    type: "outpatient",
    address: "",
    city: "Telehealth",
    zip: "",
    phone: "",
    website: "https://www.bicyclehealth.com",
    acceptsMediCal: 1,
    acceptsPrivateInsurance: 1,
    priceRange: "Varies",
    services: ["Suboxone", "Sublocade coordination", "MAT", "Telehealth"],
    notes: "Statewide online MAT with Suboxone and Sublocade coordination in California.",
  },
  {
    name: "Klinic (Telehealth)",
    type: "outpatient",
    address: "",
    city: "Telehealth",
    zip: "",
    phone: "",
    website: "https://klinic.com/suboxone/california",
    acceptsMediCal: 0,
    acceptsPrivateInsurance: 1,
    priceRange: "Varies",
    services: ["Suboxone", "Sublocade coordination", "MAT", "Telehealth"],
    notes: "Online MAT with Suboxone and partner-based Sublocade coordination.",
  },
  {
    name: "Bright Heart Health (Telemedicine)",
    type: "outpatient",
    address: "",
    city: "Telehealth",
    zip: "",
    phone: "",
    website: "https://www.brighthearthealth.com/telemedicine-medication-assisted-treatment-california/",
    acceptsMediCal: 0,
    acceptsPrivateInsurance: 1,
    priceRange: "Varies",
    services: ["Suboxone", "MAT", "Counseling", "Telehealth"],
    notes: "California telemedicine MAT program with buprenorphine/Suboxone support.",
  },
  {
    name: "Ophelia (California Telehealth)",
    type: "outpatient",
    address: "",
    city: "Telehealth",
    zip: "",
    phone: "",
    website: "https://ophelia.com/local-help/california",
    acceptsMediCal: 1,
    acceptsPrivateInsurance: 1,
    priceRange: "Varies",
    services: ["Suboxone", "MAT", "Virtual visits", "Telehealth"],
    notes: "Home-based telehealth MAT for OUD with Suboxone prescribing and follow-up.",
  },
];

async function addSuboxoneClinics() {
  console.log("Adding Suboxone clinics to treatment_centers...");
  console.log(`Using ${resolvedDb.source}\n`);

  let added = 0;
  let skipped = 0;

  for (const clinic of clinics) {
    try {
      const existing = clinic.phone
        ? await sql`
            SELECT id FROM treatment_centers
            WHERE phone = ${clinic.phone}
               OR (name = ${clinic.name} AND city = ${clinic.city})
            LIMIT 1
          `
        : await sql`
            SELECT id FROM treatment_centers
            WHERE name = ${clinic.name} AND city = ${clinic.city}
            LIMIT 1
          `;

      if (existing.length > 0) {
        console.log(`[SKIP] ${clinic.name} already exists`);
        skipped++;
        continue;
      }

      const description = `${clinic.notes} Includes Suboxone/MAT navigation support.`;
      await sql`
        INSERT INTO treatment_centers (
          name, type, address, city, "zipCode", phone, website, description,
          "servesPopulation", "acceptsCouples", "acceptsMediCal", "acceptsMedicare",
          "acceptsPrivateInsurance", "acceptsRBH", "priceRange",
          "servicesOffered", amenities, "isJointCommission", "isVerified", "isPublished"
        ) VALUES (
          ${clinic.name}, ${clinic.type}, ${clinic.address}, ${clinic.city}, ${clinic.zip},
          ${clinic.phone || null}, ${clinic.website}, ${description},
          'coed', 0, ${clinic.acceptsMediCal}, 0, ${clinic.acceptsPrivateInsurance}, 0, ${clinic.priceRange},
          ${JSON.stringify(clinic.services)}, ${JSON.stringify([])}, 0, 1, 1
        )
      `;

      console.log(`[ADDED] ${clinic.name}`);
      added++;
    } catch (error) {
      console.error(`[ERROR] ${clinic.name}: ${error.message}`);
    }
  }

  console.log(`\nSummary: ${added} added, ${skipped} skipped`);
  await sql.end();
}

addSuboxoneClinics().catch((error) => {
  console.error(error);
  process.exit(1);
});
