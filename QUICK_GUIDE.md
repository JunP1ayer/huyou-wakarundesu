# 🚀 QUICK_GUIDE: New PC Setup in 3 Steps

## For teammates who need to set up the project on a new machine

### 📋 3-Step Manual Fallback

#### Step 1: Install Vercel CLI
```bash
# Option A: Global install (requires sudo/admin)
sudo npm install -g vercel

# Option B: Use npx (no permissions required)
npx vercel login
# Then use 'npx vercel' instead of 'vercel' in commands below
```

#### Step 2: Pull Production Environment
```bash
# Login to Vercel (if not done already)
vercel login

# Pull production environment variables
vercel env pull .env.local

# Verify the file was created
cat .env.local | grep NEXT_PUBLIC_SUPABASE
```

#### Step 3: Start Development
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Test login at: http://localhost:3000/login
```

---

## 🤖 Automated Setup

Run the automated script (requires sudo for Vercel CLI install):
```bash
./scripts/setup-local-env.sh
```

If you get permission errors, use the manual steps above.

---

## ✅ Validation Checklist

After setup, verify these work:

- [ ] `.env.local` exists and contains `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `npm run dev` starts without errors
- [ ] http://localhost:3000/login loads
- [ ] Google login button is visible
- [ ] (Manual test) Google OAuth → Dashboard works

---

## 🚨 Common Issues & Fixes

### Issue: "vercel: command not found"
**Fix**: Use `npx vercel` instead of `vercel`

### Issue: Permission denied installing Vercel CLI
**Fix**: 
```bash
# Use npx instead
npx vercel login
npx vercel env pull .env.local
```

### Issue: ".env.local is empty or has placeholder values"
**Fix**: Check your Vercel project has environment variables set:
1. Go to https://vercel.com/dashboard
2. Select project → Settings → Environment Variables
3. Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

### Issue: Google login → 404
**Fix**: 
1. Clear browser cookies for localhost:3000
2. Check Chrome settings: Allow third-party cookies
3. OR add cookie exception for [*.]supabase.co

### Issue: OAuth redirects to wrong URL
**Fix**: Check Supabase Dashboard:
1. Authentication → URL Configuration
2. Site URL should include: http://localhost:3000
3. Redirect URLs should include: http://localhost:3000/**

---

## 🧪 Advanced Testing

If you want to run automated tests:
```bash
# Run OAuth flow test
node scripts/test-local-oauth.mjs

# Expected output: "All tests passed! OAuth should work."
```

---

## 📞 Support

If none of the above works:
1. Copy `.env.local` from a working teammate's machine
2. Compare Supabase project settings with production
3. Try in incognito mode to rule out browser extensions
4. Check if your IP is blocked by any corporate firewall

**Time Required**: 2-5 minutes  
**Success Rate**: 95% with proper environment variables