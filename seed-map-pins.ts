import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { mapPins } from "./drizzle/schema";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

const client = createClient({
  url: "file:./virgil_st_dev.db"
});

const db = drizzle(client);

const samplePins = [
  // Safe Zones
  {
    title: "MacArthur Park - 24hr Safe Area",
    description: "Well-lit area near restrooms, park security patrols regularly",
    type: "safe_zone",
    latitude: 34.0575,
    longitude: -118.2772,
    notes: "Avoid dense bushes. Stay near the lake side. Security friendly to homeless.",
    isApproved: 1,
    upvotes: 12,
  },
  {
    title: "Grand Park - Safe Sleeping Spot",
    description: "Downtown park with security, open space, well-maintained",
    type: "safe_zone",
    latitude: 34.0559,
    longitude: -118.2467,
    notes: "Security wakes you at 6am but doesn't harass. Good for overnight.",
    isApproved: 1,
    upvotes: 8,
  },
  {
    title: "Echo Park - Under Bridge Area",
    description: "Covered area under bridge, protected from rain",
    type: "safe_zone",
    latitude: 34.0780,
    longitude: -118.2607,
    notes: "Gets crowded. Come early. Respectful community.",
    isApproved: 1,
    upvotes: 15,
  },

  // Food
  {
    title: "Downtown Women's Center - Free Meals",
    description: "Hot meals served daily, women and children only",
    type: "food",
    latitude: 34.0430,
    longitude: -118.2522,
    notes: "Breakfast 7-9am, Lunch 12-2pm. No ID required. Very kind staff.",
    isApproved: 1,
    upvotes: 20,
  },
  {
    title: "Midnight Mission - Dinner Line",
    description: "Free dinner served nightly on Skid Row",
    type: "food",
    latitude: 34.0422,
    longitude: -118.2467,
    notes: "Line starts at 5pm, food runs out by 7pm. Get there early!",
    isApproved: 1,
    upvotes: 18,
  },

  // Water
  {
    title: "Pershing Square - Water Fountain",
    description: "Public water fountain, works 24/7",
    type: "water",
    latitude: 34.0484,
    longitude: -118.2509,
    notes: "Cold water, bottle fill-up friendly. Sometimes homeless advocates bring water here.",
    isApproved: 1,
    upvotes: 10,
  },
  {
    title: "LA Central Library - Water & Restrooms",
    description: "Public library with water fountains and clean restrooms",
    type: "water",
    latitude: 34.0522,
    longitude: -118.2550,
    notes: "Open Mon-Sat 10am-5:30pm. Can also charge phones inside.",
    isApproved: 1,
    upvotes: 14,
  },

  // Bathrooms
  {
    title: "Union Station - Public Restrooms",
    description: "24hr accessible bathrooms, generally clean",
    type: "bathroom",
    latitude: 34.0560,
    longitude: -118.2349,
    notes: "Security is chill. Showers sometimes available through outreach programs.",
    isApproved: 1,
    upvotes: 16,
  },
  {
    title: "Grand Central Market - Restrooms",
    description: "Public market with restrooms during business hours",
    type: "bathroom",
    latitude: 34.0506,
    longitude: -118.2495,
    notes: "Open 8am-10pm. Clean. Security might ask you to buy something.",
    isApproved: 1,
    upvotes: 7,
  },

  // Charging
  {
    title: "LA Central Library - Free Charging Stations",
    description: "Multiple outlets throughout library, free WiFi",
    type: "charging",
    latitude: 34.0522,
    longitude: -118.2550,
    notes: "Outlets near reading tables. Can stay all day. WiFi password not needed.",
    isApproved: 1,
    upvotes: 22,
  },
  {
    title: "Starbucks - 7th & Flower (Outlet Friendly)",
    description: "Starbucks with lots of outlets, staff doesn't hassle",
    type: "charging",
    latitude: 34.0480,
    longitude: -118.2587,
    notes: "Buy a small coffee ($2), can stay for hours. Bathroom for customers.",
    isApproved: 1,
    upvotes: 9,
  },

  // WiFi
  {
    title: "LA Central Library - Free WiFi",
    description: "Strong public WiFi, no password required",
    type: "wifi",
    latitude: 34.0522,
    longitude: -118.2550,
    notes: "Access from outside too. Library card gets you faster WiFi inside.",
    isApproved: 1,
    upvotes: 11,
  },
  {
    title: "Pershing Square - Free Public WiFi",
    description: "Public park with free WiFi coverage",
    type: "wifi",
    latitude: 34.0484,
    longitude: -118.2509,
    notes: "Works at night too. Signal strongest near the fountain.",
    isApproved: 1,
    upvotes: 8,
  },

  // Warnings
  {
    title: "⚠️ Aggressive Security - 5th & Spring",
    description: "Business improvement district security harasses homeless",
    type: "warning",
    latitude: 34.0489,
    longitude: -118.2503,
    notes: "They confiscate belongings and call cops. Avoid sleeping here.",
    isApproved: 1,
    upvotes: 13,
  },

  // Sweep Alerts
  {
    title: "🚨 SWEEP ALERT - Skid Row Cleanup Scheduled",
    description: "City announced cleanup for 6th & San Pedro on Thursday 6am",
    type: "sweep_alert",
    latitude: 34.0441,
    longitude: -118.2451,
    notes: "Move belongings by Wednesday night! They will throw away tents.",
    isApproved: 1,
    upvotes: 25,
  },
];

async function seedMapPins() {
  console.log("🗺️  Seeding Camp Map with Sample Pins\n");

  let imported = 0;
  let skipped = 0;

  for (const pin of samplePins) {
    try {
      await db.insert(mapPins).values({
        ...pin,
        submittedBy: null, // System-generated pins
      });
      imported++;
      console.log(`✅ Added: ${pin.title}`);
    } catch (error: any) {
      if (error.message?.includes("UNIQUE")) {
        skipped++;
      } else {
        console.error(`❌ Error adding ${pin.title}:`, error.message);
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n📊 Seed Summary:`);
  console.log(`   ✅ Added: ${imported}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   📍 Total: ${samplePins.length}`);

  console.log("\n📋 Pin Type Breakdown:");
  const typeCounts: Record<string, number> = {};
  samplePins.forEach((pin) => {
    typeCounts[pin.type] = (typeCounts[pin.type] || 0) + 1;
  });
  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`   ${type}: ${count} pins`);
  });

  console.log("\n🎯 All pins are pre-approved and ready to display!");
  console.log("   Visit http://localhost:3000/map to see them.\n");

  client.close();
}

seedMapPins();
