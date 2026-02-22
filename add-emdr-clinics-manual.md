# Adding EMDR Therapy Clinics to Virgil St

## Easiest Method: Run via Railway CLI

```bash
# From your local project directory
railway run --service virgilst pnpm add-emdr-clinics
```

This will add all 7 EMDR therapy clinics to your production database.

## Alternative: Via Railway Shell

1. Go to Railway dashboard: https://railway.app
2. Select your project → virgilst service
3. Click "Shell" or "Terminal" button
4. Run:
```bash
pnpm add-emdr-clinics
```

## What Gets Added

7 EMDR therapy clinics specializing in trauma-focused therapy:

### Central / Downtown Los Angeles
1. **Fig Tree Therapy Center** - 714 W Olympic Blvd Ste 743, (310) 712-3411
2. **Downtown Mind Wellness** - 617 S Olive St #200, (213) 430-9080
3. **Downtown Los Angeles Therapy** - 520 S Grand Ave #680, (626) 406-2385
4. **The Mindful Mind** - 533 Colyton St, (213) 298-0019
5. **Dimitrios Pexaras Therapy** - 427 W 5th St, (805) 386-6161

### Eastside / Silver Lake / Echo Park
6. **Silver Lake Psychology** - 4325 Sunset Blvd Unit 206, (310) 879-8004
7. **Rose Junie Therapy** - 1555 Sunset Blvd STE C, (310) 498-5890

All clinics are:
- Categorized under "Mental Health"
- Include EMDR therapy, trauma therapy, and psychotherapy specialties
- Fully searchable on /medical-providers page
- Verified providers (isVerified = 1)

## After Adding

The clinics will immediately appear on your site at:
- https://www.virgilst.com/medical-providers (filter by "Mental Health")
- Searchable by: "EMDR", "trauma therapy", "psychotherapy", city name, provider name

## Verify They Were Added

Run this in Railway shell:
```bash
railway run --service virgilst node -e "
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
sql\`SELECT COUNT(*) FROM medi_cal_providers WHERE phone IN (
  '(310) 712-3411', '(213) 430-9080', '(626) 406-2385',
  '(213) 298-0019', '(805) 386-6161', '(310) 879-8004', '(310) 498-5890'
)\`.then(r => { console.log('EMDR clinics:', r[0].count); sql.end(); });
"
```

Should show: `EMDR clinics: 7`
