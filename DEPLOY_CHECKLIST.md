# Railway Deployment Checklist

## 🚨 CRITICAL: Database Must Be Persistent

Railway's filesystem is ephemeral. You MUST use Turso (cloud SQLite) or the database will be wiped on every deploy.

## Quick Start: Deploy to Railway with Turso

### Step 1: Create Turso Database (5 minutes)

```bash
# Install Turso CLI (Windows)
curl -sSfL https://get.tur.so/install.sh | bash

# Or use npm
npm install -g @turso/cli

# Login/signup
turso auth signup

# Create production database
turso db create virgil-st-prod

# Get database URL
turso db show virgil-st-prod --url
# Output: libsql://virgil-st-prod-[your-org].turso.io

# Create auth token
turso db tokens create virgil-st-prod
# Output: eyJhbGc... (copy this)
```

### Step 2: Configure Railway Environment Variables

In Railway dashboard → your service → Variables, add:

```env
NODE_ENV=production
DATABASE_URL=libsql://[your-db].turso.io?authToken=[your-token]
GOOGLE_CLIENT_ID=[your-google-client-id]
GOOGLE_CLIENT_SECRET=[your-google-client-secret]
JWT_SECRET=[generate-a-random-string]
BUILT_IN_FORGE_API_KEY=[your-openai-api-key]
SERPAPI_KEY=[your-serpapi-key]
```

**To generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 3: Deploy

1. Push your code to GitHub
2. In Railway dashboard: New → GitHub Repo → Select your repo
3. Railway will automatically detect the `railway.json` config
4. Deploy will run:
   - Build command: `pnpm install && pnpm run db:push && pnpm run build`
   - Start command: `node dist/index.js`
5. On first start, server will automatically import snapshot data

### Step 4: Verify Deployment

Check Railway logs for:
```
[init-db] Database is empty, importing snapshot...
[init-db] ✓ articles: X rows
[init-db] ✓ resources: X rows
[init-db] ✓ mapPins: X rows
[init-db] ✅ Snapshot imported successfully! (X resources)
Server running on port 3000
```

Visit your Railway app URL and verify content appears!

## Troubleshooting

### ❌ "No content showing on Railway"

**Check logs for:**
```
[init-db] Database already populated with X resources
```

If you see this but no content shows:
1. Database was imported but you're using SQLite file storage (ephemeral)
2. **Solution:** Switch to Turso (see Step 1 above)

### ❌ "Database not available"

**Problem:** `DATABASE_URL` not set correctly

**Solution:**
1. Verify `DATABASE_URL` is set in Railway variables
2. Check format: `libsql://[db-name].turso.io?authToken=[token]`
3. Verify Turso token hasn't expired (create new one if needed)

### ❌ "resources table does not exist"

**Problem:** `db:push` didn't run during build

**Solution:**
1. Check Railway build logs for `pnpm run db:push` output
2. Verify `railway.json` has correct build command
3. Redeploy

### ❌ "Build failed"

**Common causes:**
1. Missing environment variables (especially `DATABASE_URL`)
2. Turso database doesn't exist
3. Network issues connecting to Turso

**Solution:**
1. Check Railway build logs for specific error
2. Verify all environment variables are set
3. Test Turso connection locally:
   ```bash
   DATABASE_URL="libsql://..." node -e "console.log('Testing...')"
   ```

## Environment Variables Reference

### Required for Basic Operation
- `NODE_ENV=production`
- `DATABASE_URL` - Turso connection string
- `JWT_SECRET` - Random string for session tokens
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret

### Required for AI Features
- `BUILT_IN_FORGE_API_KEY` - OpenAI API key
- `SERPAPI_KEY` - SerpAPI key for search

### Optional
- `PORT` - Defaults to 3000 (Railway sets this automatically)
- `CORS_ALLOWED_ORIGINS` - Comma-separated allowed origins
- `FRONTEND_ORIGIN` - Frontend URL if separate

## Manual Database Operations

### Force reimport snapshot (DESTRUCTIVE)

⚠️ This will delete all data and reimport from snapshot!

```bash
railway login
railway link
railway run bash
pnpm run db:import:snapshot
```

### Check database status

```bash
railway run node -e "
const { createClient } = require('@libsql/client');
const client = createClient({ url: process.env.DATABASE_URL });
client.execute('SELECT COUNT(*) as c FROM resources').then(r => console.log('Resources:', r.rows[0].c));
"
```

## Success Criteria

✅ Railway build completes successfully
✅ Railway logs show: `[init-db] ✅ Snapshot imported successfully!`
✅ Railway logs show: `Server running on port 3000`
✅ App URL loads and shows content
✅ Articles page shows articles
✅ Resources page shows resources
✅ Map shows pins
✅ Medi-Cal directory shows providers

## Need Help?

1. Check Railway logs first
2. Verify all environment variables are set
3. Test Turso connection locally
4. Check `data/db-snapshot.json` exists in repo
5. Verify `railway.json` config is correct

## What Changed?

Files modified to support automatic initialization:
- ✅ `server/_core/init-db.ts` - Auto-import logic
- ✅ `server/_core/index.ts` - Calls init on production start
- ✅ `railway.json` - Updated build/deploy commands
- ✅ `RAILWAY_SETUP.md` - Full documentation
- ✅ `DEPLOY_CHECKLIST.md` - This file!
