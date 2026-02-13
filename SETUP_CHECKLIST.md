# Setup Checklist - Virgil St.

## ✅ Pre-Setup (You Need)

- [ ] OpenAI API key from https://platform.openai.com/api-keys
- [ ] SerpAPI key from https://serpapi.com/ (free tier available)
- [ ] OAuth server URL and credentials
- [ ] MySQL running (Docker or local)

## 📝 Step-by-Step Setup

### 1. Environment Configuration

Edit `.env` file and replace these values:

```bash
# Generate a JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output and replace JWT_SECRET value

# Add your API keys
BUILT_IN_FORGE_API_KEY=sk-proj-your-actual-openai-key
SERPAPI_KEY=your-actual-serpapi-key

# Add your OAuth info
OAUTH_SERVER_URL=https://your-actual-oauth-server.com
OWNER_OPEN_ID=your-actual-admin-openid
VITE_OAUTH_PORTAL_URL=https://your-actual-oauth-portal.com
```

**Checklist:**
- [ ] `.env` file exists
- [ ] `JWT_SECRET` generated and set
- [ ] `BUILT_IN_FORGE_API_KEY` set with OpenAI key
- [ ] `SERPAPI_KEY` set
- [ ] `OAUTH_SERVER_URL` set
- [ ] `OWNER_OPEN_ID` set
- [ ] `VITE_OAUTH_PORTAL_URL` set
- [ ] `BUILT_IN_FORGE_API_URL` is empty

### 2. Database Setup

**Option A: Docker (Recommended)**
```bash
docker compose up -d mysql
```

**Option B: Local MySQL**
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE virgil_st;"
```

**Checklist:**
- [ ] MySQL running
- [ ] Database `virgil_st` exists
- [ ] Can connect: `mysql -h 127.0.0.1 -u root -proot virgil_st`

### 3. Install Dependencies

```bash
pnpm install
```

**Checklist:**
- [ ] `pnpm install` completed successfully
- [ ] `node_modules/` directory exists
- [ ] No error messages

### 4. Run Migrations

```bash
pnpm run db:push
```

**Checklist:**
- [ ] Migrations completed
- [ ] No database errors
- [ ] Tables created (check with: `mysql -u root -proot virgil_st -e "SHOW TABLES;"`)

### 5. Index Knowledge Base

```bash
pnpm run index-knowledge
```

**Expected output:**
```
🚀 Starting Knowledge Base Indexing
📂 Scanning directory: .../knowledge_files
📚 Found 85 knowledge files
...
✨ Indexing complete!
```

**Checklist:**
- [ ] Indexing started
- [ ] Found 80+ files
- [ ] Processed files successfully
- [ ] Created embeddings
- [ ] No API errors

**Common Issues:**
- "OPENAI_API_KEY is not configured" → Check `BUILT_IN_FORGE_API_KEY` in `.env`
- "Failed to extract PDF" → Install poppler-utils (Linux/Mac only)
- API rate limit errors → Wait a few minutes and retry

### 6. Verify Setup

```bash
# Type check
pnpm run check

# Run tests
pnpm test

# Start dev server
pnpm run dev
```

**Checklist:**
- [ ] `pnpm run check` passes (no TypeScript errors)
- [ ] `pnpm test` shows 60+ passing tests
- [ ] `pnpm run dev` starts without errors
- [ ] Server running at http://localhost:3000

### 7. Test Virgil AI

1. **Open browser:** http://localhost:3000
2. **Navigate to:** `/chat`
3. **Ask test question:** "How do I apply for CalFresh?"
4. **Verify:**
   - [ ] AI responds
   - [ ] Response includes citations
   - [ ] Sources section shows knowledge base docs
   - [ ] No errors in console

**Try these test questions:**
- "What are my rights as a tenant in Los Angeles?"
- "Where can I find emergency shelter tonight?"
- "How do I get a replacement ID in California?"

## 🎯 Success Criteria

Your setup is complete when:

- ✅ Dev server runs without errors
- ✅ TypeScript check passes
- ✅ Tests pass (60+ passing)
- ✅ Knowledge base indexed (450+ chunks)
- ✅ Virgil AI responds to questions
- ✅ AI provides citations from knowledge base
- ✅ Google search works (via SerpAPI)

## 🚨 Common Issues & Solutions

### Issue: "Database not available"
**Solution:**
```bash
# Check MySQL is running
docker ps
# or
systemctl status mysql

# Verify connection
mysql -h 127.0.0.1 -u root -proot virgil_st -e "SELECT 1"
```

### Issue: "LLM invoke failed: 401"
**Solution:**
- Check `BUILT_IN_FORGE_API_KEY` is correct
- Verify key starts with `sk-proj-` or `sk-`
- Ensure OpenAI billing is enabled
- Test key directly:
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Issue: "SerpAPI key not configured"
**Solution:**
- Add `SERPAPI_KEY` to `.env`
- Get free key at https://serpapi.com/
- AI will work without it but can't search Google

### Issue: Knowledge indexing fails
**Solution:**
- Check OpenAI API key is valid
- Ensure you have API credits
- For PDF errors on Linux/Mac:
```bash
# Ubuntu/Debian
sudo apt-get install poppler-utils

# macOS
brew install poppler
```

### Issue: Port 3000 already in use
**Solution:**
```bash
# Change PORT in .env
PORT=3001

# Or kill existing process
lsof -ti:3000 | xargs kill
```

## 📊 Cost Estimation

### OpenAI API (GPT-4o)
- Indexing (one-time): ~$2-5 (for 80+ documents)
- Daily usage (100 chats): ~$0.30-1.00/day
- Monthly estimate: ~$10-30/month

### SerpAPI
- Free tier: 100 searches/month (sufficient for testing)
- Paid tier: $50/month for 5,000 searches

### Total Development Cost
- First month: ~$15-40 (includes indexing)
- Ongoing: ~$10-30/month

## 🎉 Next Steps After Setup

1. **Explore Features:**
   - Treatment directory with wizard
   - Resource library with 80+ articles
   - Interactive community map
   - Forum with anonymous posting
   - Legal case management

2. **Customize:**
   - Add more knowledge files to `knowledge_files/`
   - Update branding/colors
   - Add treatment centers to directory
   - Configure OAuth provider

3. **Deploy:**
   - See `SETUP.md` for production deployment
   - Set up production database
   - Configure production API keys
   - Set up domain and SSL

## 💡 Tips

- **API Usage:** Monitor OpenAI usage at https://platform.openai.com/usage
- **Rate Limits:** OpenAI has rate limits on free tier - upgrade if needed
- **Knowledge Updates:** Re-run `pnpm run index-knowledge` after adding new files
- **Backups:** Regularly backup MySQL database
- **Logs:** Check server logs for errors: `pnpm run dev` output

## 📚 Documentation

- **README.md** - Quick start guide
- **SETUP.md** - Detailed setup instructions
- **ENV_SETUP.md** - Environment variables reference
- **TODO.md** - Feature completion status

---

Need help? Check the troubleshooting section above or review the detailed guides!
