# Preview Deployment Fix Analysis

## 🔴 Issue Identified
Preview deployments return 404 - likely due to missing environment variables causing build failures.

## 🔍 Root Cause Analysis

### Environment Variables Required
**REQUIRED for build success:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`

**Optional but may cause issues if missing:**
- `SUPABASE_SERVICE_ROLE_KEY`
- `MONEYTREE_CLIENT_ID`
- `MONEYTREE_CLIENT_SECRET`
- `MONEYTREE_REDIRECT_URI`

### Current Status
- ✅ Production deployment: Working (has environment variables)
- ❌ Preview deployments: 404 (missing environment variables)

## 🛠 Required Fixes

### 1. Add Preview Environment Variables in Vercel
**Manual steps required:**

```bash
# Option A: Vercel CLI (requires authentication)
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
vercel env add OPENAI_API_KEY preview
vercel env add SUPABASE_SERVICE_ROLE_KEY preview
vercel env add MONEYTREE_CLIENT_ID preview
vercel env add MONEYTREE_CLIENT_SECRET preview
vercel env add MONEYTREE_REDIRECT_URI preview
```

**Option B: Vercel Dashboard**
1. Go to https://vercel.com/dashboard
2. Select project: `huyou-wakarundesu`
3. Settings → Environment Variables
4. Add each variable with Target: **Preview**

### 2. Update Supabase Allowed Origins
Add preview URL patterns to Supabase:
```
https://huyou-wakarundesu-*.vercel.app/**
https://huyou-wakarundesu-git-*.vercel.app/**
```

### 3. Test URLs After Fix
Expected preview URLs:
- https://huyou-wakarundesu-git-fix-preview401-junp1ayer.vercel.app/
- https://huyou-wakarundesu-51ae96b.vercel.app/

## ✅ Next Steps
1. Complete manual environment variable setup
2. Trigger new deployment with commit
3. Verify preview deployment works
4. Test authentication flow on preview