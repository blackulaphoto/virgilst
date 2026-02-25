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

const centers = [
  {
    name: 'Harmony Place Addiction Recovery Center',
    type: 'treatment_facility',
    address: 'Los Angeles',
    city: 'Los Angeles',
    zipCode: '90000', // Generic LA zip
    phone: 'See website',
    website: 'https://harmonyplace.com/',
    description: 'Detox, residential, PHP, IOP. Dedicated Anthem BCBS/Anthem California IOP coverage for Los Angeles.',
    servicesOffered: JSON.stringify(['Detox', 'Residential', 'PHP', 'IOP']),
    servesPopulation: 'coed',
    acceptsCouples: 1,
    acceptsAnthemInsurance: 1,
    acceptsPrivateInsurance: 1,
    isVerified: 1,
  },
  {
    name: 'Westwind Recovery',
    type: 'treatment_facility',
    address: 'Los Angeles',
    city: 'Los Angeles',
    zipCode: '90000',
    phone: 'See website',
    website: 'https://westwindrecovery.com/',
    description: 'Detox, residential inpatient, outpatient, PHP, IOP, dual diagnosis. Accepts Anthem Blue Cross coverage.',
    servicesOffered: JSON.stringify(['Detox', 'Residential', 'Outpatient', 'PHP', 'IOP', 'Dual Diagnosis']),
    servesPopulation: 'coed',
    acceptsCouples: 1,
    acceptsAnthemInsurance: 1,
    acceptsPrivateInsurance: 1,
    isVerified: 1,
  },
  {
    name: 'Los Angeles Outpatient Center',
    type: 'outpatient',
    address: 'Culver City',
    city: 'Culver City',
    zipCode: '90230',
    phone: 'See website',
    website: 'https://laopcenter.com/',
    description: 'Outpatient, likely higher levels. Explicitly accepts Anthem Blue Cross for mental health treatment.',
    servicesOffered: JSON.stringify(['Outpatient', 'Mental Health Treatment']),
    servesPopulation: 'coed',
    acceptsCouples: 1,
    acceptsAnthemInsurance: 1,
    acceptsPrivateInsurance: 1,
    isVerified: 1,
  },
  {
    name: 'Lifescape Recovery',
    type: 'treatment_facility',
    address: 'Los Angeles',
    city: 'Los Angeles',
    zipCode: '90000',
    phone: 'See website',
    website: 'https://lifescaperecovery.com/',
    description: 'In-network Anthem mental health provider in Los Angeles. Anthem covers residential, PHP, outpatient, and IOP treatment.',
    servicesOffered: JSON.stringify(['Residential', 'PHP', 'Outpatient', 'IOP', 'Mental Health']),
    servesPopulation: 'coed',
    acceptsCouples: 1,
    acceptsAnthemInsurance: 1,
    acceptsPrivateInsurance: 1,
    isVerified: 1,
  },
  {
    name: 'Solace Treatment Center',
    type: 'treatment_facility',
    address: 'California',
    city: 'Los Angeles',
    zipCode: '90000',
    phone: 'See website',
    website: 'https://solacetreatmentcenter.com/',
    description: 'Substance abuse and mental health treatment. Accepts Anthem Blue Cross Blue Shield PPO.',
    servicesOffered: JSON.stringify(['Substance Abuse Treatment', 'Mental Health Treatment']),
    servesPopulation: 'coed',
    acceptsCouples: 1,
    acceptsAnthemInsurance: 1,
    acceptsPrivateInsurance: 1,
    isVerified: 1,
  },
  {
    name: 'Clear Behavioral Health',
    type: 'treatment_facility',
    address: 'Los Angeles / SoCal',
    city: 'Los Angeles',
    zipCode: '90000',
    phone: 'See website',
    website: 'https://clearbehavioralhealth.com/',
    description: 'Mental health & addiction programs including IOP/PHP. Accepts Anthem for mental health and rehab programs.',
    servicesOffered: JSON.stringify(['Mental Health', 'Addiction', 'IOP', 'PHP']),
    servesPopulation: 'coed',
    acceptsCouples: 1,
    acceptsAnthemInsurance: 1,
    acceptsPrivateInsurance: 1,
    isVerified: 1,
  },
  {
    name: 'Thrive Treatment',
    type: 'treatment_facility',
    address: 'Santa Monica',
    city: 'Santa Monica',
    zipCode: '90401',
    phone: 'See website',
    website: 'https://thrivetreatment.com/',
    description: 'PHP, IOP, outpatient for substance use and co-occurring disorders. Accepts BCBS of California (Anthem) for rehab treatment.',
    servicesOffered: JSON.stringify(['PHP', 'IOP', 'Outpatient', 'Co-occurring Disorders']),
    servesPopulation: 'coed',
    acceptsCouples: 1,
    acceptsAnthemInsurance: 1,
    acceptsPrivateInsurance: 1,
    isVerified: 1,
  },
  {
    name: 'CAST Centers',
    type: 'treatment_facility',
    address: 'Los Angeles',
    city: 'Los Angeles',
    zipCode: '90000',
    phone: 'See website',
    website: 'https://castcenters.com/',
    description: 'Structured IOP and PHP for mental health and addiction. Commonly works with major insurers including Anthem Blue Cross.',
    servicesOffered: JSON.stringify(['IOP', 'PHP', 'Mental Health', 'Addiction']),
    servesPopulation: 'coed',
    acceptsCouples: 1,
    acceptsAnthemInsurance: 1,
    acceptsPrivateInsurance: 1,
    isVerified: 1,
  },
  {
    name: 'Clearview Outpatient',
    type: 'outpatient',
    address: 'Los Angeles',
    city: 'Los Angeles',
    zipCode: '90000',
    phone: 'See website',
    website: 'https://clearviewoutpatient.com/los-angeles/',
    description: 'Adult PHP, IOP, and evening programs for anxiety, depression, PTSD, personality disorders. Works with major plans including Anthem.',
    servicesOffered: JSON.stringify(['PHP', 'IOP', 'Evening Programs', 'Anxiety', 'Depression', 'PTSD']),
    servesPopulation: 'coed',
    acceptsCouples: 1,
    acceptsAnthemInsurance: 1,
    acceptsPrivateInsurance: 1,
    isVerified: 1,
  },
  {
    name: 'Lightfully Behavioral Health',
    type: 'virtual_iop',
    address: 'Virtual (California-wide)',
    city: 'Los Angeles',
    zipCode: '90000',
    phone: 'See website',
    website: 'https://lightfully.com/online-therapy/',
    description: 'Virtual IOP across California. Can be used as backup if in-person beds not available. Works with commercial insurers including Anthem.',
    servicesOffered: JSON.stringify(['Virtual IOP', 'Online Therapy']),
    servesPopulation: 'coed',
    acceptsCouples: 1,
    acceptsAnthemInsurance: 1,
    acceptsPrivateInsurance: 1,
    isVerified: 1,
  },
];

