# 🔧 Environment Variables Setup Guide

## Quick Start

1. **Copy template**: `cp .env.example .env.local`
2. **Fill in your values** in `.env.local` (see sections below)
3. **Test locally**: `npm run dev`
4. **Setup Vercel** (see Vercel CLI section)

## Required Environment Variables

### 📊 Supabase (Authentication & Database)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

**Where to get these:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project → Settings → API
3. Copy "Project URL" and "anon/public" key

### 🤖 OpenAI (AI Chat Classification)
```bash
OPENAI_API_KEY=sk-proj-YOUR-API-KEY
```

**Where to get this:**
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Copy the key (starts with `sk-proj-`)

## Vercel CLI Environment Setup

### Installation
```bash
npm i -g vercel
vercel login
```

### Environment Variable Management

#### 1. Backup existing vars (if any)
```bash
vercel env pull .env.vercel.backup
```

#### 2. Add new environment variables
```bash
# Supabase URL
vercel env add NEXT_PUBLIC_SUPABASE_URL
# When prompted, enter: https://YOUR-PROJECT-REF.supabase.co
# Select: All environments (Production, Preview, Development)

# Supabase Anon Key  
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# When prompted, paste your anon key
# Select: All environments

# OpenAI API Key
vercel env add OPENAI_API_KEY
# When prompted, paste your OpenAI key
# Select: All environments

# App Version
vercel env add NEXT_PUBLIC_APP_VERSION
# When prompted, enter: 1.1.0-openai
# Select: All environments
```

#### 3. Verify settings
```bash
vercel env ls
```

#### 4. Pull to local for testing
```bash
vercel env pull .env.vercel
# Compare with your .env.local to ensure they match
```

#### 5. Deploy and test
```bash
# Create preview deployment
git push origin feature/your-branch

# OR deploy directly
vercel --prod
```

## Environment Validation

The app automatically validates environment variables:

### ✅ Build-time validation
- Missing required vars will **fail the build**
- Invalid formats (URL/JWT) will **fail the build** 
- See `lib/assertEnv.ts` for validation logic

### 🔍 Runtime validation
```bash
npm run dev
# Check console for validation status:
# ✅ NEXT_PUBLIC_SUPABASE_URL
# ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
# ✅ OPENAI_API_KEY
```

## Troubleshooting

### Problem: "Multiple GoTrueClient instances"
**Solution:** Environment variables are properly set but browser cache has old clients
```bash
# Clear browser data
# 1. DevTools → Application → Storage → Clear site data
# 2. Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)
```

### Problem: "Auth session missing" in production
**Solution:** Check Vercel environment variables
```bash
vercel env ls
# Ensure all vars are set for Production environment
# If missing, add them:
vercel env add NEXT_PUBLIC_SUPABASE_URL production
```

### Problem: "401 Unauthorized" on Supabase calls
**Solution:** Check if environment variable format is correct
```bash
# URL should match this pattern:
https://[a-z0-9]{20}.supabase.co

# Anon key should start with:
eyJhbGciOiJIUzI1NiIs...
```

### Problem: Build fails with env var errors
**Solution:** Ensure all required vars are set in Vercel
```bash
# Check build logs in Vercel dashboard
# Look for: "❌ Missing required environment variables"
# Add missing vars and redeploy
```

## Security Notes

### ✅ Safe to commit:
- `.env.example` (template with placeholder values)
- `ENVIRONMENT_SETUP.md` (this file)

### ❌ NEVER commit:
- `.env.local` (your actual values)
- `.env` (your actual values)
- `.env.vercel` (pulled from Vercel)

### 🔒 Verification checklist:
- [ ] `.env.local` is in `.gitignore`
- [ ] No real API keys in any committed files
- [ ] Vercel environment variables match your local `.env.local`
- [ ] All environments (Preview, Production) have the same values

## Next Steps

Once environment variables are set up:

1. **Local development**: `npm run dev`
2. **Deploy Preview**: Push to branch → auto-deploys to Preview URL
3. **Deploy Production**: Merge to main → auto-deploys to Production
4. **Monitor**: Check Vercel dashboard for deployment success

---

**Need help?** Check the [Troubleshooting](#troubleshooting) section or open an issue.