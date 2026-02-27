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

async function fixChabadData() {
  console.log('Fixing Chabad Treatment Center data...\n');

  try {
    const dbHost = new URL(resolvedDb.url).hostname;
    console.log(`Using ${resolvedDb.source} (${dbHost})\n`);
  } catch {
    console.log(`Using ${resolvedDb.source}\n`);
  }

  // Check current Chabad data
  const chabadBefore = await sql`
    SELECT id, name, "servesPopulation", "acceptsCouples"
    FROM treatment_centers
    WHERE name ILIKE '%chabad%'
    LIMIT 1
  `;

  if (chabadBefore.length === 0) {
    console.log('Chabad Treatment Center not found in treatment_centers table.');
    await sql.end();
    return;
  }

  console.log('Found Chabad:', chabadBefore[0]);
  console.log(`Current: servesPopulation="${chabadBefore[0].servesPopulation}", acceptsCouples=${chabadBefore[0].acceptsCouples}\n`);

  // Fix the data - Chabad is MEN ONLY, does NOT accept couples
  const result = await sql`
    UPDATE treatment_centers
    SET "servesPopulation" = 'men',
        "acceptsCouples" = 0,
        "updatedAt" = EXTRACT(EPOCH FROM NOW())::INTEGER
    WHERE name ILIKE '%chabad%'
    RETURNING id, name, "servesPopulation", "acceptsCouples"
  `;

  if (result.length > 0) {
    console.log('[FIXED] Chabad data updated:');
    console.log(`  servesPopulation: "coed" → "men"`);
    console.log(`  acceptsCouples: 1 → 0`);
    console.log('\n✅ Chabad is now correctly marked as men-only facility');
  } else {
    console.log('No updates made.');
  }

  await sql.end();
}

fixChabadData().catch(console.error);
