# 🚀 Production Deployment Verification Checklist

## 📋 Pre-Deployment Checklist

### 1. Get Supabase API Keys
- [ ] Go to: https://supabase.com/dashboard/project/zbsjqsqytjjlbpchpacl/settings/api
- [ ] Copy `anon` / `public` key (starts with `eyJ`)
- [ ] Copy `service_role` key (starts with `eyJ`)

### 2. Update Environment Files
```bash
# Make script executable
chmod +x scripts/update-supabase-keys.sh

# Update all env files with real keys
./scripts/update-supabase-keys.sh "YOUR_ANON_KEY" "YOUR_SERVICE_ROLE_KEY"
```

### 3. Verify Local Files
- [ ] Check `.env` - should have real keys (not placeholders)
- [ ] Check `.env.production` - should have real keys
- [ ] Keys should start with `eyJ` (JWT format)

## 🚀 Deployment Steps

### 1. Deploy to Vercel
```bash
# Make script executable
chmod +x scripts/vercel-deploy-with-env.sh

# Deploy with environment variables
./scripts/vercel-deploy-with-env.sh
```

### 2. Alternative Manual Deployment
If script fails, set manually:
```bash
# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Enter: https://zbsjqsqytjjlbpchpacl.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production  
# Enter: YOUR_ANON_KEY

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Enter: YOUR_SERVICE_ROLE_KEY

vercel env add GOOGLE_CLIENT_ID production
# Enter: 476126378892-ppgshp1ar4l8lcypgu8mofteh3m207r.apps.googleusercontent.com

vercel env add GOOGLE_CLIENT_SECRET production  
# Enter: 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

vercel env add NEXT_PUBLIC_DEMO_MODE production
# Enter: false

# Deploy
vercel --prod
```

## 🧪 Testing Checklist

### 1. Smoke Test
- [ ] Open: https://huyou-wakarundesu.vercel.app/login
- [ ] Page loads without errors
- [ ] "Google でログイン" button appears

### 2. OAuth Flow Test  
- [ ] Click "Google でログイン" 
- [ ] Redirects to Google OAuth
- [ ] Select Google account
- [ ] Redirects to `/auth/callback`
- [ ] Shows "認証処理中..." or success message
- [ ] Redirects to `/dashboard`

### 3. DevTools Verification
- [ ] Open DevTools (F12)
- [ ] **Console Tab**: No red errors
- [ ] **Network Tab**: No 401/403 errors
- [ ] **Application Tab** > Storage > Cookies: `sb-zbsjqsqytjjlbpchpacl-auth-token` exists

### 4. Dashboard Functionality
- [ ] Dashboard loads with user data
- [ ] No "Setup Required" messages  
- [ ] Charts/widgets display properly
- [ ] Navigation works

## 🐛 Troubleshooting

### Common Issues & Solutions

#### 401 Unauthorized
- **Cause**: Wrong Supabase keys
- **Fix**: Double-check keys from Supabase dashboard

#### "createSupabaseClient() can only be called on the client side"  
- **Cause**: SSR issue (should be fixed)
- **Fix**: Verify `app/auth/callback/page.tsx` has client-side creation

#### OAuth Redirect Mismatch
- **Cause**: Wrong redirect URI in Google Console
- **Fix**: Ensure these are set in Google Cloud Console:
  - `https://zbsjqsqytjjlbpchpacl.supabase.co/auth/v1/callback`
  - `https://huyou-wakarundesu.vercel.app/auth/callback`

#### "Configuration Required" Mode
- **Cause**: Environment variables not loaded
- **Fix**: Wait 2-3 minutes after deployment, then hard refresh

## ✅ Success Criteria

### All of these should work:
1. ✅ Login page loads
2. ✅ Google OAuth redirects properly  
3. ✅ Authentication callback processes
4. ✅ User redirects to dashboard
5. ✅ Dashboard shows user data (not demo mode)
6. ✅ No console errors
7. ✅ User can navigate the app

## 📞 Need Help?

If any step fails:
1. Check Vercel deployment logs
2. Check browser DevTools console
3. Verify Supabase project settings
4. Confirm Google Cloud Console redirect URIs

**Expected Result**: 100% working OAuth login flow in production! 🎉