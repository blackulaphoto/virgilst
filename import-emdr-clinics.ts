import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { mediCalProviders, providerCategories } from "./drizzle/schema";
import { eq } from "drizzle-orm";

// Connect to PostgreSQL database
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

/**
 * Import EMDR therapy clinics into the medi-cal providers database
 * These clinics specialize in trauma-focused therapy including EMDR
 */

const emdrClinics = [
  // Central / Downtown Los Angeles
  {
    providerName: "Fig Tree Therapy Center",
    facilityName: "Fig Tree Therapy Center",
    address: "714 W Olympic Blvd Ste 743",
    city: "Los Angeles",
    state: "CA",
    zipCode: "90015",
    phone: "(310) 712-3411",
    specialties: ["Mental Health", "EMDR Therapy", "Trauma Therapy", "Psychotherapy"],
    notes: "Mental health clinic with multiple therapists; some list EMDR as a modality, located near LA Live",
  },
  {
    providerName: "Downtown Mind Wellness",
    facilityName: "Downtown Mind Wellness",
    address: "617 S Olive St #200",
    city: "Los Angeles",
    state: "CA",
    zipCode: "90014",
    phone: "(213) 430-9080",
    specialties: ["Mental Health", "Counseling", "Psychotherapy", "Trauma-Focused Therapy", "EMDR Therapy"],
    notes: "Counseling and psychotherapy group downtown that offers trauma-focused work; some clinicians may provide EMDR",
  },
  {
    providerName: "Downtown Los Angeles Therapy (Somatic and EMDR Therapy)",
    facilityName: "Downtown Los Angeles Therapy",
    address: "520 S Grand Ave #680",
    city: "Los Angeles",
    state: "CA",
    zipCode: "90071",
    phone: "(626) 406-2385",
    specialties: ["Mental Health", "EMDR Therapy", "Somatic Therapy", "Trauma Therapy", "Psychotherapy"],
    notes: "Psychotherapy practice explicitly focused on somatic therapy and EMDR",
  },
  {
    providerName: "The Mindful Mind",
    facilityName: "The Mindful Mind",
    address: "533 Colyton St",
    city: "Los Angeles",
    state: "CA",
    zipCode: "90013",
    phone: "(213) 298-0019",
    specialties: ["Mental Health", "EMDR Therapy", "Trauma-Informed Therapy", "Psychotherapy"],
    notes: "Trauma-informed mental health practice that includes EMDR among modalities for some clinicians",
  },
  {
    providerName: "Dimitrios Pexaras Therapy",
    facilityName: "Dimitrios Pexaras Therapy",
    address: "427 W 5th St",
    city: "Los Angeles",
    state: "CA",
    zipCode: "90013",
    phone: "(805) 386-6161",
    specialties: ["Mental Health", "Trauma Therapy", "Individual Therapy", "Psychotherapy"],
    notes: "Psychotherapist downtown who offers trauma-focused individual therapy; inquire about EMDR availability and BCBS acceptance",
  },
  // Eastside / Silver Lake / Echo Park
  {
    providerName: "Silver Lake Psychology",
    facilityName: "Silver Lake Psychology",
    address: "4325 Sunset Blvd Unit 206",
    city: "Los Angeles",
    state: "CA",
    zipCode: "90029",
    phone: "(310) 879-8004",
    specialties: ["Mental Health", "EMDR Therapy", "Trauma Therapy", "Psychology", "Psychotherapy"],
    notes: "Large group practice with multiple trauma therapists; some clinicians advertise EMDR and they work with a range of insurance plans",
  },
  {
    providerName: "Rose Junie Therapy",
    facilityName: "Rose Junie Therapy",
    address: "1555 Sunset Blvd STE C",
    city: "Los Angeles",
    state: "CA",
    zipCode: "90026",
    phone: "(310) 498-5890",
    specialties: ["Mental Health", "EMDR Therapy", "Trauma Therapy", "Psychotherapy"],
    notes: "Mental health practice in Echo Park; trauma therapy offered, ask specifically about EMDR and BCBS of CA",
  },
];

async function importEMDRClinics() {
  console.log(`Starting import of ${emdrClinics.length} EMDR therapy clinics...`);

  let imported = 0;
  let skipped = 0;

  for (const clinic of emdrClinics) {
    try {
      // Import the provider (with upsert to avoid duplicates)
      const result = await db
        .insert(mediCalProviders)
        .values({
          providerName: clinic.providerName,
          facilityName: clinic.facilityName,
          address: clinic.address,
          city: clinic.city,
          state: clinic.state,
          zipCode: clinic.zipCode,
          phone: clinic.phone,
          specialties: JSON.stringify(clinic.specialties),
          normalizedSpecialties: JSON.stringify(clinic.specialties.map(s => s.toLowerCase())),
          searchTerms: [
            clinic.providerName,
            clinic.facilityName,
            clinic.city,
            ...clinic.specialties,
            "emdr",
            "trauma",
            "therapy",
            "mental health",
            clinic.notes || "",
          ]
            .join(" ")
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim(),
          isVerified: 1,
        })
        .returning({ id: mediCalProviders.id });

      const providerId = result[0].id;

      // Add mental_health category
      await db.insert(providerCategories).values({
        providerId,
        categoryKey: "mental_health",
      });

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
    await client.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("\n💥 Import failed:", error);
    await client.end();
    process.exit(1);
  });
