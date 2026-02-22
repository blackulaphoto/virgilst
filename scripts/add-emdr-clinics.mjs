import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

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

  let added = 0;
  let skipped = 0;

  for (const clinic of clinics) {
    try {
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
        ON CONFLICT (phone) DO NOTHING
        RETURNING id
      `;

      if (result.length === 0) {
        console.log(`⏭️  ${clinic.name} - already exists`);
        skipped++;
      } else {
        const providerId = result[0].id;

        // Add mental_health category
        await sql`
          INSERT INTO provider_categories ("providerId", "categoryKey")
          VALUES (${providerId}, 'mental_health')
          ON CONFLICT DO NOTHING
        `;

        console.log(`✅ ${clinic.name}`);
        added++;
      }
    } catch (error) {
      console.error(`❌ ${clinic.name}: ${error.message}`);
    }
  }

  console.log(`\n📊 Summary: ${added} added, ${skipped} skipped`);
  await sql.end();
}

addClinics().catch(console.error);
