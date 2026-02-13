import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { treatmentCenters } from "./drizzle/schema";
import XLSX from "xlsx";
import * as fs from "fs";

const client = createClient({
  url: "file:./virgil_st_dev.db"
});

const db = drizzle(client);

function parsePrice(priceStr: string): string {
  if (!priceStr) return "Varies";
  return priceStr.toString().trim();
}

function parseGender(gender: string, serves: string): string {
  const combined = `${gender} ${serves}`.toLowerCase();

  if (combined.includes("women") && combined.includes("children")) return "women_with_children";
  if (combined.includes("women only") || combined.includes("women")) return "women";
  if (combined.includes("men only") || combined.includes("men")) return "men";
  if (combined.includes("coed")) return "all";

  return "all";
}

function extractCity(location: string): string {
  if (!location) return "California";
  return location.trim();
}

async function importExcelData() {
  console.log("📊 Reading Excel file...\n");

  // Read the Excel file
  const workbook = XLSX.readFile("CA_Sober_Living_Directory.xlsx");
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON
  const data: any[] = XLSX.utils.sheet_to_json(worksheet);

  console.log(`Found ${data.length} rows in Excel file\n`);
  console.log("🏠 Importing California Sober Living Directory...\n");

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of data) {
    try {
      // Skip if no name
      if (!row.Name) {
        skipped++;
        continue;
      }

      const name = row.Name?.toString().trim();
      const location = row.Location?.toString().trim() || "";
      const gender = row.Gender?.toString() || "";
      const serves = row.Serves?.toString() || "";
      const price = parsePrice(row.Price);
      const contact = row.Contact?.toString().trim() || "";
      const phone = row.Phone?.toString().trim() || "";
      const website = row.Website?.toString().trim() || "";

      const servesPopulation = parseGender(gender, serves);
      const city = extractCity(location);

      // Determine if accepts couples
      const acceptsCouples = serves.toLowerCase().includes("women with children") ||
                            gender.toLowerCase().includes("coed") ? 1 : 0;

      await db.insert(treatmentCenters).values({
        name: name,
        type: "sober_living",
        address: location,
        city: city,
        zipCode: null,
        phone: phone || null,
        website: website || null,
        servesPopulation: servesPopulation,
        acceptsCouples: acceptsCouples,
        acceptsMediCal: 0, // Not specified in this data
        acceptsMedicare: 0,
        acceptsPrivateInsurance: 1, // Assume private pay
        acceptsRBH: 0,
        priceRange: price,
        servicesOffered: JSON.stringify(["Sober living", serves]),
        amenities: null,
        isJointCommission: 0,
        isVerified: 0,
        isPublished: 1,
        description: `Contact: ${contact}. Gender: ${gender}. Serves: ${serves}.`
      });

      console.log(`✅ ${name}`);
      console.log(`   ${city} | ${servesPopulation} | ${price}\n`);
      imported++;

    } catch (error: any) {
      if (error.message?.includes("UNIQUE constraint failed")) {
        console.log(`⏭️  Skipped (already exists): ${row.Name}\n`);
        skipped++;
      } else {
        console.error(`❌ Error importing ${row.Name}:`, error.message);
        errors++;
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n📊 Import Summary:`);
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📦 Total rows processed: ${data.length}`);

  console.log("\n✨ California Sober Living Directory import complete!");

  client.close();
}

importExcelData();
