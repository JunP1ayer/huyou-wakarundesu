# Dynamic Threshold System Deployment Guide v2.1.0

## 🚀 Production Deployment Overview

This guide provides **安全ロールバック手順付き** deployment procedures for the dynamic threshold system with **最少手順 & 自動化スクリプト**.

### 📋 Pre-Deployment Requirements

1. **Git Status:** All changes committed
2. **Tests:** Jest and Playwright tests passing
3. **Database:** Supabase production access
4. **Environment:** Vercel CLI configured
5. **Backup:** Database backup procedure ready

### 🔧 Deployment Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `deploy-dynamic-thresholds.sh` | Complete deployment automation | `./scripts/deploy-dynamic-thresholds.sh --confirm` |
| `verify-deployment.sh` | Post-deployment verification | `./scripts/verify-deployment.sh` |
| `update-threshold-env.sh` | Environment variable setup | `./scripts/update-threshold-env.sh production complete` |

## 🎯 Step-by-Step Deployment Process

### Phase 1: Pre-Deployment Preparation

```bash
# 1. Verify git status
git status

# 2. Run tests locally
npm run test:all

# 3. Check Supabase connection
supabase status --project-ref zbsjqsqytjjlbpchpacl
```

### Phase 2: Database Migration

```bash
# Apply migration 006_dynamic_thresholds.sql
supabase db push --project-ref zbsjqsqytjjlbpchpacl

# Verify migration
supabase db diff --project-ref zbsjqsqytjjlbpchpacl
```

### Phase 3: Environment Configuration

```bash
# Set THRESHOLD_FALLBACK environment variable
./scripts/update-threshold-env.sh production complete

# Verify environment variables
vercel env ls production
```

### Phase 4: Automated Deployment

```bash
# Run complete deployment automation
./scripts/deploy-dynamic-thresholds.sh --confirm
```

### Phase 5: Verification

```bash
# Run comprehensive verification
./scripts/verify-deployment.sh

# Manual verification checklist
# - Check https://huyou-wakarundesu.vercel.app/api/health
# - Test admin interface at /admin/thresholds
# - Verify threshold calculations
```

## 🔄 Manual Deployment Steps (Alternative)

If automated deployment fails, use these manual steps:

### 1. Database Migration
```bash
# Connect to production database
supabase db connect --project-ref zbsjqsqytjjlbpchpacl

# Apply migration manually
\i supabase/migrations/006_dynamic_thresholds.sql

# Verify tables
\d fuyou_thresholds
SELECT count(*) FROM fuyou_thresholds;
```

### 2. Environment Variables
```bash
# Generate THRESHOLD_FALLBACK JSON
cat > /tmp/threshold_fallback.json << 'EOF'
{
  "fuyou_103": {
    "key": "fuyou_103",
    "kind": "tax",
    "year": 2024,
    "yen": 1030000,
    "label": "配偶者控除（103万円の壁）",
    "is_active": true
  },
  "fuyou_106": {
    "key": "fuyou_106",
    "kind": "social",
    "year": 2024,
    "yen": 1060000,
    "label": "社会保険加入義務（106万円の壁）",
    "is_active": true
  },
  "fuyou_130": {
    "key": "fuyou_130",
    "kind": "social",
    "year": 2024,
    "yen": 1300000,
    "label": "社会保険扶養除外（130万円の壁）",
    "is_active": true
  },
  "fuyou_150": {
    "key": "fuyou_150",
    "kind": "tax",
    "year": 2024,
    "yen": 1500000,
    "label": "配偶者特別控除上限（150万円の壁）",
    "is_active": true
  }
}
EOF

# Set environment variable
cat /tmp/threshold_fallback.json | jq -c . | vercel env add THRESHOLD_FALLBACK production

# Set version
echo "v2.1.0" | vercel env add NEXT_PUBLIC_APP_VERSION production
```

### 3. Deployment
```bash
# Create git tag
git tag v2.1.0
git push origin v2.1.0

# Deploy to production
vercel --prod
```

## 🛟 Emergency Rollback Procedures

### Immediate Rollback (Application Level)
```bash
# Option 1: Revert to previous version
git checkout v2.0.0
vercel --prod

# Option 2: Disable dynamic thresholds
echo '{}' | vercel env add THRESHOLD_FALLBACK production
```

