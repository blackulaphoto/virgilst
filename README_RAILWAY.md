# Railway Deployment (PostgreSQL)

This repository is configured for PostgreSQL in production.

## Required Railway Setup

1. Add a PostgreSQL service in Railway.
2. Use the injected `DATABASE_URL` from Railway Postgres.
3. Set app variables:
   - `NODE_ENV=production`
   - `JWT_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `OWNER_OPEN_ID`
   - `BUILT_IN_FORGE_API_KEY`
   - `SERPAPI_KEY`

## Build and Start

- Build uses `package.json`:
  - `pnpm run build` runs `pnpm run db:push` first, then builds server/client.
- Start uses:
  - `node dist/index.js`

On first production start, the app auto-imports `data/db-snapshot.json` if `resources` is empty.

## Log Lines to Confirm Success

Look for:

- `[init-db] Database is empty, importing snapshot...`
- `[init-db] Imported resources: ... rows`
- `[init-db] Snapshot imported successfully (...)`
- `Server running on port ...`

## Manual Import (if needed)

Run in Railway shell:

```bash
pnpm run db:push
pnpm run db:import:snapshot
```

## Quick Validation Query

```sql
SELECT
  (SELECT COUNT(*) FROM resources) AS resources,
  (SELECT COUNT(*) FROM articles) AS articles,
  (SELECT COUNT(*) FROM medi_cal_providers) AS medi_cal_providers,
  (SELECT COUNT(*) FROM treatment_centers) AS treatment_centers,
  (SELECT COUNT(*) FROM meetings) AS meetings;
```
