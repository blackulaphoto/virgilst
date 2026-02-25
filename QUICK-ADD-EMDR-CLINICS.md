# Quick Add EMDR Clinics to Railway Database

## Steps:

1. **Go to Railway Dashboard**: https://railway.app
2. **Select your PostgreSQL database** (not the virgilst service, the actual Postgres database)
3. **Click "Data" tab** (you should see your tables listed)
4. **Click "Query"** at the top
5. **Copy and paste the SQL below** into the query box
6. **Click "Run Query" or press Ctrl+Enter**

---

## SQL to Run:

```sql
-- Insert all 7 EMDR therapy clinics
WITH new_providers AS (
  INSERT INTO medi_cal_providers (
    "providerName", "facilityName", address, city, state, "zipCode", phone,
    specialties, "normalizedSpecialties", "searchTerms", "isVerified"
  ) VALUES
  (
    'Fig Tree Therapy Center',
    'Fig Tree Therapy Center',
    '714 W Olympic Blvd Ste 743',
    'Los Angeles',
    'CA',
    '90015',
    '(310) 712-3411',
    '["Mental Health","EMDR Therapy","Trauma Therapy","Psychotherapy"]',
    '["mental health","emdr therapy","trauma therapy","psychotherapy"]',
    'fig tree therapy center los angeles mental health emdr therapy trauma therapy psychotherapy',
    1
  ),
  (
    'Downtown Mind Wellness',
    'Downtown Mind Wellness',
    '617 S Olive St #200',
    'Los Angeles',
    'CA',
    '90014',
    '(213) 430-9080',
    '["Mental Health","Counseling","Psychotherapy","Trauma-Focused Therapy","EMDR Therapy"]',
    '["mental health","counseling","psychotherapy","trauma-focused therapy","emdr therapy"]',
    'downtown mind wellness los angeles mental health counseling psychotherapy trauma emdr therapy',
    1
  ),
  (
    'Downtown Los Angeles Therapy',
    'Downtown Los Angeles Therapy',
    '520 S Grand Ave #680',
    'Los Angeles',
    'CA',
    '90071',
    '(626) 406-2385',
    '["Mental Health","EMDR Therapy","Somatic Therapy","Trauma Therapy","Psychotherapy"]',
    '["mental health","emdr therapy","somatic therapy","trauma therapy","psychotherapy"]',
    'downtown los angeles therapy somatic emdr trauma mental health psychotherapy',
    1
  ),
  (
    'The Mindful Mind',
    'The Mindful Mind',
    '533 Colyton St',
    'Los Angeles',
    'CA',
    '90013',
    '(213) 298-0019',
    '["Mental Health","EMDR Therapy","Trauma-Informed Therapy","Psychotherapy"]',
    '["mental health","emdr therapy","trauma-informed therapy","psychotherapy"]',
    'the mindful mind los angeles mental health emdr therapy trauma psychotherapy',
    1
  ),
  (
    'Dimitrios Pexaras Therapy',
    'Dimitrios Pexaras Therapy',
    '427 W 5th St',
    'Los Angeles',
    'CA',
    '90013',
    '(805) 386-6161',
    '["Mental Health","Trauma Therapy","Individual Therapy","Psychotherapy"]',
    '["mental health","trauma therapy","individual therapy","psychotherapy"]',
    'dimitrios pexaras therapy los angeles mental health trauma therapy individual psychotherapy',
    1
  ),
  (
    'Silver Lake Psychology',
    'Silver Lake Psychology',
    '4325 Sunset Blvd Unit 206',
    'Los Angeles',
    'CA',
    '90029',
    '(310) 879-8004',
    '["Mental Health","EMDR Therapy","Trauma Therapy","Psychology","Psychotherapy"]',
    '["mental health","emdr therapy","trauma therapy","psychology","psychotherapy"]',
    'silver lake psychology los angeles mental health emdr therapy trauma psychology psychotherapy',
    1
  ),
  (
    'Rose Junie Therapy',
    'Rose Junie Therapy',
    '1555 Sunset Blvd STE C',
    'Los Angeles',
    'CA',
    '90026',
    '(310) 498-5890',
    '["Mental Health","EMDR Therapy","Trauma Therapy","Psychotherapy"]',
    '["mental health","emdr therapy","trauma therapy","psychotherapy"]',
    'rose junie therapy los angeles mental health emdr therapy trauma psychotherapy',
    1
  )
  ON CONFLICT (phone) DO NOTHING
  RETURNING id, "providerName"
)
SELECT * FROM new_providers;

-- Add mental_health category for all new providers
INSERT INTO provider_categories ("providerId", "categoryKey")
SELECT id, 'mental_health'
FROM medi_cal_providers
WHERE phone IN (
  '(310) 712-3411',
  '(213) 430-9080',
  '(626) 406-2385',
  '(213) 298-0019',
  '(805) 386-6161',
  '(310) 879-8004',
  '(310) 498-5890'
)
ON CONFLICT DO NOTHING;

-- Verify they were added
SELECT "providerName", city, phone
FROM medi_cal_providers
WHERE phone IN (
  '(310) 712-3411',
  '(213) 430-9080',
  '(626) 406-2385',
  '(213) 298-0019',
  '(805) 386-6161',
  '(310) 879-8004',
  '(310) 498-5890'
)
ORDER BY "providerName";
```

---

## Expected Result:

You should see 7 rows returned showing:
- Fig Tree Therapy Center
- Dimitrios Pexaras Therapy
- Downtown Los Angeles Therapy
- Downtown Mind Wellness
- Rose Junie Therapy
- Silver Lake Psychology
- The Mindful Mind

All with Los Angeles as the city.

## After Running:

The clinics will immediately be searchable on your website at:
- https://www.virgilst.com/medical-providers

Filter by "Mental Health" or search for "EMDR therapy"
