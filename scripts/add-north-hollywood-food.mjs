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

const foodResources = [
  {
    name: 'North Hollywood Interfaith Food Pantry (NHIFP)',
    description: 'Groceries, USDA surplus food, occasionally baby food. Open Monday & Friday, 7:30 AM – 11:00 AM.',
    type: 'food',
    address: '11634 Moorpark St, Studio City, CA 91604',
    phone: 'Call for info',
    website: null,
    hours: 'Monday & Friday: 7:30 AM – 11:00 AM',
    zipCode: '91604',
    filters: JSON.stringify({ acceptsEBT: false, noIdRequired: true }),
    isVerified: 1,
  },
  {
    name: 'Holy Family Service Center (St. Charles Borromeo Parish)',
    description: 'Food, clothing, toiletries. Open Tuesday – Sunday, 9:00 AM – 11:30 AM.',
    type: 'food',
    address: '4390 Colfax Ave, North Hollywood, CA',
    phone: 'Call for info',
    website: null,
    hours: 'Tuesday – Sunday: 9:00 AM – 11:30 AM',
    zipCode: '91602',
    filters: JSON.stringify({ noIdRequired: true }),
    isVerified: 1,
  },
  {
    name: 'First Lutheran Church (North Hollywood)',
    description: 'Free meals and food distributions. Open Monday – Friday, 9:00 AM – 2:30 PM.',
    type: 'food',
    address: 'North Hollywood, CA',
    phone: 'Call for info',
    website: null,
    hours: 'Monday – Friday: 9:00 AM – 2:30 PM',
    zipCode: '91601',
    filters: JSON.stringify({ noIdRequired: true }),
    isVerified: 1,
  },
  {
    name: 'Family Rescue Center (North Hollywood)',
    description: 'Food and prepared meals. Open Monday – Friday, 9:00 AM – 1:00 PM.',
    type: 'food',
    address: 'North Hollywood, CA',
    phone: 'Call for info',
    website: null,
    hours: 'Monday – Friday: 9:00 AM – 1:00 PM',
    zipCode: '91601',
    filters: JSON.stringify({ noIdRequired: true }),
    isVerified: 1,
  },
  {
    name: 'YMCA – FeedLA Program (North Hollywood Area)',
    description: 'Fresh produce, groceries, occasionally hot meals. Check local YMCA locations for distribution schedules.',
    type: 'food',
    address: 'North Hollywood Area, CA',
    phone: 'Call local YMCA',
    website: null,
    hours: 'Check local YMCA for schedules',
    zipCode: '91601',
    filters: JSON.stringify({ noIdRequired: true }),
    isVerified: 1,
  },
  {
    name: 'SOVA Community Food & Resource Program (Jewish Family Service LA)',
    description: 'Groceries, hygiene items, resource referrals. Appointments may be required.',
    type: 'food',
    address: 'Los Angeles, CA',
    phone: 'Call for appointments',
    website: 'https://www.jfsla.org/sova',
    hours: 'By appointment',
    zipCode: '90025',
    filters: JSON.stringify({ noIdRequired: false }),
    isVerified: 1,
  },
];

async function addFoodResources() {
  console.log('Adding North Hollywood food resources...\n');
  try {
    const dbHost = new URL(resolvedDb.url).hostname;
    console.log(`Using ${resolvedDb.source} (${dbHost})\n`);
  } catch {
    console.log(`Using ${resolvedDb.source}\n`);
  }

  let added = 0;
  let skipped = 0;

  for (const resource of foodResources) {
    try {
      const existingByName = await sql`
        SELECT id
        FROM resources
        WHERE name = ${resource.name}
        LIMIT 1
      `;

      if (existingByName.length > 0) {
        console.log(`[SKIP] ${resource.name} - already exists`);
        skipped++;
        continue;
      }

      const result = await sql`
        INSERT INTO resources (
          name, description, type, address, phone, website, hours,
          "zipCode", filters, "isVerified"
        ) VALUES (
          ${resource.name},
          ${resource.description},
          ${resource.type},
          ${resource.address},
          ${resource.phone},
          ${resource.website},
          ${resource.hours},
          ${resource.zipCode},
          ${resource.filters},
          ${resource.isVerified}
        )
        RETURNING id
      `;

      if (result.length > 0) {
        console.log(`[ADDED] ${resource.name}`);
        added++;
      } else {
        console.log(`[SKIP] ${resource.name} - insert failed`);
        skipped++;
      }
    } catch (error) {
      console.error(`[ERROR] ${resource.name}: ${error.message}`);
    }
  }

  console.log(`\nSummary: ${added} added, ${skipped} skipped`);
  await sql.end();
}

addFoodResources().catch(console.error);
