# 🚀 Deployment Checklist for 扶養わかるんです

## Pre-Deployment Setup

### 1. Supabase Database Setup ✅
- [ ] Supabase project created
- [ ] Migration 001: Initial schema executed
- [ ] Migration 002: Moneytree tokens executed  
- [ ] Migration 003: Fixes and 2025 updates executed
- [ ] Migration 004: Auth integration executed
- [ ] Verification script (`scripts/verify-database.sql`) run successfully
- [ ] Test data seeded (development only)

### 2. Environment Configuration ⚙️
- [ ] `.env.local` created with all required variables
- [ ] Supabase URL and anon key configured
- [ ] Moneytree sandbox credentials configured
- [ ] Production environment variables ready for Vercel

### 3. Authentication Setup 🔐
- [ ] Supabase Auth configured
- [ ] Email authentication enabled
- [ ] Site URLs configured (localhost + production)
- [ ] Redirect URLs configured
- [ ] RLS policies verified working

### 4. Moneytree Integration 🏦
- [ ] Moneytree Link sandbox account created
- [ ] OAuth application registered
- [ ] Redirect URIs configured correctly
- [ ] Client credentials obtained

## Development Testing

### 5. Local Testing 🧪
- [ ] `npm run dev` starts without errors
- [ ] Onboarding flow completes successfully
- [ ] Dashboard displays correctly
- [ ] Settings page works
- [ ] Bank connection flow initiates (even if sandbox)
- [ ] TypeScript compilation passes (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)

### 6. Database Testing 📊
- [ ] User profile creation works
- [ ] Transaction insertion works
- [ ] User stats auto-calculation works
- [ ] Triggers fire correctly
- [ ] RLS policies enforce security

## Production Deployment

### 7. GitHub Repository 📚
- [ ] Code pushed to main branch
- [ ] `.env.example` updated with all variables
- [ ] README.md updated
- [ ] All migration files committed

### 8. Vercel Deployment ⚡
- [ ] GitHub repository connected to Vercel
- [ ] Environment variables configured in Vercel dashboard:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `MONEYTREE_CLIENT_ID`
  - [ ] `MONEYTREE_CLIENT_SECRET`  
  - [ ] `MONEYTREE_REDIRECT_URI` (production URL)
- [ ] Build succeeds
- [ ] Deployment preview works

### 9. GitHub Actions CI/CD 🔄
- [ ] GitHub secrets configured:
  - [ ] `VERCEL_TOKEN`
  - [ ] `VERCEL_ORG_ID`
  - [ ] `VERCEL_PROJECT_ID`
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Workflow file (`.github/workflows/deploy.yml`) present
- [ ] CI pipeline runs successfully

### 10. Production Configuration 🌐
- [ ] Supabase Auth settings updated with production URLs
- [ ] Moneytree redirect URI updated with production URL
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate valid

## Post-Deployment Verification

### 11. Production Testing 🚀
- [ ] Production site loads correctly
- [ ] Onboarding flow works end-to-end
- [ ] User registration/login works
- [ ] Dashboard displays properly
- [ ] Settings page functions
- [ ] Bank connection flow works
- [ ] Mobile responsiveness verified
- [ ] Japanese text displays correctly

### 12. Security Verification 🔒
- [ ] RLS policies working in production
- [ ] Users can only see their own data
- [ ] API routes require authentication
- [ ] Environment variables not exposed to client
- [ ] HTTPS enabled

### 13. Performance Testing ⚡
- [ ] Page load times acceptable
- [ ] Database queries optimized
- [ ] Images optimized
- [ ] Core Web Vitals good scores

## Monitoring & Maintenance

### 14. Error Tracking 📊
- [ ] Supabase logs configured
- [ ] Vercel analytics enabled
- [ ] Error handling in place
- [ ] User feedback collection setup

### 15. Backup & Recovery 💾
- [ ] Database backup strategy in place
- [ ] Environment variables documented
- [ ] Deployment rollback plan ready

## Common Issues & Solutions

### Build Errors
```bash
# Type check errors
npm run type-check

# Linting errors  
npm run lint

# Missing dependencies
npm install
```

### Database Connection Issues
- Verify environment variables
- Check Supabase project status
- Confirm RLS policies
- Test with Supabase SQL editor

### Authentication Problems
- Check Supabase Auth settings
- Verify redirect URLs
- Test with different browsers
- Clear cookies/localStorage

### Moneytree Integration Issues
- Verify sandbox credentials
- Check redirect URI configuration
- Test OAuth flow manually
- Check token expiration

## Success Criteria ✅

The deployment is successful when:
- [ ] Users can complete onboarding without errors
- [ ] Dashboard shows accurate income calculations  
- [ ] Bank connection flow works (even in sandbox)
- [ ] Mobile experience is smooth
- [ ] Security policies are enforced
- [ ] Performance is acceptable
- [ ] Error tracking is working

## Rollback Plan 🔄

If issues occur:
1. Revert to previous Git commit
2. Redeploy from known-good branch
3. Check environment variables
4. Verify database integrity
5. Contact support if needed

---

**Note**: This checklist should be completed in order. Each section builds on the previous ones.

**Support**: For issues, check:
- Supabase Dashboard logs
- Vercel deployment logs  
- Browser console errors
- GitHub Actions logs