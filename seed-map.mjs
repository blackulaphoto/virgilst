import { drizzle } from "drizzle-orm/mysql2";
import { mapPins } from "./drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

async function seedMap() {
  console.log("Seeding map pins...");

  // Sample map pins for downtown LA area
  const samplePins = [
    {
      title: "LA Mission - Safe Shelter",
      description: "Emergency shelter with meals and recovery programs. Clean facilities, respectful staff.",
      type: "safe_zone",
      latitude: "34.0453",
      longitude: "-118.2445",
      notes: "Check-in by 6pm. Beds fill up fast.",
      submittedBy: 1,
      isApproved: true,
    },
    {
      title: "Grand Park - Free Water Fountain",
      description: "Public water fountain, always accessible. Near restrooms.",
      type: "water",
      latitude: "34.0560",
      longitude: "-118.2467",
      notes: "Open 24/7",
      submittedBy: 1,
      isApproved: true,
    },
    {
      title: "Central Library - Phone Charging",
      description: "Free outlets on 2nd floor. WiFi available. Respectful security.",
      type: "charging",
      latitude: "34.0484",
      longitude: "-118.2515",
      notes: "Open Mon-Sat 10am-5:30pm",
      submittedBy: 1,
      isApproved: true,
    },
    {
      title: "Midnight Mission - Hot Meals",
      description: "Free breakfast and dinner. No ID required. Friendly volunteers.",
      type: "food",
      latitude: "34.0446",
      longitude: "-118.2419",
      notes: "Breakfast 6-7am, Dinner 5-6pm",
      submittedBy: 1,
      isApproved: true,
    },
    {
      title: "Union Station - Public Restrooms",
      description: "Clean public restrooms. Security present but respectful.",
      type: "bathroom",
      latitude: "34.0560",
      longitude: "-118.2348",
      notes: "Open 4am-1am daily",
      submittedBy: 1,
      isApproved: true,
    },
    {
      title: "Starbucks on Spring St - Free WiFi",
      description: "WiFi works from outside. Buy something small to sit inside.",
      type: "wifi",
      latitude: "34.0498",
      longitude: "-118.2476",
      notes: "Code changes daily, ask barista",
      submittedBy: 1,
      isApproved: true,
    },
    {
      title: "⚠️ Sweep Alert - 5th & San Pedro",
      description: "Notices posted for cleanup next week. Move belongings by Tuesday.",
      type: "sweep_alert",
      latitude: "34.0453",
      longitude: "-118.2420",
      notes: "Sweep scheduled for 2/15. Store belongings at St. Francis Center.",
      submittedBy: 1,
      isApproved: true,
    },
    {
      title: "St. Francis Center - Day Services",
      description: "Showers, laundry, mail services, meals. Very helpful staff.",
      type: "resource",
      latitude: "34.0384",
      longitude: "-118.2095",
      notes: "Mon-Fri 7am-3pm. Bring ID if you have one.",
      submittedBy: 1,
      isApproved: true,
    },
    {
      title: "⚠️ Avoid - Aggressive Security",
      description: "Security harasses people at night. Not safe to camp here.",
      type: "warning",
      latitude: "34.0521",
      longitude: "-118.2437",
      notes: "Multiple reports of belongings confiscated",
      submittedBy: 1,
      isApproved: true,
    },
    {
      title: "Safe Parking - Behind Church",
      description: "Church allows overnight parking in back lot. Quiet and safe.",
      type: "safe_zone",
      latitude: "34.0412",
      longitude: "-118.2589",
      notes: "Enter from alley. No loud music or trash.",
      submittedBy: 1,
      isApproved: true,
    },
  ];

  for (const pin of samplePins) {
    await db.insert(mapPins).values(pin);
    console.log(`Created pin: ${pin.title}`);
  }

  console.log("✅ Map pins seeded successfully!");
}

seedMap().catch(console.error);
