# 🚂 Railway Deployment - Quick Start

## TL;DR - Get Content Showing in 5 Minutes

Your Railway app has no content because it needs a **persistent database**. Here's the fix:

### 1. Install Turso CLI
```bash
npm install -g @turso/cli
```

### 2. Create Database
```bash
turso auth signup
turso db create virgil-st-prod
turso db show virgil-st-prod --url
turso db tokens create virgil-st-prod
```

### 3. Set Railway Environment Variable
In Railway dashboard → Variables:
```
DATABASE_URL=libsql://[from-step-2].turso.io?authToken=[from-step-2]
```

### 4. Redeploy
Railway will automatically:
- ✅ Create database tables (`db:push`)
- ✅ Build the app
- ✅ Import all content on first start (automatic!)

### 5. Verify
Check Railway logs for:
```
[init-db] ✅ Snapshot imported successfully! (265 resources)
Server running on port 3000
```

Visit your app - **content will be there!** 🎉

---

## What Content Will Appear?

After successful deploy, your app will have:

| Content Type | Count | Page |
|-------------|-------|------|
| Articles | 17 | `/articles` |
| Resources | 265 | `/resources` |
| Medi-Cal Providers | 3,326 | `/medi-cal` |
| Treatment Centers | 370 | `/treatment` |
| Recovery Meetings | 252 | `/meetings` |
| Map Pins | 15 | `/map` |
| Events | 1 | `/events` |
| Videos | 30 | `/videos` |

**Total: 4,350+ records!**

---

## Why Turso?

- ✅ **Persistent** - Data survives redeploys
- ✅ **Fast** - Edge database, low latency
- ✅ **Free tier** - Perfect for production
- ✅ **SQLite** - No code changes needed
- ✅ **Easy** - 2 commands to set up

---

## Troubleshooting

### ❌ "Still no content after deploy"

**Check Railway logs:**

```bash
# If you see this:
[init-db] DATABASE_URL not set, skipping initialization

# Fix:
Set DATABASE_URL in Railway variables
```

```bash
# If you see this:
[init-db] Database already populated with X resources

# But still no content on site:
You're using SQLite file storage (ephemeral)
Switch to Turso (see steps above)
```

### ❌ "Build failed"

Check that `DATABASE_URL` is set **before** build starts. Railway needs it during the build process.

### ❌ "Turso connection error"

Verify the token format:
```
libsql://[db-name].turso.io?authToken=[token]
```

Create a new token if expired:
```bash
turso db tokens create virgil-st-prod
```

---

## Environment Variables Checklist

Required for Railway:

```env
✅ NODE_ENV=production
✅ DATABASE_URL=libsql://...
✅ GOOGLE_CLIENT_ID=...
✅ GOOGLE_CLIENT_SECRET=...
✅ JWT_SECRET=...

# For AI features:
✅ BUILT_IN_FORGE_API_KEY=sk-...
✅ SERPAPI_KEY=...
```

Generate JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## How Auto-Import Works

The app has intelligent automatic initialization:

1. **Build step:** Creates database tables
2. **First start:** Detects empty database
3. **Auto-import:** Loads `data/db-snapshot.json`
4. **Done:** All content available immediately
5. **Subsequent starts:** Skips import (data already there)

No manual intervention needed! 🎯

---

## Need More Help?

📚 **Full Documentation:**
- `SOLUTION_SUMMARY.md` - Complete technical explanation
- `RAILWAY_SETUP.md` - Detailed setup guide
- `DEPLOY_CHECKLIST.md` - Troubleshooting reference

🐛 **Still stuck?**
1. Check Railway logs first
2. Verify all environment variables are set
3. Make sure `DATABASE_URL` uses Turso (not file://)
4. Confirm `data/db-snapshot.json` exists in repo

---

## Success Indicators

✅ Railway build logs show: `Running db:push`
✅ Railway start logs show: `[init-db] ✅ Snapshot imported successfully!`
✅ Homepage loads without errors
✅ `/articles` shows 17 articles
✅ `/resources` shows 265 resources
✅ `/medi-cal` shows 3,326 providers

**All green? You're live! 🚀**
