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

    // When running from a local machine (for example `railway run`),
    // Railway internal DNS cannot be resolved.
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

const clinics = [
  {
    name: 'Fig Tree Therapy Center',
    address: '714 W Olympic Blvd Ste 743',
    city: 'Los Angeles',
    zip: '90015',
    phone: '(310) 712-3411',
    specialties: ['Mental Health', 'EMDR Therapy', 'Trauma Therapy', 'Psychotherapy'],
  },
  {
    name: 'Downtown Mind Wellness',
    address: '617 S Olive St #200',
    city: 'Los Angeles',
    zip: '90014',
    phone: '(213) 430-9080',
    specialties: ['Mental Health', 'Counseling', 'Psychotherapy', 'Trauma-Focused Therapy', 'EMDR Therapy'],
  },
  {
    name: 'Downtown Los Angeles Therapy',
    address: '520 S Grand Ave #680',
    city: 'Los Angeles',
    zip: '90071',
    phone: '(626) 406-2385',
    specialties: ['Mental Health', 'EMDR Therapy', 'Somatic Therapy', 'Trauma Therapy', 'Psychotherapy'],
  },
  {
    name: 'The Mindful Mind',
    address: '533 Colyton St',
    city: 'Los Angeles',
    zip: '90013',
    phone: '(213) 298-0019',
    specialties: ['Mental Health', 'EMDR Therapy', 'Trauma-Informed Therapy', 'Psychotherapy'],
  },
  {
    name: 'Dimitrios Pexaras Therapy',
    address: '427 W 5th St',
    city: 'Los Angeles',
    zip: '90013',
    phone: '(805) 386-6161',
    specialties: ['Mental Health', 'Trauma Therapy', 'Individual Therapy', 'Psychotherapy'],
  },
  {
    name: 'Silver Lake Psychology',
    address: '4325 Sunset Blvd Unit 206',
    city: 'Los Angeles',
    zip: '90029',
    phone: '(310) 879-8004',
    specialties: ['Mental Health', 'EMDR Therapy', 'Trauma Therapy', 'Psychology', 'Psychotherapy'],
  },
  {
    name: 'Rose Junie Therapy',
    address: '1555 Sunset Blvd STE C',
    city: 'Los Angeles',
    zip: '90026',
    phone: '(310) 498-5890',
    specialties: ['Mental Health', 'EMDR Therapy', 'Trauma Therapy', 'Psychotherapy'],
  },
];

async function addClinics() {
  console.log('Adding EMDR therapy clinics...\n');
  try {
    const dbHost = new URL(resolvedDb.url).hostname;
    console.log(`Using ${resolvedDb.source} (${dbHost})\n`);
  } catch {
    console.log(`Using ${resolvedDb.source}\n`);
  }

  let added = 0;
  let skipped = 0;

  for (const clinic of clinics) {
    try {
      const existingByPhone = await sql`
        SELECT id
        FROM medi_cal_providers
        WHERE phone = ${clinic.phone}
        LIMIT 1
      `;

      if (existingByPhone.length > 0) {
        console.log(`[SKIP] ${clinic.name} - already exists`);
        skipped++;
        continue;
      }

      const searchTerms = [
        clinic.name,
        clinic.city,
        ...clinic.specialties,
        'emdr', 'trauma', 'therapy', 'mental health',
      ].join(' ').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

      const result = await sql`
        INSERT INTO medi_cal_providers (
          "providerName", "facilityName", address, city, state, "zipCode", phone,
          specialties, "normalizedSpecialties", "searchTerms", "isVerified"
        ) VALUES (
          ${clinic.name},
          ${clinic.name},
          ${clinic.address},
          ${clinic.city},
          'CA',
          ${clinic.zip},
          ${clinic.phone},
          ${JSON.stringify(clinic.specialties)},
          ${JSON.stringify(clinic.specialties.map(s => s.toLowerCase()))},
          ${searchTerms},
          1
        )
        RETURNING id
      `;

      if (result.length > 0) {
        const providerId = result[0].id;

        await sql`
          INSERT INTO provider_categories ("providerId", "categoryKey")
          VALUES (${providerId}, 'mental_health')
          ON CONFLICT DO NOTHING
        `;

        console.log(`[ADDED] ${clinic.name}`);
        added++;
      } else {
        console.log(`[SKIP] ${clinic.name} - already exists`);
        skipped++;
      }
    } catch (error) {
      console.error(`[ERROR] ${clinic.name}: ${error.message}`);
    }
  }

  console.log(`\nSummary: ${added} added, ${skipped} skipped`);
  await sql.end();
}

addClinics().catch(console.error);
