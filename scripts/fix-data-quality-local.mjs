import { createClient } from "@libsql/client";

const dbUrl = process.env.DATABASE_URL || "file:./virgil_st_dev.db";
const db = createClient({ url: dbUrl });

async function scalar(query, args = []) {
  const res = await db.execute({ sql: query, args });
  return Number(res.rows?.[0]?.count ?? 0);
}

async function fixDataQuality() {
  console.log("=======================================================");
  console.log("  LOCAL DATA QUALITY FIXES (SQLITE)");
  console.log("=======================================================\n");
  console.log(`Database: ${dbUrl}\n`);

  let totalFixes = 0;

  console.log("Fix #1: Normalizing servesPopulation values...\n");
  const allBefore = await scalar(`
    SELECT COUNT(*) AS count
    FROM treatment_centers
    WHERE LOWER(TRIM(servesPopulation)) = 'all'
  `);
  if (allBefore > 0) {
    await db.execute(`
      UPDATE treatment_centers
      SET servesPopulation = 'coed',
          updatedAt = CAST(strftime('%s', 'now') AS INTEGER)
      WHERE LOWER(TRIM(servesPopulation)) = 'all'
    `);
    console.log(`- Converted ${allBefore} centers from "all" to "coed"`);
    totalFixes += allBefore;
  }

  const couplesBefore = await scalar(`
    SELECT COUNT(*) AS count
    FROM treatment_centers
    WHERE LOWER(TRIM(servesPopulation)) = 'couples'
  `);
  if (couplesBefore > 0) {
    await db.execute(`
      UPDATE treatment_centers
      SET servesPopulation = 'coed',
          acceptsCouples = 1,
          updatedAt = CAST(strftime('%s', 'now') AS INTEGER)
      WHERE LOWER(TRIM(servesPopulation)) = 'couples'
    `);
    console.log(`- Converted ${couplesBefore} centers from "couples" to "coed" and acceptsCouples=1`);
    totalFixes += couplesBefore;
  }

  const remainingInvalidPopulation = await db.execute(`
    SELECT servesPopulation, COUNT(*) AS count
    FROM treatment_centers
    WHERE isPublished = 1
      AND servesPopulation IS NOT NULL
      AND servesPopulation NOT IN ('men', 'women', 'coed', 'lgbtq', 'women_with_children')
    GROUP BY servesPopulation
    ORDER BY count DESC
  `);
  if (remainingInvalidPopulation.rows.length > 0) {
    console.log("\nRemaining non-standard servesPopulation values (manual mapping required):");
    for (const row of remainingInvalidPopulation.rows) {
      console.log(`  - ${row.servesPopulation}: ${row.count}`);
    }
  }

  console.log("\nFix #2: Manual follow-up lists...\n");
  const missingPhone = await db.execute(`
    SELECT id, name, city, type
    FROM treatment_centers
    WHERE isPublished = 1 AND (phone IS NULL OR TRIM(phone) = '')
    ORDER BY name
  `);
  const missingAddress = await db.execute(`
    SELECT id, name, city, type, phone
    FROM treatment_centers
    WHERE isPublished = 1 AND (address IS NULL OR TRIM(address) = '')
    ORDER BY name
  `);
  const resourcesMissingPhoneCount = await scalar(`
    SELECT COUNT(*) AS count
    FROM resources
    WHERE phone IS NULL OR TRIM(phone) = ''
  `);

  console.log(`- Treatment centers missing phone: ${missingPhone.rows.length}`);
  console.log(`- Treatment centers missing address: ${missingAddress.rows.length}`);
  console.log(`- Resources missing phone: ${resourcesMissingPhoneCount}`);

  console.log("\n=======================================================");
  console.log("  SUMMARY");
  console.log("=======================================================\n");
  console.log(`Automated fixes applied: ${totalFixes}`);
  console.log("Manual fixes needed:");
  console.log(`- ${missingPhone.rows.length} treatment centers need phone numbers`);
  console.log(`- ${missingAddress.rows.length} treatment centers need addresses`);
  console.log(`- ${resourcesMissingPhoneCount} resources need phone numbers`);
  if (remainingInvalidPopulation.rows.length > 0) {
    console.log(`- ${remainingInvalidPopulation.rows.length} non-standard servesPopulation values need mapping`);
  }
  console.log("- Medi-Cal acceptance data should be verified manually");
}

fixDataQuality()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });

