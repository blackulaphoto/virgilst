# Railway Deployment Solution Summary

## Problem Identified

Railway deployment showed no content (articles, resources, providers, etc.) because:

1. **Ephemeral filesystem** - SQLite file database was being wiped on every deploy
2. **No automatic seeding** - Snapshot data wasn't being imported
3. **Wrong build process** - Database setup wasn't running during deployment

## Solution Implemented ✅

### 1. Automatic Database Initialization

Created `server/_core/init-db.ts` that:
- Runs automatically on production server start
- Detects if database is empty (checks resource count)
- Imports snapshot from `data/db-snapshot.json`
- Skips import if database already has data
- Logs detailed progress for debugging

**Result:** Database is automatically populated on first deploy!

### 2. Updated Railway Configuration

Modified `railway.json` to:
- Run `pnpm run db:push` during build (creates tables)
- Start server with `node dist/index.js`
- Remove redundant `db:setup` from start command

**Result:** Proper build process with schema creation before start!

### 3. Server Startup Integration

Modified `server/_core/index.ts` to:
- Call `initializeDatabaseIfEmpty()` on production startup
- Only runs in production (not development)
- Happens before server starts listening

**Result:** First production start automatically seeds the database!

## What's in the Snapshot?

Your `data/db-snapshot.json` contains:
- ✅ **17 articles** (DPSS, Housing, LGBTQ+, SSI/SSDI guides)
- ✅ **265 resources** (shelters, food banks, clinics)
- ✅ **15 map pins** (community-submitted locations)
- ✅ **3,326 Medi-Cal providers** (doctors, clinics)
- ✅ **370 treatment centers** (sober living, detox)
- ✅ **252 meetings** (AA, NA, CMA, SMART)
- ✅ **1 event** (resource fair)
- ✅ **30 videos** (educational content)
- ✅ **89 knowledge documents** (65 chunks for AI)

**Total: 4,350+ records ready to deploy!**

## Next Steps for Deployment

### Option A: Use Turso (Recommended) ⭐

Turso provides persistent cloud SQLite storage:

```bash
# 1. Install Turso CLI
npm install -g @turso/cli

# 2. Create account and database
turso auth signup
turso db create virgil-st-prod

# 3. Get credentials
turso db show virgil-st-prod --url
turso db tokens create virgil-st-prod

# 4. Set in Railway
DATABASE_URL=libsql://[your-db].turso.io?authToken=[token]
```

Then deploy to Railway - it will automatically:
1. Run `db:push` to create tables
2. Build the app
3. Start the server
4. Import snapshot data on first start

### Option B: Manual Deploy (If Already on Railway)

If you're already deployed and just need to fix the database:

```bash
# 1. Set DATABASE_URL to Turso in Railway
# 2. Redeploy (Railway will run db:push)
# 3. Check logs for:
[init-db] Database is empty, importing snapshot...
[init-db] ✅ Snapshot imported successfully!
```

## Verification Checklist

After deploying, verify:

1. ✅ Railway build logs show: `Running db:push`
2. ✅ Railway deploy logs show: `[init-db] ✅ Snapshot imported successfully!`
3. ✅ Visit app homepage - should load
4. ✅ Visit `/articles` - should show 17 articles
5. ✅ Visit `/resources` - should show 265 resources
6. ✅ Visit `/map` - should show 15 pins
7. ✅ Visit `/medi-cal` - should show 3,326 providers
8. ✅ Visit `/treatment` - should show 370 centers
9. ✅ Visit `/meetings` - should show 252 meetings

## Files Modified

| File | Purpose |
|------|---------|
| `server/_core/init-db.ts` | ✨ NEW - Auto-import logic |
| `server/_core/index.ts` | Modified - Calls init on startup |
| `railway.json` | Modified - Proper build process |
| `RAILWAY_SETUP.md` | ✨ NEW - Full deployment guide |
| `DEPLOY_CHECKLIST.md` | ✨ NEW - Quick reference |
| `SOLUTION_SUMMARY.md` | ✨ NEW - This file |

## How It Works

### Build Phase (Railway)
```
1. pnpm install          → Install dependencies
2. pnpm run db:push      → Create database tables in Turso
3. pnpm run build        → Build Vite frontend + esbuild backend
```

### First Start
```
1. Server starts
2. Checks: Is NODE_ENV=production?
3. Checks: Is database empty?
4. If yes → Import data/db-snapshot.json
5. Start Express server
```

### Subsequent Starts
```
1. Server starts
2. Checks: Is database empty?
3. No → Skip import
4. Start Express server immediately
```

## Troubleshooting

### "Still no content after deploy"

**Check Railway logs for:**
```bash
# Good ✅
[init-db] Database is empty, importing snapshot...
[init-db] ✓ articles: 17 rows
[init-db] ✓ resources: 265 rows
[init-db] ✅ Snapshot imported successfully! (265 resources)

# Bad ❌
[init-db] DATABASE_URL not set, skipping initialization
# → Solution: Set DATABASE_URL in Railway

[init-db] Database schema not initialized yet
# → Solution: Verify db:push ran in build logs

[init-db] Database already populated with X resources
# → This is good! Data is already there
```

### "Build fails"

Check Railway build logs for specific error. Common issues:
- Missing `DATABASE_URL` environment variable
- Turso database doesn't exist
- Network issue connecting to Turso

### "Data imported but disappears after redeploy"

This means you're using SQLite file storage (ephemeral). **Switch to Turso!**

## Environment Variables Needed

```env
# Required
NODE_ENV=production
DATABASE_URL=libsql://[db].turso.io?authToken=[token]
JWT_SECRET=[random-64-char-string]
GOOGLE_CLIENT_ID=[google-oauth-client-id]
GOOGLE_CLIENT_SECRET=[google-oauth-secret]

# Required for AI features
BUILT_IN_FORGE_API_KEY=[openai-api-key]
SERPAPI_KEY=[serpapi-key]
```

## Success! 🎉

Once deployed correctly, your Railway app will have:
- All 17 articles visible
- All 265 resources searchable
- All 3,326 Medi-Cal providers in directory
- All 370 treatment centers in wizard
- All 252 meetings in directory
- Map with 15 community pins
- Fully functional AI chat with knowledge base

The database will persist across deployments and you'll never need to manually import data again!

## Questions?

- See `RAILWAY_SETUP.md` for detailed Turso setup
- See `DEPLOY_CHECKLIST.md` for quick troubleshooting
- Check Railway logs for specific errors
- Verify `data/db-snapshot.json` exists in your repo
