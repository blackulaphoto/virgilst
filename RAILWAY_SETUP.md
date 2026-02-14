# Railway Deployment Setup Guide

## Problem: No Content Appearing on Railway

Your Railway deployment shows no articles, resources, or any content because:
1. **SQLite file storage is ephemeral** - Railway's filesystem is wiped on every redeploy
2. **Database seeding hasn't run** - The snapshot data hasn't been imported
3. **You need a persistent database solution**

## ✅ SOLUTION IMPLEMENTED

The app now automatically initializes the database on first production start! Here's what was added:

1. **Automatic database initialization** - The server detects an empty database and imports snapshot data automatically
2. **Updated Railway build process** - Schema is pushed during build, data is imported on first start
3. **Persistent database support** - Use Turso for cloud SQLite storage

**What happens now:**
- Build step: `pnpm run db:push` creates all tables
- First start: Server detects empty database and imports `data/db-snapshot.json`
- Subsequent starts: Server skips import (database already has data)

## Solution 1: Use Turso (libSQL Cloud) - RECOMMENDED

Turso provides a cloud SQLite database that persists across deployments.

### Step 1: Create a Turso Database

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Create account (first time only)
turso auth signup

# Create database
turso db create virgil-st-prod

# Get the database URL
turso db show virgil-st-prod --url

# Create auth token
turso db tokens create virgil-st-prod
```

### Step 2: Configure Railway Environment Variables

In your Railway project settings, add:

```env
DATABASE_URL=libsql://your-database-name.turso.io?authToken=your-auth-token
```

Replace with the actual URL and token from Step 1.

### Step 3: Deploy with Database Setup

In Railway, set the build command to:
```bash
pnpm install && pnpm run build && pnpm run db:setup
```

This will:
1. Install dependencies
2. Build the app
3. Push schema to Turso
4. Import the data snapshot

## Solution 2: Use Railway PostgreSQL - Alternative

If you prefer PostgreSQL over SQLite:

### Step 1: Add PostgreSQL to Railway

1. In Railway dashboard, click "New" → "Database" → "PostgreSQL"
2. Railway will automatically set `DATABASE_URL` environment variable

### Step 2: Migrate to PostgreSQL

This requires code changes to use PostgreSQL instead of SQLite. **NOT RECOMMENDED** unless you want to refactor the entire database layer.

## Solution 3: Railway Volume (Not Recommended)

Railway volumes are slow and can cause issues. Use Turso instead.

## Quick Fix: Manual Database Setup

If you just deployed and need content NOW:

### Option A: SSH into Railway and run setup

```bash
# In Railway dashboard, go to your service → Settings → Enable "Railway CLI"
railway login
railway link
railway run pnpm run db:setup
```

### Option B: Trigger setup on first app start

The app will automatically detect an empty database and import the snapshot on first run.

## Verifying It Works

After deploying with Turso:

1. Check Railway logs for: `[import] Snapshot imported successfully`
2. Visit your app and check if articles/resources appear
3. Look for resource count in logs: `[import] resources after import: [number]`

## Troubleshooting

### "Database not available" errors
- Check that `DATABASE_URL` is set correctly in Railway
- Verify Turso token hasn't expired (create a new one if needed)

### "resources table does not exist"
- The `db:push` command didn't run
- Make sure build command includes `pnpm run db:setup`

### Content still not showing
- Check Railway logs for import errors
- Verify `data/db-snapshot.json` exists in your repo
- Run `pnpm run db:export:snapshot` locally to create fresh snapshot

## Environment Variables Needed for Railway

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=libsql://your-db.turso.io?authToken=your-token
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_SECRET=your-jwt-secret
BUILT_IN_FORGE_API_KEY=your-openai-key
SERPAPI_KEY=your-serpapi-key
```

## Next Steps

1. ✅ Create Turso database
2. ✅ Update Railway `DATABASE_URL` to Turso URL
3. ✅ Update Railway build command to: `pnpm install && pnpm run build && pnpm run db:setup`
4. ✅ Redeploy on Railway
5. ✅ Check logs for successful import
6. ✅ Visit app and verify content appears
