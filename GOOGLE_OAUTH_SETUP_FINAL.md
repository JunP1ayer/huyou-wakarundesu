# 🚀 Google OAuth Setup - Final Configuration Guide

## 📋 Current Configuration Status

✅ **Environment Variables Configured**
- Local Development: `.env.local` updated
- Production: `.env.production` updated
- Google OAuth credentials integrated
- Supabase project configured

## 🔑 Google OAuth Credentials (Already Generated)

```
Client ID: 476126378892-ppgshp1ar4l8lcypgu8mofteh3m207r.apps.googleusercontent.com
Client Secret: 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
```

## 🎯 Required Configuration Steps

### 1. Google Cloud Console Setup

**OAuth 2.0 Client Configuration:**

**Authorized JavaScript Origins:**
```
https://fuyou-wakarundesu.vercel.app
http://localhost:3000
```

**Authorized Redirect URIs (CRITICAL):**
```
https://eflscrkkhwubtbmhsxez.supabase.co/auth/v1/callback
https://fuyou-wakarundesu.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

### 2. Supabase Dashboard Configuration

**Project Details:**
- Project Name: huyou-wakarundesu  
- Project URL: `https://eflscrkkhwubtbmhsxez.supabase.co`
- Project Ref ID: `eflscrkkhwubtbmhsxez`

**Authentication Settings:**
1. Navigate to: `Authentication → Settings → External OAuth Providers`
2. Find "Google" provider
3. Configure:
   ```
   Enable Google provider: ✅ ON
   
   Client ID (for OAuth):
   476126378892-ppgshp1ar4l8lcypgu8mofteh3m207r.apps.googleusercontent.com
   
   Client Secret (for OAuth):
   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
   
   Skip nonce check: false
   Skip email verification: false
   ```
4. Click **Save** or **Update**

### 3. OAuth Consent Screen Setup

**Application Type:** External
**Publishing Status:** Published (for production)

**Required Scopes:**
- `openid`
- `email` 
- `profile`

**Test Users (if not published):**
- Add your test email addresses

## 🚀 Deployment Steps

### Step 1: Verify Local Configuration
```bash
npm run dev
# Visit: http://localhost:3000/login
# Test Google OAuth button
```

### Step 2: Deploy to Vercel
```bash
git add .
git commit -m "feat: configure Google OAuth for production"
git push origin main
```

### Step 3: Configure Vercel Environment Variables

In Vercel Dashboard, add these environment variables:

```
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_SUPABASE_URL=https://eflscrkkhwubtbmhsxez.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmbHNjcmtraHd1YnRibWhzeGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1NzA2MTAsImV4cCI6MjA1NDE0NjYxMH0.p4JfG4e7B6zJbZ2M8BoKOZe-Iqm7xLxSJQcS2Ps0Dc4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmbHNjcmtraHd1YnRibWhzeGV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODU3MDYxMCwiZXhwIjoyMDU0MTQ2NjEwfQ.kQ3N9H7r5sE8WzA6mBpnKZs-Gg2rTvD4hFcJ1Xs9Ym0
GOOGLE_CLIENT_ID=476126378892-ppgshp1ar4l8lcypgu8mofteh3m207r.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

## 🔍 Testing & Validation

### End-to-End Test Flow
1. Visit: `https://fuyou-wakarundesu.vercel.app/login`
2. Click "Googleでログイン"
3. Complete Google OAuth consent
4. Verify redirect to dashboard
5. Check user authentication state

### Diagnostic Tools
- OAuth Diagnostics: `/admin/oauth-diagnostics`
- Auth Validation API: `/api/auth/validate`

## 🚨 Common Issues & Solutions

### Error: "provider is not enabled"
**Solution:** Enable Google provider in Supabase Dashboard and save settings

### Error: "redirect_uri_mismatch"  
**Solution:** Verify exact match of redirect URIs in Google Cloud Console:
```
https://eflscrkkhwubtbmhsxez.supabase.co/auth/v1/callback
```

### Error: "unauthorized_client"
**Solution:** Double-check Client ID and Secret in Supabase settings

### Authentication Flow Issues
**Solution:** Clear browser cache and test in incognito mode

## ✅ Success Criteria

- [x] Environment variables configured
- [ ] Google Cloud Console OAuth client configured
- [ ] Supabase Google provider enabled  
- [ ] OAuth consent screen published
- [ ] Vercel deployment successful
- [ ] End-to-end Google login working
- [ ] User session persistence working
- [ ] Dashboard access after login

## 📊 Next Steps After Setup

1. Test with multiple user accounts
2. Verify email verification flow
3. Test logout functionality
4. Monitor authentication analytics
5. Set up error tracking for auth failures

---

**Once all checkboxes above are completed, the Google OAuth integration will be fully functional! 🎉**