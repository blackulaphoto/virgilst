import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { resources } from "./drizzle/schema";

const client = createClient({
  url: "file:./virgil_st_dev.db"
});

const db = drizzle(client);

const dentalResources = [
  {
    name: "Homeless Not Toothless (HNT)",
    description: "Best for homeless & extremely low-income clients needing full dental restoration. Services: exams, fillings, crowns, dentures. Excellent for dentures and complex cases.",
    type: "dental",
    address: "Los Angeles, CA",
    phone: null,
    website: "https://www.homelessnottoothless.org",
    hours: "By referral",
    filters: JSON.stringify({
      free: true,
      lowCost: true,
      homelessFriendly: true,
      acceptsUninsured: true,
      acceptsDentiCal: false,
      emergencyServices: false,
      paymentPlans: false
    }),
    zipCode: null,
    isVerified: 1
  },
  {
    name: "St. John's Community Health (SJCH)",
    description: "Best for Medi-Cal, uninsured, undocumented. Services: cleanings, fillings, extractions, emergency dental. Sliding scale, Denti-Cal accepted.",
    type: "dental",
    address: "South LA, DTLA, Westside",
    phone: "(323) 541-1411",
    website: "https://www.sjch.org",
    hours: "Call for hours",
    filters: JSON.stringify({
      free: false,
      lowCost: true,
      homelessFriendly: true,
      acceptsUninsured: true,
      acceptsDentiCal: true,
      emergencyServices: true,
      paymentPlans: true,
      slidingScale: true
    }),
    zipCode: null,
    isVerified: 1
  },
  {
    name: "Lestonnac Free Clinic",
    description: "Best for low/no-income adults, limited coverage gaps. Services: basic dental, preventive care. Completely free with eligibility screening.",
    type: "dental",
    address: "Los Angeles, Orange, San Bernardino Counties",
    phone: null,
    website: "https://www.lestonnacfreeclinic.org",
    hours: "By appointment",
    filters: JSON.stringify({
      free: true,
      lowCost: false,
      homelessFriendly: true,
      acceptsUninsured: true,
      acceptsDentiCal: false,
      emergencyServices: false,
      paymentPlans: false,
      requiresAppointment: true
    }),
    zipCode: null,
    isVerified: 1
  },
  {
    name: "APLA Health – Dental Clinic",
    description: "Best for underserved populations, stable follow-up care. Services: general dentistry, extractions. Sliding scale, Denti-Cal accepted.",
    type: "dental",
    address: "1127 Wilshire Blvd, Suite 1504, Los Angeles, CA 90017",
    phone: "(213) 201-1388",
    website: "https://aplahealth.org",
    hours: "Call for hours",
    filters: JSON.stringify({
      free: false,
      lowCost: true,
      homelessFriendly: true,
      acceptsUninsured: true,
      acceptsDentiCal: true,
      emergencyServices: false,
      paymentPlans: true,
      slidingScale: true
    }),
    zipCode: "90017",
    latitude: 34.0522,
    longitude: -118.2437,
    isVerified: 1
  },
  {
    name: "Venice Family Clinic",
    description: "Best for Westside clients + urgent pain. Sliding scale, Medi-Cal accepted. Locations: Venice, Santa Monica, Culver City.",
    type: "dental",
    address: "Venice, Santa Monica, Culver City",
    phone: "(310) 392-8636",
    website: "https://venicefamilyclinic.org",
    hours: "Call for hours",
    filters: JSON.stringify({
      free: false,
      lowCost: true,
      homelessFriendly: true,
      acceptsUninsured: true,
      acceptsDentiCal: true,
      emergencyServices: true,
      paymentPlans: true,
      slidingScale: true
    }),
    zipCode: null,
    isVerified: 1
  },
  {
    name: "JWCH Institute",
    description: "Best for DTLA / Skid Row / high-acuity clients. Services: full dental services. Sliding scale, Denti-Cal accepted.",
    type: "dental",
    address: "522 S San Pedro St, Los Angeles, CA 90013",
    phone: "(213) 285-4266",
    website: "https://jwchinstitute.org",
    hours: "Call (866) 733-5924 for appointments",
    filters: JSON.stringify({
      free: false,
      lowCost: true,
      homelessFriendly: true,
      acceptsUninsured: true,
      acceptsDentiCal: true,
      emergencyServices: true,
      paymentPlans: true,
      slidingScale: true,
      skidRowAccess: true
    }),
    zipCode: "90013",
    latitude: 34.0447,
    longitude: -118.2468,
    isVerified: 1
  },
  {
    name: "Saban Community Clinic",
    description: "Best for Hollywood / Central LA. Services: medical + dental. Sliding scale pricing.",
    type: "dental",
    address: "5205 Melrose Ave, Los Angeles, CA 90038",
    phone: "(323) 653-1990",
    website: "https://www.sabancommunityclinic.org",
    hours: "Call for hours",
    filters: JSON.stringify({
      free: false,
      lowCost: true,
      homelessFriendly: true,
      acceptsUninsured: true,
      acceptsDentiCal: true,
      emergencyServices: false,
      paymentPlans: true,
      slidingScale: true
    }),
    zipCode: "90038",
    latitude: 34.0833,
    longitude: -118.3089,
    isVerified: 1
  },
  {
    name: "Angeles Community Health Center",
    description: "Best for Koreatown / Westlake / Central LA. Services: general + emergency dental. Sliding scale, Denti-Cal accepted.",
    type: "dental",
    address: "1919 W 7th St, Los Angeles, CA 90057",
    phone: "(866) 981-3002",
    website: "https://www.angelescommunity.org",
    hours: "Call for hours",
    filters: JSON.stringify({
      free: false,
      lowCost: true,
      homelessFriendly: true,
      acceptsUninsured: true,
      acceptsDentiCal: true,
      emergencyServices: true,
      paymentPlans: true,
      slidingScale: true
    }),
    zipCode: "90057",
    latitude: 34.0569,
    longitude: -118.2751,
    isVerified: 1
  },
  {
    name: "Western Dental",
    description: "Best for payment plans when clinics are full. Services: exams, extractions, root canals, dentures. Multiple locations across LA. Not free, but critical fallback for acute pain.",
    type: "dental",
    address: "Multiple locations across Los Angeles",
    phone: null,
    website: "https://www.westerndental.com",
    hours: "Varies by location",
    filters: JSON.stringify({
      free: false,
      lowCost: false,
      homelessFriendly: false,
      acceptsUninsured: true,
      acceptsDentiCal: true,
      emergencyServices: true,
      paymentPlans: true,
      slidingScale: false,
      multipleLocations: true
    }),
    zipCode: null,
    isVerified: 1
  },
  {
    name: "UCLA School of Dentistry",
    description: "Best for complex work at reduced cost. Reduced student/resident fees. Slower intake, excellent quality.",
    type: "dental",
    address: "714 Tiverton Dr, Los Angeles, CA 90095",
    phone: "(310) 206-3904",
    website: "https://dentistry.ucla.edu",
    hours: "Call for hours",
    filters: JSON.stringify({
      free: false,
      lowCost: true,
      homelessFriendly: false,
      acceptsUninsured: true,
      acceptsDentiCal: false,
      emergencyServices: false,
      paymentPlans: true,
      slidingScale: true,
      dentalSchool: true
    }),
    zipCode: "90095",
    latitude: 34.0689,
    longitude: -118.4452,
    isVerified: 1
  },
  {
    name: "USC Ostrow School of Dentistry – Urgent Care",
    description: "Best for trauma, infection, severe pain. Emergency fees: ~$59–$350. Limited emergency Denti-Cal acceptance.",
    type: "dental",
    address: "925 W 34th St, Los Angeles, CA 90089",
    phone: "(213) 740-1576",
    website: "https://dentistry.usc.edu",
    hours: "Call urgent line for hours",
    filters: JSON.stringify({
      free: false,
      lowCost: true,
      homelessFriendly: false,
      acceptsUninsured: true,
      acceptsDentiCal: true,
      emergencyServices: true,
      paymentPlans: false,
      slidingScale: false,
      dentalSchool: true,
      urgentCare: true
    }),
    zipCode: "90089",
    latitude: 34.0224,
    longitude: -118.2851,
    isVerified: 1
  },
  {
    name: "Emergency Dental Relief Los Angeles",
    description: "Best for same-day emergencies + payment plans. Extended / near-24-hour hours. Payment plans explicitly offered.",
    type: "dental",
    address: "10458 Vermont Ave, Los Angeles, CA 90044",
    phone: "(213) 212-5046",
    website: "https://emergencydentist.la",
    hours: "Extended hours, near 24-hour availability",
    filters: JSON.stringify({
      free: false,
      lowCost: false,
      homelessFriendly: false,
      acceptsUninsured: true,
      acceptsDentiCal: false,
      emergencyServices: true,
      paymentPlans: true,
      slidingScale: false,
      extendedHours: true,
      sameDayService: true
    }),
    zipCode: "90044",
    latitude: 33.9425,
    longitude: -118.2917,
    isVerified: 1
  }
];

async function importDentalResources() {
  console.log("🦷 Importing Free & Low-Cost Dental Resources\n");
  console.log(`Total resources to import: ${dentalResources.length}\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const resource of dentalResources) {
    try {
      await db.insert(resources).values(resource);

      console.log(`✅ ${resource.name}`);
      console.log(`   ${resource.address}`);
      console.log(`   Phone: ${resource.phone || "See website"}\n`);
      imported++;

    } catch (error: any) {
      if (error.message?.includes("UNIQUE constraint failed")) {
        console.log(`⏭️  Skipped (already exists): ${resource.name}\n`);
        skipped++;
      } else {
        console.error(`❌ Error importing ${resource.name}:`, error.message);
        errors++;
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n📊 Import Summary:`);
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📦 Total: ${dentalResources.length}`);

  console.log("\n🦷 Dental Resources Breakdown:");
  console.log(`   Free Clinics: 2`);
  console.log(`   Sliding Scale/Denti-Cal: 7`);
  console.log(`   Dental Schools: 2`);
  console.log(`   Emergency/Payment Plans: 1`);

  console.log("\n✨ Free & Low-Cost Dental Directory is ready!");

  client.close();
}

importDentalResources();
