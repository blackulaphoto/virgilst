import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { resources } from "./drizzle/schema";

const client = createClient({
  url: "file:./virgil_st_dev.db"
});

const db = drizzle(client);

const familyServices = [
  // PARENTING CLASSES
  {
    name: "LA County Department of Public Health - Parenting Programs",
    type: "parenting_classes",
    description: "Free parenting education workshops and support groups. Topics include prenatal care, child development, and positive parenting.",
    website: "https://publichealth.lacounty.gov",
    phone: "(213) 240-7941",
    filters: {
      free: true,
      lowCost: false,
      acceptsMediCal: false,
      noIdRequired: false,
      childFriendly: true,
      prenatalCare: true,
      parentingSupport: true,
    }
  },
  {
    name: "Homeboy Industries - Parenting & Family Support",
    type: "parenting_classes",
    description: "Provides parenting classes and family support services, especially for formerly incarcerated individuals and their families.",
    website: "https://homeboyindustries.org",
    phone: "(323) 526-1254",
    filters: {
      free: true,
      lowCost: false,
      formerlyIncarcerated: true,
      familySupport: true,
      parentingSupport: true,
      reentryServices: true,
    }
  },
  {
    name: "Parenting for LA's Future (P-LAF)",
    type: "parenting_classes",
    description: "Free parenting workshops focused on empowering families in underserved communities.",
    website: "https://parentingforlafuture.org",
    phone: "(213) 617-2002",
    filters: {
      free: true,
      lowCost: false,
      underservedCommunities: true,
      parentingSupport: true,
      familyEmpowerment: true,
    }
  },
  {
    name: "Central City Neighborhood Partners",
    type: "parenting_classes",
    description: "Local family resource center offering free or low-cost parenting classes and resources.",
    website: "https://ccnpinc.org",
    filters: {
      free: true,
      lowCost: true,
      familyResourceCenter: true,
      parentingSupport: true,
      communityBased: true,
    }
  },

  // COUPLES COUNSELING
  {
    name: "LA County Department of Mental Health - Couples Counseling",
    type: "couples_counseling",
    description: "Low-cost or no-cost couples counseling at various community mental health clinics. Services are income-based and often covered by Medi-Cal.",
    website: "https://dmh.lacounty.gov",
    phone: "(800) 854-7771",
    hours: "Access Line available",
    filters: {
      free: true,
      lowCost: true,
      acceptsMediCal: true,
      incomeBased: true,
      mentalHealth: true,
      couplesCounseling: true,
    }
  },
  {
    name: "The Center for Nonviolent Solutions",
    type: "couples_counseling",
    description: "Provides affordable couples therapy with sliding scale fees in LA.",
    address: "Los Angeles area",
    website: "https://cnvsocal.org",
    phone: "(626) 314-9930",
    filters: {
      lowCost: true,
      slidingScale: true,
      couplesCounseling: true,
      conflictResolution: true,
    }
  },
  {
    name: "LA LGBT Center - Couples Counseling",
    type: "couples_counseling",
    description: "Offers counseling and support groups for LGBTQ+ couples at low or no cost.",
    address: "1625 N Schrader Blvd, Los Angeles, CA 90028",
    city: "Los Angeles",
    website: "https://lalgbtcenter.org",
    phone: "(323) 993-7400",
    filters: {
      free: true,
      lowCost: true,
      lgbtqSafe: true,
      lgbtqSpecific: true,
      couplesCounseling: true,
      supportGroups: true,
    }
  },
  {
    name: "UCLA Therapy Training Program",
    type: "couples_counseling",
    description: "Low-cost couples counseling through UCLA's graduate training clinic.",
    address: "UCLA Campus, Los Angeles",
    city: "Los Angeles",
    phone: "(310) 825-2536",
    filters: {
      lowCost: true,
      universityClinc: true,
      couplesCounseling: true,
      trainingSetting: true,
    }
  },
  {
    name: "Pepperdine University Community Counseling Clinic",
    type: "couples_counseling",
    description: "Low-cost couples counseling through Pepperdine's graduate training clinic.",
    address: "Pepperdine University, Los Angeles area",
    city: "Los Angeles",
    phone: "(310) 568-5600",
    filters: {
      lowCost: true,
      universityClinc: true,
      couplesCounseling: true,
      trainingSetting: true,
    }
  },
];

async function importFamilyServices() {
  console.log("👨‍👩‍👧‍👦 Importing Family Services (Parenting Classes & Couples Counseling)\n");
  console.log(`Total services to import: ${familyServices.length}\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const service of familyServices) {
    try {
      await db.insert(resources).values({
        name: service.name,
        type: service.type,
        description: service.description,
        address: service.address || null,
        city: service.city || null,
        phone: service.phone || null,
        website: service.website || null,
        hours: service.hours || null,
        filters: JSON.stringify(service.filters),
        isVerified: 1,
      });

      console.log(`✅ ${service.name}`);
      console.log(`   Type: ${service.type} | ${service.phone || 'No phone'}\n`);
      imported++;

    } catch (error: any) {
      if (error.message?.includes("UNIQUE constraint failed")) {
        console.log(`⏭️  Skipped (already exists): ${service.name}\n`);
        skipped++;
      } else {
        console.error(`❌ Error importing ${service.name}:`, error.message);
        errors++;
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n📊 Import Summary:`);
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📦 Total: ${familyServices.length}`);
  console.log("\n📋 Breakdown:");
  console.log("   • 4 Parenting Classes providers");
  console.log("   • 5 Couples Counseling providers");
  console.log("\n✨ Family services import complete!");

  client.close();
}

importFamilyServices();
