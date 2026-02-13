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

## Virgil AI Features

The AI case manager (Virgil) uses **GPT-4o** and has three tools:

1. **search_knowledge** - Searches the indexed knowledge base (80+ documents)
2. **scrape_url** - Fetches content from web URLs
3. **search_google** - Searches Google via SerpAPI for current information

All three tools are automatically invoked when relevant to user questions. The AI provides citations and sources for all information.
