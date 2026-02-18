# Deployment Solution Summary (PostgreSQL)

This repository now deploys on Railway using PostgreSQL with automatic snapshot import.

## Final Architecture

- Runtime DB driver: `postgres` (`server/db.ts`)
- Drizzle dialect: PostgreSQL (`drizzle.config.ts`)
- Startup import: `server/_core/init-db.ts`
- Manual import: `scripts/import-db-snapshot.ts`
- Build/runtime pin: Node 22 via `nixpacks.toml` and `package.json` engines

## Key Fixes Applied

1. Unified to PostgreSQL for deploy path
- Removed conflicting Turso/libSQL deployment guidance in primary Railway docs.

2. Fixed importer compatibility
- Replaced SQLite-style import behavior with PostgreSQL-safe inserts and transactions.

3. Fixed table dependency import order
- Added deterministic FK-safe table ordering for snapshot imports.

4. Fixed timestamp overflow handling
- Normalized millisecond timestamp values (including `lastSignedIn`) into seconds on import.

5. Fixed startup healthcheck timeout
- Server now starts listening first; snapshot import runs in background.

6. Added verification logging
- Import now logs a summary of key content table counts after completion.

## Expected Runtime Log Flow

- `[init-db] Starting initialization check...`
- `[init-db] Database is empty, importing snapshot...`
- `[init-db] Imported ...`
- `[init-db] Snapshot imported successfully (...)`
- `[init-db] Import summary: { resources, articles, medi_cal_providers, treatment_centers, meetings }`

## Operational Guidance

- Treat `README_RAILWAY.md`, `RAILWAY_SETUP.md`, and `DEPLOY_CHECKLIST.md` as source-of-truth deployment docs.
- Use the smoke-check command in `README.md` after each deploy.
