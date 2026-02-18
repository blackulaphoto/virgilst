# Railway Deploy Checklist (PostgreSQL)

Use this checklist for every production deployment.

## 1. Source and Runtime

- [ ] Railway service source repo is `blackulaphoto/virgilst`
- [ ] Railway service branch is `master`
- [ ] Latest deployment commit matches latest GitHub commit
- [ ] Build logs show Node 22 (`nodejs_22`)

## 2. Environment Variables

- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` is Railway PostgreSQL URL (not Turso/libsql URL)
- [ ] `JWT_SECRET` is set
- [ ] `GOOGLE_CLIENT_ID` is set
- [ ] `GOOGLE_CLIENT_SECRET` is set
- [ ] `OWNER_OPEN_ID` is set
- [ ] `BUILT_IN_FORGE_API_KEY` is set (if AI features enabled)
- [ ] `SERPAPI_KEY` is set (if AI features enabled)

## 3. Build and Health

- [ ] Build completes successfully
- [ ] Deploy healthcheck `/healthz` passes
- [ ] Runtime logs show `Server running on port ...`

## 4. Snapshot Initialization

Expected first-time logs:

- [ ] `[init-db] Starting initialization check...`
- [ ] `[init-db] Database is empty, importing snapshot...`
- [ ] `[init-db] Snapshot imported successfully (...)`
- [ ] `[init-db] Import summary: ...`

If DB already has data, expected:

- [ ] `[init-db] Database already populated with ... resources`

## 5. Smoke Check (Run Command)

```bash
node --input-type=module -e "import postgres from 'postgres'; const sql=postgres(process.env.DATABASE_URL); const r=await sql`SELECT (SELECT COUNT(*) FROM resources) resources,(SELECT COUNT(*) FROM articles) articles,(SELECT COUNT(*) FROM medi_cal_providers) medi_cal_providers,(SELECT COUNT(*) FROM treatment_centers) treatment_centers,(SELECT COUNT(*) FROM meetings) meetings`; console.log(r[0]); await sql.end();"
```

## 6. Troubleshooting Quick Map

- `CONNECT_TIMEOUT ... turso.io:5432`: `DATABASE_URL` points to wrong provider.
- `out of range for type integer`: snapshot contains millisecond timestamps; use latest importer code.
- FK violation during import: import order issue; use latest importer code.
- `replicas never became healthy`: startup blocked or runtime crash; check Deploy Logs after container start.
