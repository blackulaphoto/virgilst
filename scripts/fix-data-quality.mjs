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

async function fixDataQuality() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  DATA QUALITY FIXES');
  console.log('═══════════════════════════════════════════════════════\n');

  let totalFixes = 0;

  // FIX #1: Normalize servesPopulation values
  console.log('Fix #1: Normalizing servesPopulation values...\n');

  // Convert "all" → "coed"
  const allToCoed = await sql`
    UPDATE treatment_centers
    SET "servesPopulation" = 'coed',
        "updatedAt" = EXTRACT(EPOCH FROM NOW())::INTEGER
    WHERE LOWER(TRIM("servesPopulation")) = 'all'
    RETURNING id, name
  `;

  if (allToCoed.length > 0) {
    console.log(`✓ Converted ${allToCoed.length} centers from "all" → "coed":`);
    allToCoed.forEach(c => console.log(`  - ${c.name}`));
    totalFixes += allToCoed.length;
  }

  // Convert "couples" → "coed" AND set acceptsCouples=1
  const couplesToCoed = await sql`
    UPDATE treatment_centers
    SET "servesPopulation" = 'coed',
        "acceptsCouples" = 1,
        "updatedAt" = EXTRACT(EPOCH FROM NOW())::INTEGER
    WHERE LOWER(TRIM("servesPopulation")) = 'couples'
    RETURNING id, name
  `;

  if (couplesToCoed.length > 0) {
    console.log(`\n✓ Converted ${couplesToCoed.length} centers from "couples" → "coed" + acceptsCouples=1:`);
    couplesToCoed.forEach(c => console.log(`  - ${c.name}`));
    totalFixes += couplesToCoed.length;
  }

  const remainingInvalidPopulation = await sql`
    SELECT "servesPopulation", COUNT(*) as count
    FROM treatment_centers
    WHERE "isPublished" = 1
      AND "servesPopulation" IS NOT NULL
      AND "servesPopulation" NOT IN ('men', 'women', 'coed', 'lgbtq', 'women_with_children')
    GROUP BY "servesPopulation"
    ORDER BY count DESC
  `;
  if (remainingInvalidPopulation.length > 0) {
    console.log('\n⚠️  Remaining non-standard servesPopulation values (manual mapping required):');
    remainingInvalidPopulation.forEach((row) => {
      console.log(`  - ${row.servesPopulation}: ${row.count}`);
    });
  }

  // FIX #2: List centers with missing phone numbers for manual review
  console.log('\n\nFix #2: Centers missing phone numbers...\n');

  const missingPhone = await sql`
    SELECT id, name, city, type
    FROM treatment_centers
    WHERE (phone IS NULL OR phone = '') AND "isPublished" = 1
    ORDER BY name
  `;

  if (missingPhone.length > 0) {
    console.log(`⚠️  ${missingPhone.length} centers need phone numbers added:`);
    console.log('  (These require manual research to find correct phone numbers)\n');
    missingPhone.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.name} (${c.city || 'Unknown city'}) - Type: ${c.type}`);
    });
  }

  // FIX #3: List centers with missing addresses
  console.log('\n\nFix #3: Centers missing addresses...\n');

  const missingAddress = await sql`
    SELECT id, name, city, type, phone
    FROM treatment_centers
    WHERE (address IS NULL OR address = '') AND "isPublished" = 1
    ORDER BY name
  `;

  if (missingAddress.length > 0) {
    console.log(`⚠️  ${missingAddress.length} centers need addresses added:`);
    console.log('  (These require manual research to find correct addresses)\n');
    missingAddress.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.name} (${c.city || 'Unknown city'}) - Phone: ${c.phone || 'N/A'}`);
    });
  }

  // FIX #4: Verify Medi-Cal acceptance is accurate
  console.log('\n\nFix #4: Medi-Cal Acceptance Verification...\n');

  const mediCalStats = await sql`
    SELECT
      "acceptsMediCal",
      "servesPopulation",
      COUNT(*) as count
    FROM treatment_centers
    WHERE "isPublished" = 1
    GROUP BY "acceptsMediCal", "servesPopulation"
    ORDER BY "servesPopulation", "acceptsMediCal"
  `;

  console.log('Current Medi-Cal acceptance by population:');
  mediCalStats.forEach(row => {
    const accepts = row.acceptsMediCal === 1 ? 'YES' : 'NO';
    console.log(`  ${row.servesPopulation || '[NULL]'} - Medi-Cal ${accepts}: ${row.count}`);
  });

  console.log('\n⚠️  Only 6% of centers accept Medi-Cal. This may need manual verification.');
  console.log('   Consider researching which sober living homes actually accept Medi-Cal.');

  // FIX #5: Resources missing phone numbers
  console.log('\n\nFix #5: Resources missing phone numbers...\n');

  const resourcesMissingPhoneCount = await sql`
    SELECT COUNT(*) as count
    FROM resources
    WHERE (phone IS NULL OR phone = '')
  `;
  const resourcesMissingPhone = await sql`
    SELECT id, name, type, address
    FROM resources
    WHERE (phone IS NULL OR phone = '')
    ORDER BY type, name
    LIMIT 20
  `;

  if (resourcesMissingPhone.length > 0) {
    console.log(`⚠️  Showing first 20 of ${resourcesMissingPhoneCount[0].count} resources missing phone numbers:`);
    console.log('  (These require manual research)\n');
    resourcesMissingPhone.forEach((r, i) => {
      console.log(`  ${i + 1}. [${r.type}] ${r.name}`);
      if (r.address) console.log(`     Address: ${r.address}`);
    });
  }

  // SUMMARY
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log(`Automated fixes applied: ${totalFixes}`);
  console.log(`\nManual fixes needed:`);
  console.log(`  - ${missingPhone.length} treatment centers need phone numbers`);
  console.log(`  - ${missingAddress.length} treatment centers need addresses`);
  console.log(`  - ${resourcesMissingPhoneCount[0].count} resources need phone numbers`);
  if (remainingInvalidPopulation.length > 0) {
    console.log(`  - ${remainingInvalidPopulation.length} non-standard servesPopulation values need mapping`);
  }
  console.log(`  - Medi-Cal acceptance data needs verification`);

  console.log('\n✅ Automated fixes complete!');
  console.log('⚠️  Manual data entry required for missing contact info.\n');

  await sql.end();
}

fixDataQuality().catch(console.error);
