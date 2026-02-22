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
    name: "Fig Tree Therapy Center",
    address: "714 W Olympic Blvd Ste 743",
    city: "Los Angeles",
    zip: "90015",
    phone: "(310) 712-3411",
    specialties: ["Mental Health", "EMDR Therapy", "Trauma Therapy", "Psychotherapy"],
  },
  {
    name: "Downtown Mind Wellness",
    address: "617 S Olive St #200",
    city: "Los Angeles",
    zip: "90014",
    phone: "(213) 430-9080",
    specialties: ["Mental Health", "Counseling", "Psychotherapy", "Trauma-Focused Therapy", "EMDR Therapy"],
  },
  {
    name: "Downtown Los Angeles Therapy",
    address: "520 S Grand Ave #680",
    city: "Los Angeles",
    zip: "90071",
    phone: "(626) 406-2385",
    specialties: ["Mental Health", "EMDR Therapy", "Somatic Therapy", "Trauma Therapy", "Psychotherapy"],
  },
  {
    name: "The Mindful Mind",
    address: "533 Colyton St",
    city: "Los Angeles",
    zip: "90013",
    phone: "(213) 298-0019",
    specialties: ["Mental Health", "EMDR Therapy", "Trauma-Informed Therapy", "Psychotherapy"],
  },
  {
    name: "Dimitrios Pexaras Therapy",
    address: "427 W 5th St",
    city: "Los Angeles",
    zip: "90013",
    phone: "(805) 386-6161",
    specialties: ["Mental Health", "Trauma Therapy", "Individual Therapy", "Psychotherapy"],
  },
  {
    name: "Silver Lake Psychology",
    address: "4325 Sunset Blvd Unit 206",
    city: "Los Angeles",
    zip: "90029",
    phone: "(310) 879-8004",
    specialties: ["Mental Health", "EMDR Therapy", "Trauma Therapy", "Psychology", "Psychotherapy"],
  },
  {
    name: "Rose Junie Therapy",
    address: "1555 Sunset Blvd STE C",
    city: "Los Angeles",
    zip: "90026",
    phone: "(310) 498-5890",
    specialties: ["Mental Health", "EMDR Therapy", "Trauma Therapy", "Psychotherapy"],
  },
];

async function migrateClinics() {
  console.log("Migrating EMDR clinics to treatment_centers...");
  console.log(`Using ${resolvedDb.source}\n`);

  let moved = 0;
  let alreadyInTreatment = 0;
  let removedFromMediCal = 0;

  for (const clinic of clinics) {
    try {
      const existingTreatment = await sql`
        SELECT id FROM treatment_centers
        WHERE phone = ${clinic.phone}
           OR (name = ${clinic.name} AND city = ${clinic.city})
        LIMIT 1
      `;

      if (existingTreatment.length > 0) {
        console.log(`[SKIP] ${clinic.name} already exists in treatment_centers`);
        alreadyInTreatment++;
      } else {
        const description = `${clinic.specialties.join(", ")}. Outpatient mental health care; accepts private insurance (including BCBS where applicable).`;
        await sql`
          INSERT INTO treatment_centers (
            name, type, address, city, "zipCode", phone, description,
            "servesPopulation", "acceptsCouples", "acceptsMediCal", "acceptsMedicare",
            "acceptsPrivateInsurance", "acceptsRBH", "priceRange",
            "servicesOffered", amenities, "isJointCommission", "isVerified", "isPublished"
          ) VALUES (
            ${clinic.name}, 'outpatient', ${clinic.address}, ${clinic.city}, ${clinic.zip}, ${clinic.phone},
            ${description},
            'coed', 0, 0, 0, 1, 0, 'Varies',
            ${JSON.stringify(clinic.specialties)}, ${JSON.stringify([])}, 0, 1, 1
          )
        `;
        console.log(`[MOVED] ${clinic.name} into treatment_centers`);
        moved++;
      }

      const mediCalRows = await sql`
        SELECT id FROM medi_cal_providers WHERE phone = ${clinic.phone}
      `;
      if (mediCalRows.length > 0) {
        for (const row of mediCalRows) {
          await sql`DELETE FROM provider_categories WHERE "providerId" = ${row.id}`;
        }
        await sql`DELETE FROM medi_cal_providers WHERE phone = ${clinic.phone}`;
        removedFromMediCal += mediCalRows.length;
      }
    } catch (error) {
      console.error(`[ERROR] ${clinic.name}: ${error.message}`);
    }
  }

  console.log("\nSummary:");
  console.log(`- Added to treatment_centers: ${moved}`);
  console.log(`- Already in treatment_centers: ${alreadyInTreatment}`);
  console.log(`- Removed from medi_cal_providers: ${removedFromMediCal}`);

  await sql.end();
}

migrateClinics().catch((error) => {
  console.error(error);
  process.exit(1);
});

