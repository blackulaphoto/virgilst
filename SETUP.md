# Virgil St. - Complete Setup Guide

## Prerequisites

- Node.js 20+ ([Download](https://nodejs.org/))
- pnpm 10+ (install via `npm install -g pnpm`)
- MySQL 8+ (local or Docker)

## Step-by-Step Setup

### 1. Clone and Install

```bash
cd virgil-st_new_mvp
pnpm install
```

### 2. Set Up MySQL Database

**Option A: Using Docker (Recommended)**

```bash
docker compose up -d mysql
```

This creates a MySQL instance with:
- Host: `127.0.0.1:3306`
- Database: `virgil_st`
- User: `root`
- Password: `root`

**Option B: Local MySQL**

Create a database manually:

```sql
CREATE DATABASE virgil_st;
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and fill in the required values:

#### Core Database & Auth

```env
DATABASE_URL=mysql://root:root@localhost:3306/virgil_st
JWT_SECRET=<generate-random-32-char-string>
OAUTH_SERVER_URL=https://your-oauth-server.com
OWNER_OPEN_ID=<your-admin-openid>
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Client Config

```env
VITE_APP_ID=virgil-st-local
VITE_OAUTH_PORTAL_URL=https://your-oauth-portal.com
```

#### AI Configuration (REQUIRED)

**Get OpenAI API Key:**
1. Visit https://platform.openai.com/api-keys
2. Create an API key (requires OpenAI account with billing)
3. Add to `.env`:

```env
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=<your-openai-api-key>
```

**Note:** Leave `BUILT_IN_FORGE_API_URL` empty to use OpenAI directly.

**Get SerpAPI Key:**
1. Visit https://serpapi.com/
2. Sign up for free tier (100 searches/month)
3. Add to `.env`:

```env
SERPAPI_KEY=<your-serpapi-key>
```

### 4. Run Database Migrations

```bash
pnpm run db:push
```

This creates all necessary tables in the database.

### 5. Index Knowledge Base

```bash
pnpm run index-knowledge
```

**What this does:**
- Scans 80+ knowledge files in `knowledge_files/` directory
- Extracts text from PDFs and markdown files
- Chunks content into ~500 word segments
- Generates embeddings using GPT-4o
- Stores in database for semantic search

**Expected output:**
```
🚀 Starting Knowledge Base Indexing
📂 Scanning directory: .../knowledge_files
📚 Found 85 knowledge files
...
📊 Indexing Summary:
   ✅ Files processed: 80
   📦 Total chunks created: 450+
✨ Indexing complete!
```

**Note:** This step requires `BUILT_IN_FORGE_API_KEY` to be set.

### 6. Verify Setup

```bash
# Type-check
pnpm run check

# Run tests
pnpm test

# Start dev server
pnpm run dev
```

Open http://localhost:3000

## Testing Virgil AI

Once running, test the AI case manager:

1. Navigate to `/chat`
2. Ask questions like:
   - "How do I apply for CalFresh benefits?"
   - "What are my rights as a tenant in Los Angeles?"
   - "Where can I find emergency shelter tonight?"
   - "How do I get a replacement ID?"

The AI will:
- Search the knowledge base automatically
- Provide citations from indexed documents
- Use Google search for current information
- Return accurate, sourced responses

## Production Deployment

### Build for Production

```bash
pnpm run build
```

This creates:
- Client bundle in `dist/client`
- Server bundle in `dist/index.js`

### Run Production Server

```bash
NODE_ENV=production pnpm start
```

### Production Environment Variables

Ensure these are set in production:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=<production-mysql-url>
JWT_SECRET=<strong-random-secret>
OAUTH_SERVER_URL=<production-oauth>
OWNER_OPEN_ID=<admin-user-id>
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=<your-openai-api-key>
SERPAPI_KEY=<your-serpapi-key>
```

## Troubleshooting

### Knowledge Indexing Fails

**Problem:** "Failed to extract PDF" or "pdftotext not found"

**Solution (Linux/Mac):**
```bash
# Ubuntu/Debian
sudo apt-get install poppler-utils

# macOS
brew install poppler
```

**Solution (Windows):**
PDF extraction uses the pdf-parse library directly (no CLI tool needed).

### AI Responses Don't Work

**Check:**
1. `BUILT_IN_FORGE_API_KEY` is set to your OpenAI API key
2. OpenAI account has sufficient credits/billing enabled
3. `BUILT_IN_FORGE_API_URL` is empty (to use OpenAI directly)
4. Check server logs for errors: look for "LLM invoke failed"

### Google Search Doesn't Work

**Check:**
1. `SERPAPI_KEY` is set correctly
2. You haven't exceeded free tier limits (100/month)
3. Check logs for "SerpAPI key not configured"

### Database Connection Issues

**Check:**
1. MySQL is running: `docker ps` or `systemctl status mysql`
2. `DATABASE_URL` is correct
3. Database exists: `mysql -u root -p -e "SHOW DATABASES;"`

## Architecture Overview

### Tech Stack

- **Frontend:** React 19 + Vite + TailwindCSS + shadcn/ui
- **Backend:** Express + tRPC + Drizzle ORM
- **Database:** MySQL 8
- **AI:** GPT-4o via Forge API
- **Search:** SerpAPI for Google search

### Key Features

1. **Virgil AI Case Manager** - GPT-4o powered assistant with RAG
2. **Treatment Directory** - 500+ treatment centers with wizard
3. **Resource Library** - 80+ articles with semantic search
4. **Interactive Map** - Community-contributed pins with comments
5. **Forum** - Anonymous support with threading
6. **Legal Case Management** - Court dates and document tracking
7. **User Profiles** - Avatars, bios, activity tracking

### Data Flow

```
User Question → Virgil AI → Tool Selection
                   ↓
         ┌─────────┴─────────┐
         ↓                   ↓
   search_knowledge    search_google
         ↓                   ↓
   Vector Search      SerpAPI
         ↓                   ↓
     Citations          Web Results
         ↓                   ↓
         └─────────┬─────────┘
                   ↓
            GPT-4o Synthesis
                   ↓
           Formatted Response
```

## Support

For issues or questions:
- Check logs: Server logs show detailed error messages
- Review this guide for common issues
- Check environment variables are set correctly
- Verify API keys have sufficient credits

## Next Steps

After setup is complete:

1. **Seed Sample Data** - Add treatment centers, articles, resources
2. **Configure OAuth** - Set up authentication provider
3. **Customize Branding** - Update colors, fonts, logos
4. **Add More Knowledge** - Upload additional PDFs/markdown to `knowledge_files/`
5. **Monitor Usage** - Track API usage for Forge and SerpAPI

Enjoy using Virgil St.! 🎉
