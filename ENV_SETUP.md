# Environment Variables Quick Reference

## Required for Basic Functionality

### Database
```env
DATABASE_URL=mysql://root:root@localhost:3306/virgil_st
```

### Authentication
```env
JWT_SECRET=<generate-32-char-random-string>
OAUTH_SERVER_URL=https://your-oauth-server.com
OWNER_OPEN_ID=<your-admin-openid>
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Client Config
```env
VITE_APP_ID=virgil-st-local
VITE_OAUTH_PORTAL_URL=https://your-oauth-portal.com
```

## Required for Virgil AI

### OpenAI API (GPT-4o)
```env
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=sk-proj-xxxxxxxxxxxxx
```

**Where to get:**
- Go to https://platform.openai.com/api-keys
- Create new secret key
- Copy and paste into `BUILT_IN_FORGE_API_KEY`
- Leave `BUILT_IN_FORGE_API_URL` empty to use OpenAI directly

**Cost:** GPT-4o costs ~$5 per 1M input tokens, $15 per 1M output tokens

### SerpAPI (Google Search)
```env
SERPAPI_KEY=your-serpapi-key-here
```

**Where to get:**
- Go to https://serpapi.com/
- Sign up for free account (100 searches/month free)
- Copy API key from dashboard

## Optional Variables

### Maps Proxy (Client)
```env
VITE_FRONTEND_FORGE_API_KEY=
VITE_FRONTEND_FORGE_API_URL=https://forge.butterfly-effect.dev
```

### Analytics
```env
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
```

## Complete .env Template

```env
# Core server config
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=mysql://root:root@localhost:3306/virgil_st

# Authentication
JWT_SECRET=<generate-random-32-char-string>
OAUTH_SERVER_URL=https://your-oauth-server.com
OWNER_OPEN_ID=<your-admin-openid>

# Client config
VITE_APP_ID=virgil-st-local
VITE_OAUTH_PORTAL_URL=https://your-oauth-portal.com

# OpenAI API for Virgil AI
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=sk-proj-xxxxxxxxxxxxx

# Google Search for Virgil AI
SERPAPI_KEY=your-serpapi-key-here

# Optional: Maps proxy
VITE_FRONTEND_FORGE_API_KEY=
VITE_FRONTEND_FORGE_API_URL=https://forge.butterfly-effect.dev

# Optional: Analytics
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
```

## What Happens Without API Keys?

### Without OpenAI API Key (`BUILT_IN_FORGE_API_KEY`)
❌ Virgil AI chat will not work
❌ Knowledge base indexing will fail
❌ Embeddings generation will fail

### Without SerpAPI Key (`SERPAPI_KEY`)
⚠️ Virgil AI will still work but cannot search Google
⚠️ AI will only use knowledge base and URL scraping
✅ Basic functionality remains intact

## Testing Your Setup

### 1. Check environment variables are loaded
```bash
# In your .env file, make sure all required variables are set
cat .env | grep -E "DATABASE_URL|BUILT_IN_FORGE_API_KEY|SERPAPI_KEY"
```

### 2. Test database connection
```bash
mysql -h 127.0.0.1 -u root -proot virgil_st -e "SELECT 1"
```

### 3. Test OpenAI API key
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 4. Test SerpAPI key
```bash
curl "https://serpapi.com/search?q=test&api_key=YOUR_SERPAPI_KEY"
```

## Common Issues

### "OPENAI_API_KEY is not configured"
- Make sure `BUILT_IN_FORGE_API_KEY` is set in your `.env` file
- The variable name is misleading - it expects an OpenAI key

### "Database not available"
- Check MySQL is running: `docker ps` or `systemctl status mysql`
- Verify `DATABASE_URL` is correct
- Run migrations: `pnpm run db:push`

### "LLM invoke failed: 401"
- Your OpenAI API key is invalid or expired
- Check you copied the full key (starts with `sk-proj-` or `sk-`)
- Verify billing is enabled on your OpenAI account

### "SerpAPI key not configured"
- SerpAPI is optional but recommended
- Get free key at https://serpapi.com/ (100 searches/month)
- AI will work without it but can't search Google

## Production Checklist

- [ ] `DATABASE_URL` points to production MySQL
- [ ] `JWT_SECRET` is a strong random string (not default)
- [ ] `OAUTH_SERVER_URL` points to production OAuth
- [ ] `BUILT_IN_FORGE_API_KEY` is your production OpenAI key
- [ ] `SERPAPI_KEY` has sufficient quota
- [ ] `NODE_ENV=production`
- [ ] All secrets are stored securely (env vars, not in code)
- [ ] `.env` file is in `.gitignore`

## Cost Estimation (Monthly)

### OpenAI API (GPT-4o)
- Light usage (100 chats/day): ~$10-30/month
- Medium usage (500 chats/day): ~$50-150/month
- Heavy usage (2000 chats/day): ~$200-600/month

### SerpAPI
- Free tier: 100 searches/month (usually sufficient)
- Paid tier: $50/month for 5,000 searches

### Hosting
- Database (MySQL): $15-50/month (managed service)
- Server: $5-20/month (VPS/cloud)
- Total: ~$30-100/month for small-medium usage
