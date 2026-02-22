import "dotenv/config";
import postgres from "postgres";

// Connect to PostgreSQL database
const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString);

const emdrClinics = [
  {
    providerName: "Fig Tree Therapy Center",
    facilityName: "Fig Tree Therapy Center",
    address: "714 W Olympic Blvd Ste 743",
    city: "Los Angeles",
    zipCode: "90015",
    phone: "(310) 712-3411",
    specialties: ["Mental Health", "EMDR Therapy", "Trauma Therapy", "Psychotherapy"],
  },
  {
    providerName: "Downtown Mind Wellness",
    facilityName: "Downtown Mind Wellness",
    address: "617 S Olive St #200",
    city: "Los Angeles",
    zipCode: "90014",
    phone: "(213) 430-9080",
    specialties: ["Mental Health", "Counseling", "Psychotherapy", "Trauma-Focused Therapy", "EMDR Therapy"],
  },
  {
    providerName: "Downtown Los Angeles Therapy",
    facilityName: "Downtown Los Angeles Therapy",
    address: "520 S Grand Ave #680",
    city: "Los Angeles",
    zipCode: "90071",
    phone: "(626) 406-2385",
    specialties: ["Mental Health", "EMDR Therapy", "Somatic Therapy", "Trauma Therapy", "Psychotherapy"],
  },
  {
    providerName: "The Mindful Mind",
    facilityName: "The Mindful Mind",
    address: "533 Colyton St",
    city: "Los Angeles",
    zipCode: "90013",
    phone: "(213) 298-0019",
    specialties: ["Mental Health", "EMDR Therapy", "Trauma-Informed Therapy", "Psychotherapy"],
  },
  {
    providerName: "Dimitrios Pexaras Therapy",
    facilityName: "Dimitrios Pexaras Therapy",
    address: "427 W 5th St",
    city: "Los Angeles",
    zipCode: "90013",
    phone: "(805) 386-6161",
    specialties: ["Mental Health", "Trauma Therapy", "Individual Therapy", "Psychotherapy"],
  },
  {
    providerName: "Silver Lake Psychology",
    facilityName: "Silver Lake Psychology",
    address: "4325 Sunset Blvd Unit 206",
    city: "Los Angeles",
    zipCode: "90029",
    phone: "(310) 879-8004",
    specialties: ["Mental Health", "EMDR Therapy", "Trauma Therapy", "Psychology", "Psychotherapy"],
  },
  {
    providerName: "Rose Junie Therapy",
    facilityName: "Rose Junie Therapy",
    address: "1555 Sunset Blvd STE C",
    city: "Los Angeles",
    zipCode: "90026",
    phone: "(310) 498-5890",
    specialties: ["Mental Health", "EMDR Therapy", "Trauma Therapy", "Psychotherapy"],
  },
];

async function importEMDRClinics() {
  console.log(`Starting import of ${emdrClinics.length} EMDR therapy clinics...`);

  let imported = 0;
  let skipped = 0;

  for (const clinic of emdrClinics) {
    try {
      const searchTerms = [
        clinic.providerName,
        clinic.facilityName,
        clinic.city,
        ...clinic.specialties,
        "emdr", "trauma", "therapy", "mental health",
      ].join(" ").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

      const result = await sql`
        INSERT INTO medi_cal_providers (
          "providerName", "facilityName", address, city, state, "zipCode", phone,
          specialties, "normalizedSpecialties", "searchTerms", "isVerified"
        ) VALUES (
          ${clinic.providerName},
          ${clinic.facilityName},
          ${clinic.address},
          ${clinic.city},
          'CA',
          ${clinic.zipCode},
          ${clinic.phone},
          ${JSON.stringify(clinic.specialties)},
          ${JSON.stringify(clinic.specialties.map((s: string) => s.toLowerCase()))},
          ${searchTerms},
          1
        )
        ON CONFLICT (phone) DO NOTHING
        RETURNING id
      `;

      if (result.length === 0) {
        console.log(`⏭️  Skipping ${clinic.providerName} - already exists`);
        skipped++;
        continue;
      }

      const providerId = result[0].id;

      // Add mental_health category
      await sql`
        INSERT INTO provider_categories ("providerId", "categoryKey")
        VALUES (${providerId}, 'mental_health')
        ON CONFLICT DO NOTHING
      `;

      console.log(`✅ Imported ${clinic.providerName} (${clinic.city})`);
      imported++;
    } catch (error: any) {
      console.error(`❌ Failed to import ${clinic.providerName}:`, error.message);
    }
  }

  console.log(`\n📊 Import Summary:`);
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   📋 Total: ${emdrClinics.length}`);
}

// Run the import
importEMDRClinics()
  .then(async () => {
    console.log("\n✨ EMDR clinics import completed!");
    await sql.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("\n💥 Import failed:", error);
    await sql.end();
    process.exit(1);
  });
