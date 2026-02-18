# Railway Setup (Authoritative)

## Current Architecture

- Runtime DB driver: PostgreSQL (`server/db.ts`)
- Drizzle dialect: PostgreSQL (`drizzle.config.ts`)
- Production auto-seed: snapshot import on startup (`server/_core/init-db.ts`)

Do not use Turso/libSQL instructions for this repository.

## Deploy Steps

1. Create Railway project from this repo.
2. Add a Railway PostgreSQL plugin/service.
3. Confirm app service has `DATABASE_URL` pointing to Railway Postgres.
4. Set required env vars:
   - `NODE_ENV=production`
   - `JWT_SECRET`
   - `OWNER_OPEN_ID`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `BUILT_IN_FORGE_API_KEY`
   - `SERPAPI_KEY`
5. Deploy.

## What Happens During Deploy

1. Build runs `pnpm run build`.
2. Build runs `pnpm run db:push` first (creates/updates tables).
3. Service starts `node dist/index.js`.
4. Startup checks `resources` row count.
5. If empty, imports `data/db-snapshot.json`.

## If Data Still Does Not Appear

1. Verify startup logs include `[init-db]` lines.
2. Run manual import:
   - `pnpm run db:push`
   - `pnpm run db:import:snapshot`
3. Validate counts in Postgres for:
   - `resources`
   - `articles`
   - `medi_cal_providers`
   - `treatment_centers`
   - `meetings`

## Notes

- `scripts/import-db-snapshot.ts` is now PostgreSQL-based.
- `db:setup` uses PostgreSQL schema push + PostgreSQL snapshot import.
