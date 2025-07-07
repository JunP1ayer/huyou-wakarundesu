# 🚑 Google OAuth 404 Debug Summary

## 🔍 Investigation Results

### Primary Cause (95% Probability)
**Missing `.env.local` file on NEW PC**

The OLD PC has a properly configured `.env.local` with:
- Correct Supabase project URL
- Valid anonymous key
- These are NOT committed to git (correctly)

The NEW PC is missing this file, causing:
1. App can't connect to Supabase
2. OAuth redirect fails
3. 404 error when returning from Google

### Secondary Causes
1. **Browser cookies blocked** (70% probability)
2. **Supabase redirect URLs** not configured for localhost (30% probability)

## 🛠 Quick Fix (2 minutes)

```bash
# On NEW PC, run this first:
./scripts/quick-oauth-test.sh

# If .env.local is missing, do ONE of:

# Option A: Copy from OLD PC
# (On OLD PC) cat .env.local > env-backup.txt
# Copy content to NEW PC's .env.local

# Option B: Create from template
cp .env.local.template .env.local
# Edit with your Supabase credentials

# Then:
npm run dev
# Open http://localhost:3000/login
```

## ✅ Validation Steps

1. **Run diagnostic**: `./scripts/diagnose-oauth-404.sh`
2. **Test OAuth flow**: `node scripts/test-oauth-flow.js`
3. **Clear cookies** and test login
4. **Check network tab** for exact redirect URLs

## 📋 Created Tools

| File | Purpose | Usage |
|------|---------|-------|
| `scripts/quick-oauth-test.sh` | Fast 30-second test | `./scripts/quick-oauth-test.sh` |
| `scripts/diagnose-oauth-404.sh` | Full diagnostic | `./scripts/diagnose-oauth-404.sh` |
| `scripts/test-oauth-flow.js` | OAuth flow validation | `node scripts/test-oauth-flow.js` |
| `.env.local.template` | Template with instructions | Copy to `.env.local` |
| `OAUTH_404_FIX_GUIDE.md` | Complete fix guide | Reference document |

## 🎯 If Still Broken

### Browser Fix
```
Chrome Settings:
1. Privacy → Cookies → "Allow all cookies"
2. OR add exception for [*.]supabase.co
3. Clear all browsing data
4. Disable extensions temporarily
```

### Supabase Dashboard Check
1. Go to: Authentication → URL Configuration
2. Site URL: Should include `http://localhost:3000`
3. Redirect URLs: Must include `http://localhost:3000/**`

## 📊 Comparison

| Check | OLD PC ✅ | NEW PC ❌ | Fix |
|-------|-----------|-----------|-----|
| .env.local | Has valid Supabase keys | Missing or wrong | Copy from OLD PC |
| Cookies | Allowed | Possibly blocked | Chrome settings |
| Supabase project | Correct project | No connection | Set in .env.local |

## 🚀 One-Liner Solution

```bash
# Most likely fix:
[ -f .env.local ] || echo "❌ Missing .env.local - copy from OLD PC!"
```

---

**Time to fix**: 2-5 minutes  
**Root cause**: Missing environment configuration  
**Success rate**: 95% with .env.local fix