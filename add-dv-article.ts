import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { articles } from "./drizzle/schema";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = createClient({
  url: "file:./virgil_st_dev.db"
});

const db = drizzle(client);

async function addDVArticle() {
  console.log("📚 Adding Domestic Violence Help Article\n");

  try {
    const articlePath = path.join(__dirname, "knowledge files", "articles", "Domestic Violence Help.txt");
    const content = fs.readFileSync(articlePath, 'utf-8');

    console.log(`📄 Article length: ${content.length} characters`);

    await db.insert(articles).values({
      title: "Domestic Violence Help - Complete California Survivor's Guide",
      slug: "domestic-violence-help-california-survivors-guide",
      content: content,
      category: "health",
      tags: JSON.stringify([
        "Domestic Violence",
        "Emergency Resources",
        "Safety Planning",
        "Restraining Orders",
        "DV Shelters",
        "Legal Protection",
        "Housing Assistance",
        "CalWORKs",
        "Trauma Recovery",
        "LGBTQ+ Support",
        "Los Angeles",
        "Orange County",
        "San Diego"
      ]),
      summary: "Comprehensive guide for domestic violence survivors in California. Covers emergency safety, restraining orders, confidential shelters, legal protections, housing pathways, CalWORKs assistance, and trauma recovery. Includes hotlines and resources for LA, Orange, and San Diego Counties, with support for all genders and LGBTQ+ survivors.",
      isPublished: 1,
      viewCount: 0,
    });

    console.log("✅ Article added to library successfully!");

    console.log("\n" + "=".repeat(60));
    console.log("\n📋 Article Details:");
    console.log("   • Title: Domestic Violence Help - Complete California Survivor's Guide");
    console.log("   • Category: Health");
    console.log("   • Content: 11 comprehensive sections");
    console.log("   • Coverage: LA, Orange, and San Diego Counties");
    console.log("\n📞 Key Hotlines Included:");
    console.log("   • National DV Hotline: 1-800-799-7233");
    console.log("   • Peace Over Violence (LA): 213-626-3393");
    console.log("   • East LA Women's Center: 1-800-585-6231");
    console.log("   • Laura's House (OC): 1-866-498-1511");
    console.log("   • YWCA Becky's House (SD): 619-234-3164");
    console.log("\n🎯 Sections Cover:");
    console.log("   ✓ Immediate danger safety protocols");
    console.log("   ✓ First 72 hours after abuse");
    console.log("   ✓ Finding help in your county (211)");
    console.log("   ✓ County-specific resources (LA, OC, SD)");
    console.log("   ✓ Legal protections & restraining orders");
    console.log("   ✓ Housing pathway (shelter → transitional → permanent)");
    console.log("   ✓ Trauma recovery & healing");
    console.log("   ✓ Employment protections");
    console.log("   ✓ Safe at Home address confidentiality");
    console.log("   ✓ Step-by-step roadmap");

  } catch (error: any) {
    if (error.message?.includes("UNIQUE constraint failed")) {
      console.log("⏭️  Domestic Violence Help article already exists in the database");
    } else {
      console.error("❌ Error:", error.message);
    }
  } finally {
    client.close();
  }
}

addDVArticle();
