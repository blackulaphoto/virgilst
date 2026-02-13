import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { treatmentCenters } from "./drizzle/schema";
import { eq } from "drizzle-orm";
import XLSX from "xlsx";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = createClient({
  url: "file:./virgil_st_dev.db"
});

const db = drizzle(client);

async function updateSoberLivingDetails() {
  console.log("🏠 Updating Sober Living Facilities with Complete Details\n");

  // Read the Excel file
  const filePath = path.join(__dirname, "knowledge files", "CA_Sober_Living_Directory.xlsx");
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log(`📄 Found ${data.length} facilities in Excel file\n`);

  let updated = 0;
  let errors = 0;
  let notFound = 0;

  // Group facilities by gender type for summary
  const byGender = {
    men: 0,
    women: 0,
    coed: 0,
    all: 0,
  };

  const byPriceRange = {
    free: 0,
    under1000: 0,
    '1000-1500': 0,
    '1500-2000': 0,
    over2000: 0,
    unknown: 0,
  };

  const cityCounts: Record<string, number> = {};

  for (const row of data as any[]) {
    try {
      const facilityName = row['Facility Name'] || row['Name'] || row['name'];
      const city = row['City'] || row['city'];
      const price = row['Price'] || row['price'] || row['Monthly Cost'] || row['Cost'];
      const gender = row['Gender'] || row['Serves'] || row['Population Served'];
      const phone = row['Phone'] || row['phone'] || row['Contact'];
      const address = row['Address'] || row['address'];
      const website = row['Website'] || row['website'] || row['URL'];

      if (!facilityName) {
        continue;
      }

      // Determine serves population
      let servesPopulation = 'all';
      if (gender) {
        const genderLower = gender.toString().toLowerCase();
        if (genderLower.includes('men') && !genderLower.includes('women')) {
          servesPopulation = 'men';
        } else if (genderLower.includes('women') || genderLower.includes('female')) {
          servesPopulation = 'women';
        } else if (genderLower.includes('coed') || genderLower.includes('co-ed')) {
          servesPopulation = 'coed';
        }
      }

      // Parse price range
      let priceRange = '';
      if (price) {
        const priceStr = price.toString().toLowerCase();
        if (priceStr.includes('free') || priceStr.includes('$0')) {
          priceRange = 'Free';
          byPriceRange.free++;
        } else {
          // Extract numeric value
          const numbers = priceStr.match(/\d+/g);
          if (numbers && numbers.length > 0) {
            const amount = parseInt(numbers[0]);
            if (amount < 1000) {
              priceRange = `$${amount}`;
              byPriceRange.under1000++;
            } else if (amount >= 1000 && amount < 1500) {
              priceRange = `$${amount}`;
              byPriceRange['1000-1500']++;
            } else if (amount >= 1500 && amount < 2000) {
              priceRange = `$${amount}`;
              byPriceRange['1500-2000']++;
            } else {
              priceRange = `$${amount}`;
              byPriceRange.over2000++;
            }
          } else {
            priceRange = priceStr.includes('varies') ? 'Varies' : '';
            byPriceRange.unknown++;
          }
        }
      } else {
        byPriceRange.unknown++;
      }

      // Try to find and update the facility
      const results = await db
        .select()
        .from(treatmentCenters)
        .where(eq(treatmentCenters.name, facilityName))
        .limit(1);

      if (results.length > 0) {
        const facility = results[0];

        // Update the facility with complete information
        await db
          .update(treatmentCenters)
          .set({
            servesPopulation,
            priceRange: priceRange || facility.priceRange,
            city: city || facility.city,
            phone: phone || facility.phone,
            address: address || facility.address,
            website: website || facility.website,
          })
          .where(eq(treatmentCenters.id, facility.id));

        updated++;

        // Track by gender
        if (servesPopulation === 'men') byGender.men++;
        else if (servesPopulation === 'women') byGender.women++;
        else if (servesPopulation === 'coed') byGender.coed++;
        else byGender.all++;

        // Track by city
        const cityName = city || facility.city || 'Unknown';
        cityCounts[cityName] = (cityCounts[cityName] || 0) + 1;

        if (updated % 50 === 0) {
          console.log(`✅ Updated ${updated} facilities...`);
        }
      } else {
        notFound++;
      }

    } catch (error: any) {
      console.error(`❌ Error processing facility:`, error.message);
      errors++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n📊 Update Summary:`);
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ⏭️  Not found in DB: ${notFound}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📦 Total processed: ${data.length}`);

  console.log("\n📋 By Gender:");
  console.log(`   👨 Men only: ${byGender.men}`);
  console.log(`   👩 Women only: ${byGender.women}`);
  console.log(`   👫 Coed: ${byGender.coed}`);
  console.log(`   👥 All: ${byGender.all}`);

  console.log("\n💰 By Price Range:");
  console.log(`   🆓 Free: ${byPriceRange.free}`);
  console.log(`   💵 Under $1,000: ${byPriceRange.under1000}`);
  console.log(`   💵 $1,000-$1,500: ${byPriceRange['1000-1500']}`);
  console.log(`   💵 $1,500-$2,000: ${byPriceRange['1500-2000']}`);
  console.log(`   💰 Over $2,000: ${byPriceRange.over2000}`);
  console.log(`   ❓ Unknown: ${byPriceRange.unknown}`);

  console.log("\n📍 Top 10 Cities:");
  const topCities = Object.entries(cityCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  topCities.forEach(([city, count]) => {
    console.log(`   ${city}: ${count} facilities`);
  });

  console.log("\n✨ Sober living details update complete!");

  client.close();
}

updateSoberLivingDetails();
