# 🚑 Google OAuth 404 Fix Guide

## 🔍 Investigation Summary

### Root Causes (Most Likely → Least Likely)

1. **Missing/Incorrect .env.local** (90% probability)
   - NEW PC doesn't have `.env.local` file
   - Or has wrong Supabase project credentials

2. **Browser Cookie Settings** (70% probability)
   - Chrome "Block third-party cookies" enabled
   - Supabase auth cookies blocked

3. **Supabase Redirect URLs** (30% probability)
   - Missing `http://localhost:3000/**` in allowed URLs
   - Site URL not configured properly

4. **Different Supabase Project** (20% probability)
   - OLD PC uses different project than configured

## 🛠 Quick Fix Steps

### Step 1: Run Diagnostic Script
```bash
chmod +x scripts/diagnose-oauth-404.sh
./scripts/diagnose-oauth-404.sh
```

### Step 2: Fix Based on Results

#### If `.env.local` is missing:
```bash
# Option A: Copy from OLD PC
# On OLD PC: cat .env.local
# Copy the content to NEW PC

# Option B: Create new one
cp .env.example .env.local
# Edit .env.local with your Supabase credentials:
# - NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
# - NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
```

#### If browser is blocking cookies:
```
Chrome Settings:
1. Go to: chrome://settings/cookies
2. Select: "Allow all cookies"
3. OR Add Site Exception:
   - Click "Add" under "Sites that can always use cookies"
   - Add: [*.]supabase.co
   - Check: "Including third-party cookies on this site"
```

### Step 3: Clear Browser Data
```
1. Open Chrome DevTools (F12)
2. Application tab → Storage → Clear site data
3. Or visit: chrome://settings/siteData
4. Search and delete:
   - localhost
   - supabase.co
```

### Step 4: Verify Configuration
```bash
# Run test script
node scripts/test-oauth-flow.js

# Start dev server
npm run dev

# Test login flow
# 1. Open: http://localhost:3000/login
# 2. Click "Googleでログイン"
# 3. Complete Google auth
# 4. Should redirect to /dashboard
```

## ✅ Validation Checklist

### Environment Check
- [ ] `.env.local` exists on NEW PC
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set correctly
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set correctly
- [ ] Values match OLD PC configuration

### Browser Check
- [ ] Third-party cookies allowed (or exception for supabase.co)
- [ ] No ad blockers active
- [ ] Cookies cleared for fresh start
- [ ] Same browser version as OLD PC (or newer)

### Supabase Dashboard Check
- [ ] Project matches the one in `.env.local`
- [ ] Google OAuth is enabled
- [ ] Site URL includes `http://localhost:3000`
- [ ] Redirect URLs include `http://localhost:3000/**`

### Application Check
- [ ] `/auth/callback` route exists
- [ ] No TypeScript errors on `npm run dev`
- [ ] Console shows no CORS errors
- [ ] Network tab shows proper redirects

## 📊 Test Results Comparison

| Check | OLD PC | NEW PC | Action |
|-------|--------|--------|--------|
| .env.local exists | ✅ | ❓ | Copy from OLD PC |
| Cookies allowed | ✅ | ❓ | Enable in settings |
| Dev server runs | ✅ | ❓ | npm install && npm run dev |
| Login → Dashboard | ✅ | ❌ | Apply fixes above |

## 🔧 Alternative Solutions

### If still getting 404:

1. **Check redirect URL in network tab:**
   - Open DevTools → Network tab
   - Try login and watch redirects
   - Look for the exact URL causing 404

2. **Test with curl:**
   ```bash
   # Test if callback route exists
   curl -I http://localhost:3000/auth/callback
   ```

3. **Enable Supabase debug logging:**
   ```javascript
   // In lib/supabase.ts, add:
   const supabase = createClient(url, key, {
     auth: {
       debug: true // Temporary for debugging
     }
   })
   ```

## 📋 Residual Issues TODO

If fixes don't work:

1. **[HIGH]** Check if middleware.ts is blocking auth routes
2. **[MED]** Verify Google Cloud Console OAuth settings
3. **[MED]** Test with different browser (Firefox/Safari)
4. **[LOW]** Check for Windows Defender/firewall blocks
5. **[LOW]** Verify system time is synced

## 🎯 Expected Outcome

After applying fixes:
1. Login page loads → ✅
2. Click Google login → Google OAuth screen → ✅
3. Authorize → Redirects to Supabase → ✅
4. Supabase → Redirects to /auth/callback → ✅
5. /auth/callback → Redirects to /dashboard → ✅

---

**Quick Test Command:**
```bash
# One-liner to test everything
./scripts/diagnose-oauth-404.sh && node scripts/test-oauth-flow.js
```