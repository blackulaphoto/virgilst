import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { resources } from "./drizzle/schema";
import XLSX from "xlsx";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = createClient({
  url: "file:./virgil_st_dev.db"
});

const db = drizzle(client);

async function importFoodPrograms() {
  console.log("🍽️ Importing LA County Food & Grocery Programs\n");

  // Read the Excel file
  const filePath = path.join(__dirname, "knowledge files", "LA_County_Food_Grocery_Programs_by_SPA.xlsx");
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log(`📄 Found ${data.length} programs in Excel file\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  const bySPA: Record<string, number> = {};
  const byCity: Record<string, number> = {};

  for (const row of data as any[]) {
    try {
      const name = row['Program Name'] || row['Name'] || row['Organization'];
      const address = row['Address'] || row['Street Address'];
      const city = row['City'];
      const zipCode = row['ZIP'] || row['Zip Code'] || row['Zip'];
      const phone = row['Phone'] || row['Contact'] || row['Telephone'];
      const hours = row['Hours'] || row['Operating Hours'] || row['Days/Hours'];
      const description = row['Description'] || row['Services'] || row['Program Type'];
      const spa = row['SPA'] || row['Service Planning Area'];
      const website = row['Website'] || row['URL'];

      if (!name) {
        continue;
      }

      // Parse service types and filters
      const filters: Record<string, boolean> = {
        free: true,
        foodPantry: true,
      };

      const descLower = (description || '').toString().toLowerCase();
      const nameLower = name.toString().toLowerCase();
      const combinedText = `${nameLower} ${descLower}`;

      // Determine program type
      if (combinedText.includes('groceries') || combinedText.includes('grocery')) {
        filters.groceryDistribution = true;
      }
      if (combinedText.includes('hot meal') || combinedText.includes('prepared meal')) {
        filters.hotMeals = true;
      }
      if (combinedText.includes('senior') || combinedText.includes('elder')) {
        filters.seniors = true;
      }
      if (combinedText.includes('children') || combinedText.includes('youth') || combinedText.includes('kids')) {
        filters.childFriendly = true;
      }
      if (combinedText.includes('calfresh') || combinedText.includes('snap') || combinedText.includes('ebt')) {
        filters.calfreshEnrollment = true;
      }
      if (combinedText.includes('wic')) {
        filters.wic = true;
      }
      if (combinedText.includes('no id') || combinedText.includes('without id')) {
        filters.noIdRequired = true;
      }
      if (combinedText.includes('homeless')) {
        filters.homeless = true;
      }
      if (combinedText.includes('wheelchair') || combinedText.includes('accessible')) {
        filters.wheelchairAccessible = true;
      }

      await db.insert(resources).values({
        name: name.toString(),
        type: 'food',
        description: description ? description.toString() : `Food assistance program in ${city || 'LA County'}. SPA ${spa || 'N/A'}.`,
        address: address ? address.toString() : null,
        city: city ? city.toString() : null,
        zipCode: zipCode ? zipCode.toString() : null,
        phone: phone ? phone.toString() : null,
        website: website ? website.toString() : null,
        hours: hours ? hours.toString() : null,
        filters: JSON.stringify(filters),
        isVerified: 1,
      });

      // Track stats
      if (spa) {
        const spaKey = `SPA ${spa}`;
        bySPA[spaKey] = (bySPA[spaKey] || 0) + 1;
      }
      if (city) {
        byCity[city.toString()] = (byCity[city.toString()] || 0) + 1;
      }

      imported++;

      if (imported % 50 === 0) {
        console.log(`✅ Imported ${imported} programs...`);
      }

    } catch (error: any) {
      if (error.message?.includes("UNIQUE constraint failed")) {
        skipped++;
      } else {
        console.error(`❌ Error importing program:`, error.message);
        errors++;
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n📊 Import Summary:`);
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped (duplicates): ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📦 Total processed: ${data.length}`);

  console.log("\n📍 By Service Planning Area (SPA):");
  Object.entries(bySPA)
    .sort(([, a], [, b]) => b - a)
    .forEach(([spa, count]) => {
      console.log(`   ${spa}: ${count} programs`);
    });

  console.log("\n🏙️ Top 10 Cities:");
  Object.entries(byCity)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .forEach(([city, count]) => {
      console.log(`   ${city}: ${count} programs`);
    });

  console.log("\n✨ Food & grocery programs import complete!");
  console.log("\n🍽️ Program Features:");
  console.log("   • Free food pantries");
  console.log("   • Grocery distribution");
  console.log("   • Hot meals");
  console.log("   • Senior services");
  console.log("   • CalFresh/SNAP enrollment");
  console.log("   • WIC programs");
  console.log("   • Homeless services");

  client.close();
}

importFoodPrograms();
