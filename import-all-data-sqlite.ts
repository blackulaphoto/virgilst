import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { articles, resources, videos, treatmentCenters } from "./drizzle/schema";

const client = createClient({
  url: "file:./virgil_st_dev.db"
});

const db = drizzle(client);

async function importAllData() {
  console.log("🚀 Starting data import...\n");

  try {
    // Import Articles (Knowledge Base)
    console.log("📚 Importing articles...");
    const articlesData = [
      {
        title: "Emergency Shelter Tonight - LA County Quick Start",
        slug: "emergency-shelter-tonight-la-2026",
        category: "housing",
        content: `# Emergency Shelter Tonight - LA County Quick Start

## The Point
You need a place to sleep tonight. Here's how to get a bed in LA County.

## What to Do TODAY (Start Here)

1. **Call 211 right now** - Available 24/7, free call from any phone
   - Dial: **211** or **(800) 339-6993**
   - Ask: "I need emergency shelter tonight in [your area]"

2. **Write this down when they answer:**
   - Shelter name and address
   - Check-in time (usually 4-7 PM)
   - What you can bring (bags, pets, etc.)
   - Any ID or documents needed`,
        summary: "Step-by-step guide to getting emergency shelter tonight in LA County.",
        isPublished: 1,
        viewCount: 0
      },
      {
        title: "How to Apply for General Relief (GR)",
        slug: "how-to-apply-for-general-relief",
        category: "benefits",
        content: `# How to Apply for General Relief (GR)

General Relief (GR) is a cash aid program for adults without children who need temporary financial help.

## Who Qualifies?

- Adults 18+ without minor children
- Los Angeles County residents
- Limited or no income
- U.S. citizens or qualified non-citizens`,
        summary: "Complete guide to applying for General Relief cash assistance in Los Angeles County.",
        isPublished: 1,
        viewCount: 0
      },
      {
        title: "Getting Your Medi-Cal Card Without ID",
        slug: "getting-medi-cal-without-id",
        category: "health",
        content: `# Getting Your Medi-Cal Card Without ID

You can still qualify for Medi-Cal even if you don't have identification.

## The Good News

California law says you can't be denied Medi-Cal just because you lack ID. The county must help you get documentation.`,
        summary: "Learn how to get Medi-Cal coverage even without identification documents.",
        isPublished: 1,
        viewCount: 0
      }
    ];

    for (const article of articlesData) {
      await db.insert(articles).values(article);
    }
    console.log(`✅ Imported ${articlesData.length} articles\n`);

    // Import Resources
    console.log("🏢 Importing resources...");
    const resourcesData = [
      {
        name: "Los Angeles Mission",
        description: "Emergency shelter, meals, and recovery programs for men and women.",
        type: "shelter",
        address: "303 E 5th St, Los Angeles, CA 90013",
        phone: "(213) 629-1227",
        hours: "24/7",
        zipCode: "90013",
        latitude: 34.0447,
        longitude: -118.2444,
        isVerified: 1
      },
      {
        name: "The Midnight Mission",
        description: "Walk-in shelter with meals, showers, and beds for men and women.",
        type: "shelter",
        address: "601 S. San Pedro St, Los Angeles, CA 90014",
        phone: "(213) 624-9258",
        hours: "24/7",
        zipCode: "90014",
        latitude: 34.0427,
        longitude: -118.2475,
        isVerified: 1
      },
      {
        name: "St. Francis Center",
        description: "Day center with showers, laundry, mail services, and meals.",
        type: "hygiene",
        address: "2323 E 1st St, Los Angeles, CA 90033",
        phone: "(323) 267-0310",
        hours: "Mon-Fri 7am-3pm",
        zipCode: "90033",
        latitude: 34.0391,
        longitude: -118.2164,
        isVerified: 1
      },
      {
        name: "LA Food Bank",
        description: "Free food distribution and emergency food assistance.",
        type: "food",
        address: "1734 E 41st St, Los Angeles, CA 90058",
        phone: "(323) 234-3030",
        hours: "Mon-Fri 9am-4pm",
        zipCode: "90058",
        latitude: 33.9917,
        longitude: -118.2339,
        isVerified: 1
      }
    ];

    for (const resource of resourcesData) {
      await db.insert(resources).values(resource);
    }
    console.log(`✅ Imported ${resourcesData.length} resources\n`);

    // Import Videos
    console.log("🎥 Importing videos...");
    const videosData = [
      {
        title: "How to be comfortable when homeless - PART 1 - Shelter",
        youtubeId: "dQw4w9WgXcQ",
        category: "how_to_guides",
        description: "Practical advice on finding and securing shelter when experiencing homelessness.",
        viewCount: 0
      },
      {
        title: "Survival Tips and Tricks for Being Homeless",
        youtubeId: "dQw4w9WgXcQ",
        category: "street_hacks",
        description: "Essential tips and tricks for surviving on the streets.",
        viewCount: 0
      },
      {
        title: "Beginners Guide To Being Homeless",
        youtubeId: "dQw4w9WgXcQ",
        category: "how_to_guides",
        description: "A comprehensive beginner's guide to surviving homelessness.",
        viewCount: 0
      }
    ];

    for (const video of videosData) {
      await db.insert(videos).values(video);
    }
    console.log(`✅ Imported ${videosData.length} videos\n`);

    // Import Treatment Centers
    console.log("🏥 Importing treatment centers...");
    const treatmentData = [
      {
        name: "Muse Treatment (Milieu/Outpatient)",
        type: "outpatient",
        address: "4111 Midas Ave",
        city: "Los Angeles",
        zipCode: "90210",
        phone: "(877) 628-3871",
        servesPopulation: "all",
        acceptsMediCal: 0,
        acceptsCouples: 0,
        acceptsMedicare: 0,
        acceptsPrivateInsurance: 1,
        acceptsRBH: 0,
        isJointCommission: 0,
        isVerified: 0,
        isPublished: 1
      },
      {
        name: "Los Angeles Mission - Recovery",
        type: "residential",
        address: "303 E 5th St",
        city: "Los Angeles",
        zipCode: "90013",
        phone: "(213) 629-1227",
        servesPopulation: "men",
        acceptsMediCal: 1,
        acceptsCouples: 0,
        acceptsMedicare: 1,
        acceptsPrivateInsurance: 0,
        acceptsRBH: 1,
        isJointCommission: 0,
        isVerified: 1,
        isPublished: 1
      }
    ];

    for (const center of treatmentData) {
      await db.insert(treatmentCenters).values(center);
    }
    console.log(`✅ Imported ${treatmentData.length} treatment centers\n`);

    console.log("✨ All data imported successfully!");
    client.close();
  } catch (error) {
    console.error("❌ Error importing data:", error);
    client.close();
    process.exit(1);
  }
}

importAllData();
