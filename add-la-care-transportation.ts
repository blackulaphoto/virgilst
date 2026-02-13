import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { resources, articles } from "./drizzle/schema";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = createClient({
  url: "file:./virgil_st_dev.db"
});

const db = drizzle(client);

async function addLACareTransportation() {
  console.log("🚐 Adding L.A. Care Call-A-Car Transportation Service\n");

  try {
    // 1. Add as a Transportation Resource
    console.log("📍 Adding to Transportation Resources...");

    await db.insert(resources).values({
      name: "L.A. Care Call-A-Car - Free Medical Transportation",
      type: "transportation",
      description: "Free transportation to medical appointments for L.A. Care members. Includes rideshare (Lyft/taxi), wheelchair vans, and ambulance services. Available for Medi-Cal, L.A. Care Covered, and Medicare Plus members.",
      phone: "Medi-Cal: 1-888-839-9909 | Covered: 1-855-270-2327 | Medicare Plus: 1-833-522-3767",
      website: "https://www.lacare.org",
      address: null,
      city: "Los Angeles County",
      zipCode: null,
      hours: "Call Member Services to schedule rides",
      filters: JSON.stringify({
        free: true,
        medicalTransport: true,
        wheelchairAccessible: true,
        rideshare: true,
        laCareMember: true,
        mediCalAccepted: true,
        medicareAccepted: true,
        noEmergency: true,
        lgbtqFriendly: true,
      }),
      isVerified: 1,
    });

    console.log("✅ Added to Transportation Resources");

    // 2. Add as an Article to Library
    console.log("\n📚 Adding to Library Articles...");

    const articlePath = path.join(__dirname, "knowledge files", "articles", "LA Care Call-A-Car service ..Free Rides !.txt");
    const content = fs.readFileSync(articlePath, 'utf-8');

    await db.insert(articles).values({
      title: "L.A. Care Call-A-Car - Free Medical Transportation",
      slug: "la-care-call-a-car-free-medical-transportation",
      content: content,
      category: "health",
      tags: JSON.stringify([
        "Transportation",
        "L.A. Care",
        "Medi-Cal",
        "Medicare",
        "Free Rides",
        "Medical Appointments",
        "Wheelchair Access",
        "LGBTQ+"
      ]),
      summary: "Free transportation to medical appointments for L.A. Care members. Includes rideshare, wheelchair vans, and ambulance services for Medi-Cal, L.A. Care Covered, and Medicare Plus members.",
      isPublished: 1,
      viewCount: 0,
    });

    console.log("✅ Added to Library Articles");

    console.log("\n" + "=".repeat(60));
    console.log("\n✨ L.A. Care Call-A-Car Successfully Added!");
    console.log("\n📋 Service Details:");
    console.log("   • Free transportation to medical appointments");
    console.log("   • Rideshare (Lyft), taxi, wheelchair vans, ambulance");
    console.log("   • For L.A. Care Medi-Cal, Covered, and Medicare Plus members");
    console.log("   • Unlimited rides for Medicare Plus members");
    console.log("   • Covers all of LA County (except Catalina Island)");
    console.log("\n📞 Contact Numbers:");
    console.log("   • Medi-Cal: 1-888-839-9909");
    console.log("   • Covered/Covered Direct: 1-855-270-2327");
    console.log("   • Medicare Plus: 1-833-522-3767");
    console.log("\n🎯 Now Available:");
    console.log("   ✓ Transportation Resources page");
    console.log("   ✓ Library Articles (Health category)");
    console.log("   ✓ AI Assistant knowledge base");

  } catch (error: any) {
    if (error.message?.includes("UNIQUE constraint failed")) {
      console.log("⏭️  L.A. Care Call-A-Car already exists in the database");
    } else {
      console.error("❌ Error:", error.message);
    }
  } finally {
    client.close();
  }
}

addLACareTransportation();