async function addCenters() {
  console.log('Adding Anthem couples treatment centers...\n');
  try {
    const dbHost = new URL(resolvedDb.url).hostname;
    console.log(`Using ${resolvedDb.source} (${dbHost})\n`);
  } catch {
    console.log(`Using ${resolvedDb.source}\n`);
  }

  // First, check if the acceptsAnthemInsurance column exists, if not add it
  try {
    await sql`
      ALTER TABLE treatment_centers
      ADD COLUMN IF NOT EXISTS "acceptsAnthemInsurance" INTEGER DEFAULT 0 NOT NULL
    `;
    console.log('[MIGRATION] Added acceptsAnthemInsurance column\n');
  } catch (error) {
    console.log(`[MIGRATION] Column may already exist: ${error.message}\n`);
  }

  let added = 0;
  let skipped = 0;

  for (const center of centers) {
    try {
      const existingByName = await sql`
        SELECT id
        FROM treatment_centers
        WHERE name = ${center.name}
        LIMIT 1
      `;

      if (existingByName.length > 0) {
        console.log(`[SKIP] ${center.name} - already exists`);
        skipped++;
        continue;
      }

      const result = await sql`
        INSERT INTO treatment_centers (
          name, type, address, city, "zipCode", phone, website, description,
          "servicesOffered", "servesPopulation", "acceptsCouples",
          "acceptsAnthemInsurance", "acceptsPrivateInsurance", "isVerified"
        ) VALUES (
          ${center.name},
          ${center.type},
          ${center.address},
          ${center.city},
          ${center.zipCode},
          ${center.phone},
          ${center.website},
          ${center.description},
          ${center.servicesOffered},
          ${center.servesPopulation},
          ${center.acceptsCouples},
          ${center.acceptsAnthemInsurance},
          ${center.acceptsPrivateInsurance},
          ${center.isVerified}
        )
        RETURNING id
      `;

      if (result.length > 0) {
        console.log(`[ADDED] ${center.name}`);
        added++;
      } else {
        console.log(`[SKIP] ${center.name} - insert failed`);
        skipped++;
      }
    } catch (error) {
      console.error(`[ERROR] ${center.name}: ${error.message}`);
    }
  }

  console.log(`\nSummary: ${added} added, ${skipped} skipped`);
  await sql.end();
}

addCenters().catch(console.error);
