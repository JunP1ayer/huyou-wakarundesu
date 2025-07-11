# Supabase Redirect URL Configuration Verification

## 🎯 Purpose
This document provides step-by-step instructions to verify that Supabase redirect URLs are correctly configured for the `huyou-wakarundesu` project authentication flow.

## 🔗 Required Redirect URLs

### Development
```
http://localhost:3000/auth/callback
```

### Production
```
https://huyou-wakarundesu.vercel.app/auth/callback
```

### Preview Deployments (Vercel)
```
https://huyou-wakarundesu-*.vercel.app/auth/callback
```

**Note**: Replace `*` with any branch name. Common examples:
- `https://huyou-wakarundesu-feature-onboarding-v2.vercel.app/auth/callback`
- `https://huyou-wakarundesu-main.vercel.app/auth/callback`
- `https://huyou-wakarundesu-dev.vercel.app/auth/callback`

## 📋 Verification Steps

### 1. Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Login to your account
3. Select the `huyou-wakarundesu` project

### 2. Navigate to Authentication Settings
1. Click **Authentication** in the left sidebar
2. Click **URL Configuration** tab
3. Look for the **Redirect URLs** section

### 3. Verify Current URLs
Check that the following URLs are listed in the **Site URL** and **Redirect URLs** fields:

#### Site URL (should be one of):
```
http://localhost:3000
https://huyou-wakarundesu.vercel.app
```

#### Redirect URLs (should include ALL of these):
```
http://localhost:3000/auth/callback
https://huyou-wakarundesu.vercel.app/auth/callback
https://huyou-wakarundesu-*.vercel.app/auth/callback
```

### 4. Add Missing URLs
If any URLs are missing:
1. Click **Add URL** button
2. Paste the missing URL
3. Click **Save**
4. Wait for configuration to propagate (usually immediate)

## 🚨 Common Issues

### Issue 1: Wildcard URLs Not Working
**Problem**: Preview deployments fail with redirect_uri_mismatch
**Solution**: Add specific preview URLs manually:
```
https://huyou-wakarundesu-feature-onboarding-v2.vercel.app/auth/callback
```

### Issue 2: Case Sensitivity
**Problem**: URLs with different cases cause mismatches
**Solution**: Ensure exact case matches between Supabase config and Vercel deployment URLs

### Issue 3: Missing HTTPS
**Problem**: Production URLs failing with insecure redirect
**Solution**: Ensure all production URLs use `https://`

## 🔍 Testing Verification

### Manual Test
1. Deploy to Vercel Preview
2. Get the preview URL from Vercel dashboard
3. Navigate to preview URL + `/login`
4. Click "Login with Google"
5. Complete OAuth flow
6. Should redirect to preview URL + `/auth/callback` successfully

### Automated Verification
```bash
npm run verify-auth
```

This script will check environment variables and provide guidance on URL configuration.

## 📊 Current Configuration Status

### Environment Variables ✅
- `NEXT_PUBLIC_SUPABASE_URL`: ✅ Configured
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: ✅ Configured
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: ✅ Configured
- `GOOGLE_CLIENT_SECRET`: ✅ Configured

### URLs to Verify ⚠️
- [ ] `http://localhost:3000/auth/callback`
- [ ] `https://huyou-wakarundesu.vercel.app/auth/callback`
- [ ] `https://huyou-wakarundesu-*.vercel.app/auth/callback`

## 🎯 Next Steps
1. ✅ Complete Supabase URL verification
2. ⏳ Test OAuth flow on Preview deployment
3. ⏳ Deploy to production after successful Preview test
4. ⏳ Monitor auth logs for any remaining issues

---

**Last Updated**: 2025-07-11  
**Project**: huyou-wakarundesu  
**Environment**: Production + Preview  