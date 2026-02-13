# Virgil St.

Vite/React + Express/tRPC + Drizzle (MySQL) app with resource library, chat assistant, maps, forum, and legal/treatment flows.

## Local Dev Quickstart

### 1) Prerequisites

- Node.js 20+
- pnpm 10+
- MySQL 8+ (local install or Docker)

### 2) Configure environment

```bash
cp .env.example .env
```

**Core Required Variables:**

- `DATABASE_URL` - MySQL connection string
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

### 3) Start MySQL (Docker option)

```bash
docker compose up -d mysql
```

This repository includes `docker-compose.yml` with:

- host: `127.0.0.1`
- port: `3306`
- database: `virgil_st`
- user: `root`
- password: `root`

### 4) Install and migrate

```bash
pnpm install
pnpm run db:push
```

### 5) Index knowledge base (REQUIRED for AI)

```bash
pnpm run index-knowledge
```

This processes 80+ knowledge files (PDFs, markdown) and creates embeddings for semantic search. The Virgil AI case manager uses this knowledge base to answer questions about benefits, housing, legal issues, etc.

**Note:** This requires `BUILT_IN_FORGE_API_KEY` to be set for embedding generation.

### 6) Validate and run

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
2. Railway uses `railway.json` and starts with:
   - `pnpm run db:setup && pnpm start`
3. `db:setup` does:
   - `pnpm run db:push`
   - `pnpm run db:import:snapshot:safe`
4. `db:import:snapshot:safe` behavior:
   - Checks `SELECT COUNT(*) FROM resources`
   - If count > 0: logs `Database already populated` and exits
   - If count = 0: imports `data/db-snapshot.json` and logs `Snapshot imported successfully`
   - Logs resource row count before and after import
5. Set required backend environment variables:
   - `NODE_ENV=production`
   - `PORT` (Railway provides this automatically)
   - `DATABASE_URL=file:/data/virgil_st.db`
   - `JWT_SECRET`
   - `OWNER_OPEN_ID`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `BUILT_IN_FORGE_API_KEY`
   - `SERPAPI_KEY`
6. Configure persistent storage:
   - Add a Railway volume
   - Mount path: `/data`
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
git commit -m "Add SQLite snapshot export/import for Railway data transfer"
git push
```

3. In Railway, ensure:
- You mounted a persistent volume (example mount path: `/data`)
- `DATABASE_URL=file:/data/virgil_st.db`

4. In Railway service shell (or Run Command), run:
```bash
pnpm run db:setup
```

5. Verify import count quickly:
```bash
node --input-type=module -e "import { createClient } from '@libsql/client'; const c=createClient({url:process.env.DATABASE_URL}); const r=await c.execute('SELECT COUNT(*) c FROM resources'); console.log('resources=', r.rows[0].c); await c.close();"
```

## Virgil AI Features

The AI case manager (Virgil) uses **GPT-4o** and has three tools:

1. **search_knowledge** - Searches the indexed knowledge base (80+ documents)
2. **scrape_url** - Fetches content from web URLs
3. **search_google** - Searches Google via SerpAPI for current information

All three tools are automatically invoked when relevant to user questions. The AI provides citations and sources for all information.