### Database Rollback (If Required)
```bash
# Connect to production database
supabase db connect --project-ref zbsjqsqytjjlbpchpacl

# Option 1: Disable thresholds
UPDATE fuyou_thresholds SET is_active = false WHERE year = 2024;

# Option 2: Drop table (CAUTION: Data loss!)
DROP TABLE IF EXISTS fuyou_thresholds CASCADE;
```

### Environment Variable Rollback
```bash
# Remove THRESHOLD_FALLBACK
vercel env rm THRESHOLD_FALLBACK production

# Reset version
echo "v2.0.0" | vercel env add NEXT_PUBLIC_APP_VERSION production
```

## 📊 Verification Checklist

### Automated Verification
- [ ] Health API returns status "healthy"
- [ ] Database connectivity confirmed
- [ ] Dynamic threshold API responds
- [ ] Admin interface accessible
- [ ] Authentication flows work
- [ ] Static assets load correctly

### Manual Verification
- [ ] User can login with Google OAuth
- [ ] Tax calculations are accurate
- [ ] Threshold values match expected amounts
- [ ] Admin can manage thresholds (admin users)
- [ ] Performance is acceptable (< 3s page load)
- [ ] No console errors in browser
- [ ] Mobile interface works properly

### Performance Verification
- [ ] API response time < 1 second
- [ ] Database queries optimized
- [ ] Cache invalidation working
- [ ] Memory usage stable
- [ ] No memory leaks detected

## 🔍 Monitoring and Alerts

### Key Metrics to Monitor
- **Error rate:** Should remain < 1%
- **Response time:** API calls < 1s, pages < 3s
- **Database performance:** Query time < 100ms
- **Cache hit rate:** > 90% for threshold queries

### Alert Thresholds
- Error rate > 5% (immediate alert)
- Response time > 5s (warning)
- Database connection failures (immediate alert)
- Cache miss rate > 50% (warning)

## 📱 Post-Deployment Actions

### Immediate (0-30 minutes)
1. Monitor application logs for errors
2. Verify core functionality works
3. Test authentication flows
4. Check threshold calculations
5. Verify admin interface

### Short-term (30 minutes - 2 hours)
1. Run performance tests
2. Monitor error rates
3. Check database performance
4. Verify cache behavior
5. Test edge cases

### Long-term (2-24 hours)
1. Monitor user adoption
2. Check performance trends
3. Verify backup procedures
4. Update documentation
5. Plan next iteration

## 🎉 Success Criteria

Deployment is considered successful when:
- [ ] All automated tests pass
- [ ] Health API reports "healthy"
- [ ] User authentication works
- [ ] Tax calculations are accurate
- [ ] Admin interface functions correctly
- [ ] Performance metrics are within acceptable range
- [ ] Error rates remain low (< 1%)
- [ ] Database queries perform well
- [ ] Cache invalidation works
- [ ] Mobile interface responsive

## 🔧 Troubleshooting

### Common Issues

#### Issue: Database migration fails
**Symptoms:** Migration script errors, table not created
**Solution:** Check database permissions, verify SQL syntax, apply manually

#### Issue: Environment variables not updating
**Symptoms:** Old threshold values, demo mode still active
**Solution:** Clear Vercel cache, redeploy with --force flag

#### Issue: Admin interface not accessible
**Symptoms:** 404 errors, authentication failures
**Solution:** Check RLS policies, verify user permissions, check routing

#### Issue: Performance degradation
**Symptoms:** Slow response times, timeouts
**Solution:** Check database indexes, optimize queries, verify caching

### Emergency Contacts

- **Technical Lead:** [Contact Information]
- **Database Admin:** [Contact Information]
- **DevOps:** [Contact Information]
- **Product Owner:** [Contact Information]

## 📚 Additional Resources

- **Architecture Document:** `docs/ADR-004-dynamic-threshold-architecture.md`
- **API Documentation:** `/api/docs`
- **Supabase Dashboard:** https://supabase.com/dashboard/project/zbsjqsqytjjlbpchpacl
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Monitoring Dashboard:** [Link to monitoring tool]

---

**Version:** v2.1.0  
**Last Updated:** $(date)  
**Next Review:** $(date -d '+1 month')  
**Deployment Status:** Ready for Production