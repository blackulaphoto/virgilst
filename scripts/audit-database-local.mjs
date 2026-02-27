import { createClient } from "@libsql/client";

const dbUrl = process.env.DATABASE_URL || "file:./virgil_st_dev.db";
const db = createClient({ url: dbUrl });

async function scalar(query, args = []) {
  const res = await db.execute({ sql: query, args });
  return Number(res.rows?.[0]?.count ?? 0);
}

async function auditDatabase() {
  console.log("=======================================================");
  console.log("  VIRGIL ST. LOCAL DATABASE AUDIT (SQLITE)");
  console.log("=======================================================\n");
  console.log(`Database: ${dbUrl}\n`);

  console.log("--- TREATMENT CENTERS ---------------------------------\n");
  const totalCenters = await scalar(`SELECT COUNT(*) AS count FROM treatment_centers`);
  const publishedCenters = await scalar(`SELECT COUNT(*) AS count FROM treatment_centers WHERE isPublished = 1`);
  const unpublishedCenters = await scalar(`SELECT COUNT(*) AS count FROM treatment_centers WHERE isPublished = 0`);
  console.log(`Total treatment centers: ${totalCenters}`);
  console.log(`Published centers: ${publishedCenters}`);
  console.log(`Unpublished centers: ${unpublishedCenters}\n`);

  const popBreakdown = await db.execute(`
    SELECT servesPopulation, COUNT(*) AS count
    FROM treatment_centers
    WHERE isPublished = 1
    GROUP BY servesPopulation
    ORDER BY count DESC
  `);
  console.log("Population Served Breakdown:");
  for (const row of popBreakdown.rows) {
    console.log(`  ${row.servesPopulation || "[NULL]"}: ${row.count}`);
  }

  const couplesYes = await scalar(`SELECT COUNT(*) AS count FROM treatment_centers WHERE isPublished = 1 AND acceptsCouples = 1`);
  const couplesNo = await scalar(`SELECT COUNT(*) AS count FROM treatment_centers WHERE isPublished = 1 AND acceptsCouples = 0`);
  console.log("\nCouples Acceptance:");
  console.log(`  Accepts couples: ${couplesYes}`);
  console.log(`  Does NOT accept couples: ${couplesNo}`);

  const mediCalYes = await scalar(`SELECT COUNT(*) AS count FROM treatment_centers WHERE isPublished = 1 AND acceptsMediCal = 1`);
  const mediCalNo = await scalar(`SELECT COUNT(*) AS count FROM treatment_centers WHERE isPublished = 1 AND acceptsMediCal = 0`);
  console.log("\nMedi-Cal Acceptance:");
  console.log(`  Accepts Medi-Cal: ${mediCalYes}`);
  console.log(`  Does NOT accept Medi-Cal: ${mediCalNo}`);

  const missingPhone = await scalar(`SELECT COUNT(*) AS count FROM treatment_centers WHERE isPublished = 1 AND (phone IS NULL OR TRIM(phone) = '')`);
  const missingAddress = await scalar(`SELECT COUNT(*) AS count FROM treatment_centers WHERE isPublished = 1 AND (address IS NULL OR TRIM(address) = '')`);
  const missingCity = await scalar(`SELECT COUNT(*) AS count FROM treatment_centers WHERE isPublished = 1 AND (city IS NULL OR TRIM(city) = '')`);
  console.log("\nData Quality Issues:");
  if (missingPhone > 0) console.log(`  - ${missingPhone} centers missing phone numbers`);
  if (missingAddress > 0) console.log(`  - ${missingAddress} centers missing addresses`);
  if (missingCity > 0) console.log(`  - ${missingCity} centers missing city`);

  const invalidPopulation = await db.execute(`
    SELECT servesPopulation, COUNT(*) AS count
    FROM treatment_centers
    WHERE isPublished = 1
      AND servesPopulation IS NOT NULL
      AND servesPopulation NOT IN ('men', 'women', 'coed', 'lgbtq', 'women_with_children')
    GROUP BY servesPopulation
    ORDER BY count DESC
  `);
  if (invalidPopulation.rows.length > 0) {
    console.log("\nNon-standard servesPopulation values:");
    for (const row of invalidPopulation.rows) {
      console.log(`  - ${row.servesPopulation}: ${row.count}`);
    }
  }

  console.log("\n--- RESOURCES -----------------------------------------\n");
  const totalResources = await scalar(`SELECT COUNT(*) AS count FROM resources`);
  console.log(`Total resources: ${totalResources}`);
  const resourceTypes = await db.execute(`
    SELECT type, COUNT(*) AS count
    FROM resources
    GROUP BY type
    ORDER BY count DESC
  `);
  console.log("\nResource Types:");
  for (const row of resourceTypes.rows) {
    console.log(`  ${row.type || "[NULL]"}: ${row.count}`);
  }

  const missingResourcePhone = await scalar(`SELECT COUNT(*) AS count FROM resources WHERE phone IS NULL OR TRIM(phone) = ''`);
  const missingResourceType = await scalar(`SELECT COUNT(*) AS count FROM resources WHERE type IS NULL OR TRIM(type) = ''`);
  const invalidFilters = await scalar(`
    SELECT COUNT(*) AS count
    FROM resources
    WHERE filters IS NOT NULL
      AND TRIM(filters) <> ''
      AND SUBSTR(TRIM(filters), 1, 1) <> '{'
  `);
  if (missingResourcePhone > 0) console.log(`\n- ${missingResourcePhone} resources missing phone numbers`);
  if (missingResourceType > 0) console.log(`- ${missingResourceType} resources missing type tags`);
  if (invalidFilters > 0) console.log(`- ${invalidFilters} resources have non-JSON filters values`);

  console.log("\n--- MEDI-CAL PROVIDERS --------------------------------\n");
  const totalProviders = await scalar(`SELECT COUNT(*) AS count FROM medi_cal_providers`);
  const providersWithSpecialties = await scalar(`
    SELECT COUNT(*) AS count
    FROM medi_cal_providers
    WHERE specialties IS NOT NULL AND TRIM(specialties) <> '' AND TRIM(specialties) <> '[]'
  `);
  const providersMissingSpecialties = await scalar(`
    SELECT COUNT(*) AS count
    FROM medi_cal_providers
    WHERE specialties IS NULL OR TRIM(specialties) = '' OR TRIM(specialties) = '[]'
  `);
  console.log(`Total Medi-Cal providers: ${totalProviders}`);
  console.log(`With specialties: ${providersWithSpecialties}`);
  console.log(`Missing specialties: ${providersMissingSpecialties}`);

  console.log("\n--- RECOVERY MEETINGS ---------------------------------\n");
  const totalMeetings = await scalar(`SELECT COUNT(*) AS count FROM meetings`);
  console.log(`Total meetings: ${totalMeetings}`);
  const meetingTypes = await db.execute(`
    SELECT type, COUNT(*) AS count
    FROM meetings
    GROUP BY type
    ORDER BY count DESC
  `);
  console.log("\nMeeting Types:");
  for (const row of meetingTypes.rows) {
    console.log(`  ${row.type || "[NULL]"}: ${row.count}`);
  }

  console.log("\n=======================================================");
  console.log("  AUDIT COMPLETE");
  console.log("=======================================================\n");
}

auditDatabase()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });

