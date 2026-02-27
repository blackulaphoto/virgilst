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

async function checkResourceTypes() {
  console.log('Checking resource types in database...\n');

  try {
    const dbHost = new URL(resolvedDb.url).hostname;
    console.log(`Using ${resolvedDb.source} (${dbHost})\n`);
  } catch {
    console.log(`Using ${resolvedDb.source}\n`);
  }

  // Get all unique types and their counts
  const types = await sql`
    SELECT type, COUNT(*) as count
    FROM resources
    GROUP BY type
    ORDER BY count DESC
  `;

  console.log('Current resource types in database:');
  console.log('=====================================\n');

  for (const row of types) {
    console.log(`${row.type}: ${row.count} resources`);
  }

  console.log('\n\nExpected types for UI categories:');
  console.log('=====================================');
  console.log('food - Food and Grocery Programs');
  console.log('housing - Housing Assistance');
  console.log('transportation - Transportation');
  console.log('dental - Healthcare and Dental');
  console.log('legal - Legal Services (or legal_aid)');
  console.log('shelter - Emergency Shelter');
  console.log('crisis_hotline - Crisis Hotlines');
  console.log('legal_aid - Legal Aid');

  console.log('\n\nSample resources by type:');
  console.log('=====================================\n');

  for (const row of types) {
    const samples = await sql`
      SELECT name, type
      FROM resources
      WHERE type = ${row.type}
      LIMIT 3
    `;

    console.log(`\n${row.type.toUpperCase()} (${row.count} total):`);
    for (const sample of samples) {
      console.log(`  - ${sample.name}`);
    }
  }

  await sql.end();
}

checkResourceTypes().catch(console.error);
