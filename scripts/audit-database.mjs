import postgres from 'postgres';

function resolveDatabaseUrl() {
  const privateUrl = process.env.DATABASE_URL;
  const publicUrl = process.env.DATABASE_PUBLIC_URL;

  if (!privateUrl && !publicUrl) {
    throw new Error('DATABASE_URL or DATABASE_PUBLIC_URL is required');
  }

  if (!privateUrl) return { url: publicUrl, source: "DATABASE_PUBLIC_URL" };

  try {
    const hostname = new URL(privateUrl).hostname.toLowerCase();
    const usesInternalHost =
      hostname.endsWith('.railway.internal') || hostname === 'postgres.railway.internal';

    if (usesInternalHost && publicUrl) {
      return { url: publicUrl, source: "DATABASE_PUBLIC_URL" };
    }
  } catch {
    // If URL parsing fails, fall back to private URL.
  }

  return { url: privateUrl, source: "DATABASE_URL" };
}

const resolvedDb = resolveDatabaseUrl();
const sql = postgres(resolvedDb.url);

async function auditDatabase() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  VIRGIL ST. DATABASE AUDIT');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    const dbHost = new URL(resolvedDb.url).hostname;
    console.log(`Database: ${resolvedDb.source} (${dbHost})\n`);
  } catch {
    console.log(`Database: ${resolvedDb.source}\n`);
  }

  // ============ TREATMENT CENTERS AUDIT ============
  console.log('━━━ TREATMENT CENTERS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const totalCenters = await sql`SELECT COUNT(*) as count FROM treatment_centers`;
  console.log(`Total treatment centers: ${totalCenters[0].count}`);

  const publishedCenters = await sql`
    SELECT COUNT(*) as count FROM treatment_centers WHERE "isPublished" = 1
  `;
  console.log(`Published centers: ${publishedCenters[0].count}`);

  const unpublishedCenters = await sql`
    SELECT COUNT(*) as count FROM treatment_centers WHERE "isPublished" = 0
  `;
  console.log(`Unpublished centers: ${unpublishedCenters[0].count}\n`);

  // Check servesPopulation breakdown
  console.log('Population Served Breakdown:');
  const popBreakdown = await sql`
    SELECT "servesPopulation", COUNT(*) as count
    FROM treatment_centers
    WHERE "isPublished" = 1
    GROUP BY "servesPopulation"
    ORDER BY count DESC
  `;
  popBreakdown.forEach(row => {
    console.log(`  ${row.servesPopulation || '[NULL]'}: ${row.count}`);
  });

  // Check couples acceptance
  console.log('\nCouples Acceptance:');
  const couplesYes = await sql`
    SELECT COUNT(*) as count FROM treatment_centers
    WHERE "isPublished" = 1 AND "acceptsCouples" = 1
  `;
  const couplesNo = await sql`
    SELECT COUNT(*) as count FROM treatment_centers
    WHERE "isPublished" = 1 AND "acceptsCouples" = 0
  `;
  console.log(`  Accepts couples: ${couplesYes[0].count}`);
  console.log(`  Does NOT accept couples: ${couplesNo[0].count}`);

  // Check Medi-Cal acceptance
  console.log('\nMedi-Cal Acceptance:');
  const mediCalYes = await sql`
    SELECT COUNT(*) as count FROM treatment_centers
    WHERE "isPublished" = 1 AND "acceptsMediCal" = 1
  `;
  const mediCalNo = await sql`
    SELECT COUNT(*) as count FROM treatment_centers
    WHERE "isPublished" = 1 AND "acceptsMediCal" = 0
  `;
  console.log(`  Accepts Medi-Cal: ${mediCalYes[0].count}`);
  console.log(`  Does NOT accept Medi-Cal: ${mediCalNo[0].count}`);

  // Check for missing critical data
  console.log('\n⚠️  DATA QUALITY ISSUES:');

  const missingPhone = await sql`
    SELECT COUNT(*) as count FROM treatment_centers
    WHERE "isPublished" = 1 AND (phone IS NULL OR phone = '')
  `;
  if (missingPhone[0].count > 0) {
    console.log(`  ❌ ${missingPhone[0].count} centers missing phone numbers`);
  }

  const missingAddress = await sql`
    SELECT COUNT(*) as count FROM treatment_centers
    WHERE "isPublished" = 1 AND (address IS NULL OR address = '')
  `;
  if (missingAddress[0].count > 0) {
    console.log(`  ❌ ${missingAddress[0].count} centers missing addresses`);
  }

  const missingCity = await sql`
    SELECT COUNT(*) as count FROM treatment_centers
    WHERE "isPublished" = 1 AND (city IS NULL OR city = '')
  `;
  if (missingCity[0].count > 0) {
    console.log(`  ❌ ${missingCity[0].count} centers missing city`);
  }

  const nullPopulation = await sql`
    SELECT id, name FROM treatment_centers
    WHERE "isPublished" = 1 AND "servesPopulation" IS NULL
    LIMIT 5
  `;
  if (nullPopulation.length > 0) {
    console.log(`  ❌ ${nullPopulation.length} centers with NULL servesPopulation:`);
    nullPopulation.forEach(c => console.log(`     - ${c.name}`));
  }

  const invalidPopulationValues = await sql`
    SELECT "servesPopulation", COUNT(*) as count
    FROM treatment_centers
    WHERE "isPublished" = 1
      AND "servesPopulation" IS NOT NULL
      AND "servesPopulation" NOT IN ('men', 'women', 'coed', 'lgbtq', 'women_with_children')
    GROUP BY "servesPopulation"
    ORDER BY count DESC
  `;
  if (invalidPopulationValues.length > 0) {
    console.log(`  ⚠️  Found ${invalidPopulationValues.length} non-standard servesPopulation values:`);
    invalidPopulationValues.forEach(row => {
      console.log(`     - ${row.servesPopulation}: ${row.count}`);
    });
  }

  // Check type distribution
  console.log('\nTreatment Center Types:');
  const typeBreakdown = await sql`
    SELECT type, COUNT(*) as count
    FROM treatment_centers
    WHERE "isPublished" = 1
    GROUP BY type
    ORDER BY count DESC
  `;
  typeBreakdown.forEach(row => {
    console.log(`  ${row.type || '[NULL]'}: ${row.count}`);
  });

  // ============ RESOURCES AUDIT ============
  console.log('\n━━━ RESOURCES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const totalResources = await sql`SELECT COUNT(*) as count FROM resources`;
  console.log(`Total resources: ${totalResources[0].count}`);

  const resourceTypes = await sql`
    SELECT type, COUNT(*) as count
    FROM resources
    GROUP BY type
    ORDER BY count DESC
  `;
  console.log('\nResource Types:');
  resourceTypes.forEach(row => {
    console.log(`  ${row.type || '[NULL]'}: ${row.count}`);
  });

  const missingResourcePhone = await sql`
    SELECT COUNT(*) as count FROM resources
    WHERE (phone IS NULL OR phone = '')
  `;
  if (missingResourcePhone[0].count > 0) {
    console.log(`\n⚠️  ${missingResourcePhone[0].count} resources missing phone numbers`);
  }

  const missingResourceType = await sql`
    SELECT COUNT(*) as count FROM resources
    WHERE type IS NULL OR TRIM(type) = ''
  `;
  if (missingResourceType[0].count > 0) {
    console.log(`⚠️  ${missingResourceType[0].count} resources missing type tags`);
  }

  const likelyInvalidResourceFilters = await sql`
    SELECT COUNT(*) as count FROM resources
    WHERE filters IS NOT NULL
      AND TRIM(filters) <> ''
      AND LEFT(TRIM(filters), 1) <> '{'
  `;
  if (likelyInvalidResourceFilters[0].count > 0) {
    console.log(`⚠️  ${likelyInvalidResourceFilters[0].count} resources have non-JSON filters values`);
  }

  // ============ MEDI-CAL PROVIDERS AUDIT ============
  console.log('\n━━━ MEDI-CAL PROVIDERS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const totalProviders = await sql`SELECT COUNT(*) as count FROM medi_cal_providers`;
  console.log(`Total Medi-Cal providers: ${totalProviders[0].count}`);

  const providersWithSpecialties = await sql`
    SELECT COUNT(*) as count
    FROM medi_cal_providers
    WHERE specialties IS NOT NULL
      AND TRIM(specialties) <> ''
      AND TRIM(specialties) <> '[]'
  `;
  const providersMissingSpecialties = await sql`
    SELECT COUNT(*) as count
    FROM medi_cal_providers
    WHERE specialties IS NULL
      OR TRIM(specialties) = ''
      OR TRIM(specialties) = '[]'
  `;
  console.log('\nSpecialty Tag Coverage:');
  console.log(`  With specialties: ${providersWithSpecialties[0].count}`);
  console.log(`  Missing specialties: ${providersMissingSpecialties[0].count}`);

  // ============ MEETINGS AUDIT ============
  console.log('\n━━━ RECOVERY MEETINGS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const totalMeetings = await sql`SELECT COUNT(*) as count FROM meetings`;
  console.log(`Total meetings: ${totalMeetings[0].count}`);

  const meetingTypes = await sql`
    SELECT type, COUNT(*) as count
    FROM meetings
    GROUP BY type
    ORDER BY count DESC
  `;
  console.log('\nMeeting Types:');
  meetingTypes.forEach(row => {
    console.log(`  ${row.type}: ${row.count}`);
  });

  // ============ SUMMARY & RECOMMENDATIONS ============
  console.log('\n━━━ RECOMMENDATIONS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const issues = [];

  if (missingPhone[0].count > 0) {
    issues.push(`Fix ${missingPhone[0].count} treatment centers missing phone numbers`);
  }
  if (missingAddress[0].count > 0) {
    issues.push(`Fix ${missingAddress[0].count} treatment centers missing addresses`);
  }
  if (nullPopulation.length > 0) {
    issues.push(`Set servesPopulation for centers with NULL values`);
  }
  if (invalidPopulationValues.length > 0) {
    issues.push(`Normalize ${invalidPopulationValues.length} non-standard servesPopulation values`);
  }
  if (missingResourceType[0].count > 0) {
    issues.push(`Set type tags for ${missingResourceType[0].count} resources`);
  }
  if (likelyInvalidResourceFilters[0].count > 0) {
    issues.push(`Fix ${likelyInvalidResourceFilters[0].count} resources with invalid filters JSON`);
  }
  if (unpublishedCenters[0].count > 0) {
    issues.push(`Review ${unpublishedCenters[0].count} unpublished centers for publishing`);
  }

  if (issues.length > 0) {
    console.log('Priority Fixes Needed:');
    issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
  } else {
    console.log('✅ No critical data quality issues found!');
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  AUDIT COMPLETE');
  console.log('═══════════════════════════════════════════════════════\n');

  await sql.end();
}

auditDatabase().catch(console.error);
