# Virgil St.

Vite/React + Express/tRPC + Drizzle (PostgreSQL) app with resource library, chat assistant, maps, forum, and legal/treatment flows.

## Local Dev Quickstart

### 1) Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL 14+ (local install or Docker)

### 2) Configure environment

```bash
cp .env.example .env
```

**Core Required Variables:**

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for session cookies (generate random string)
- `OAUTH_SERVER_URL` - Your OAuth server URL
- `OWNER_OPEN_ID` - OpenID that becomes admin

**Client Required Variables:**

- `VITE_APP_ID` - App identifier for OAuth
- `VITE_OAUTH_PORTAL_URL` - OAuth portal URL for login redirect

**AI Features (REQUIRED for Virgil AI):**

- `BUILT_IN_FORGE_API_KEY` - Your OpenAI API key (get from https://platform.openai.com/api-keys)
- `BUILT_IN_FORGE_API_URL` - Leave empty to use OpenAI directly (or set custom endpoint)
- `SERPAPI_KEY` - SerpAPI key for Google search (get from https://serpapi.com/)

**Optional Variables:**

- `VITE_FRONTEND_FORGE_API_KEY` - For client-side maps proxy
- `VITE_ANALYTICS_ENDPOINT` - Analytics endpoint
- `VITE_ANALYTICS_WEBSITE_ID` - Analytics site ID

**Note:** Virgil AI requires your OpenAI API key (`BUILT_IN_FORGE_API_KEY`) and SerpAPI key (`SERPAPI_KEY`) to function. The AI uses GPT-4o for responses and Google search for current information.

### 3) Install and migrate

```bash
pnpm install
pnpm run db:push
```

### 4) Index knowledge base (REQUIRED for AI)

```bash
pnpm run index-knowledge
```

This processes 80+ knowledge files (PDFs, markdown) and creates embeddings for semantic search. The Virgil AI case manager uses this knowledge base to answer questions about benefits, housing, legal issues, etc.

**Note:** This requires `BUILT_IN_FORGE_API_KEY` to be set for embedding generation.

### 5) Validate and run

```bash
pnpm run check
pnpm test
pnpm run dev
```

Open `http://localhost:3000`.

## Useful Commands

- `pnpm run dev` - start app in dev mode
- `pnpm run check` - TypeScript type-check
- `pnpm test` - run Vitest
- `pnpm run db:push` - generate + run Drizzle migrations
- `pnpm run index-knowledge` - index knowledge base for AI (run once after setup)
- `pnpm run build` - build for production
- `pnpm start` - run production build

## Railway + Vercel Deployment

### Railway (Backend)

1. Create a Railway project from this repo.
2. Add a Railway PostgreSQL service/plugin.
3. Railway uses `railway.json` and starts with:
   - `node dist/index.js`
4. Build uses `package.json`:
   - `pnpm run build` (which runs `pnpm run db:push` first)
5. On first production start, startup auto-imports `data/db-snapshot.json` if `resources` is empty.
6. Set required backend environment variables:
   - `NODE_ENV=production`
   - `PORT` (Railway provides this automatically)
   - `DATABASE_URL` (from Railway PostgreSQL service)
   - `JWT_SECRET`
   - `OWNER_OPEN_ID`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `BUILT_IN_FORGE_API_KEY`
   - `SERPAPI_KEY`
7. For split hosting with Vercel frontend, also set:
   - `FRONTEND_ORIGIN=https://your-frontend.vercel.app`
   - `CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app`

### Vercel (Frontend)

1. Create a Vercel project from this repo.
2. Vercel uses `vercel.json` and builds static assets from Vite.
3. Set frontend environment variable:
   - `VITE_API_BASE_URL=https://your-backend.up.railway.app`
4. Redeploy after setting env vars.

### Google OAuth Redirect URIs

Add the Railway callback URL in Google Cloud OAuth settings:
- `https://your-backend.up.railway.app/api/auth/google/callback`

If you also run locally, keep:
- `http://localhost:3000/api/auth/google/callback`

### Transfer Existing Local Database To Railway

Use this if Railway deployed successfully but has empty tables.

1. Generate a full snapshot from your local DB:
```bash
pnpm run db:export:snapshot
```
This creates `data/db-snapshot.json`.

2. Commit and push snapshot + scripts:
```bash
git add data/db-snapshot.json scripts/export-db-snapshot.ts scripts/import-db-snapshot.ts package.json README.md
git commit -m "Update snapshot import/export for Railway data transfer"
git push
```

3. In Railway, ensure `DATABASE_URL` points to Railway PostgreSQL.

4. In Railway service shell (or Run Command), run:
```bash
pnpm run db:setup
```

5. Verify import count quickly:
```bash
node --input-type=module -e "import postgres from 'postgres'; const sql=postgres(process.env.DATABASE_URL); const r=await sql`SELECT COUNT(*)::int AS c FROM resources`; console.log('resources=', r[0].c); await sql.end();"
```

### Post-Deploy Smoke Check

Run this after each Railway deployment to verify core content loaded:

```bash
node --input-type=module -e "import postgres from 'postgres'; const sql=postgres(process.env.DATABASE_URL); const r=await sql`SELECT (SELECT COUNT(*) FROM resources) resources,(SELECT COUNT(*) FROM articles) articles,(SELECT COUNT(*) FROM medi_cal_providers) medi_cal_providers,(SELECT COUNT(*) FROM treatment_centers) treatment_centers,(SELECT COUNT(*) FROM meetings) meetings`; console.log(r[0]); await sql.end();"
```

## Virgil AI Features

The AI case manager (Virgil) uses **GPT-4o** and has three tools:

1. **search_knowledge** - Searches the indexed knowledge base (80+ documents)
2. **scrape_url** - Fetches content from web URLs
3. **search_google** - Searches Google via SerpAPI for current information

All three tools are automatically invoked when relevant to user questions. The AI provides citations and sources for all information.
