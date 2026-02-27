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

async function moveChabadToTreatment() {
  console.log('Moving Chabad Treatment Center to treatment_centers table...\n');

  try {
    const dbHost = new URL(resolvedDb.url).hostname;
    console.log(`Using ${resolvedDb.source} (${dbHost})\n`);
  } catch {
    console.log(`Using ${resolvedDb.source}\n`);
  }

  // First, check if Chabad exists in resources table
  const chabadInResources = await sql`
    SELECT * FROM resources WHERE name ILIKE '%chabad%' LIMIT 1
  `;

  if (chabadInResources.length === 0) {
    console.log('Chabad Treatment Center not found in resources table.');
    await sql.end();
    return;
  }

  console.log('Found in resources:', chabadInResources[0].name);
  const resource = chabadInResources[0];

  // Check if already exists in treatment_centers
  const existingInTreatment = await sql`
    SELECT id FROM treatment_centers WHERE name ILIKE '%chabad%' LIMIT 1
  `;

  if (existingInTreatment.length > 0) {
    console.log('Already exists in treatment_centers table. Skipping insert.');
  } else {
    // Add to treatment_centers table
    const result = await sql`
      INSERT INTO treatment_centers (
        name, type, address, city, "zipCode", phone, website, description,
        "servesPopulation", "acceptsMediCal", "acceptsPrivateInsurance",
        "isVerified", "isPublished"
      ) VALUES (
        ${resource.name},
        'treatment_facility',
        ${resource.address},
        'Los Angeles',
        ${resource.zipCode},
        ${resource.phone},
        ${resource.website},
        ${resource.description},
        'coed',
        1,
        1,
        1,
        1
      )
      RETURNING id
    `;
    console.log(`[ADDED] to treatment_centers table (ID: ${result[0].id})`);
  }

  // Remove from resources table
  await sql`
    DELETE FROM resources WHERE id = ${resource.id}
  `;
  console.log(`[REMOVED] from resources table`);

  console.log('\nMigration complete!');
  await sql.end();
}

moveChabadToTreatment().catch(console.error);
