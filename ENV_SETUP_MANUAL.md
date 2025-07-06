# Manual Environment Variable Setup Guide

## 🎯 Required Environment Variables for v2.1.0

### 1. THRESHOLD_FALLBACK (Critical)

**Purpose:** Provides fallback threshold values when database is unavailable

**Value to set:**
```json
{"fuyou_103":{"key":"fuyou_103","kind":"tax","year":2024,"yen":1030000,"label":"配偶者控除（103万円の壁）","is_active":true},"fuyou_106":{"key":"fuyou_106","kind":"social","year":2024,"yen":1060000,"label":"社会保険加入義務（106万円の壁）","is_active":true},"fuyou_130":{"key":"fuyou_130","kind":"social","year":2024,"yen":1300000,"label":"社会保険扶養除外（130万円の壁）","is_active":true},"fuyou_150":{"key":"fuyou_150","kind":"tax","year":2024,"yen":1500000,"label":"配偶者特別控除上限（150万円の壁）","is_active":true}}
```

### 2. NEXT_PUBLIC_APP_VERSION

**Purpose:** Displays current application version

**Value to set:**
```
v2.1.0
```

### 3. THRESHOLD_SYSTEM_ENABLED

**Purpose:** Enables dynamic threshold system

**Value to set:**
```
true
```

## 🔧 Setting Environment Variables

### Method 1: Vercel CLI (Recommended)

```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Login to Vercel
vercel login

# Set THRESHOLD_FALLBACK
echo '{"fuyou_103":{"key":"fuyou_103","kind":"tax","year":2024,"yen":1030000,"label":"配偶者控除（103万円の壁）","is_active":true},"fuyou_106":{"key":"fuyou_106","kind":"social","year":2024,"yen":1060000,"label":"社会保険加入義務（106万円の壁）","is_active":true},"fuyou_130":{"key":"fuyou_130","kind":"social","year":2024,"yen":1300000,"label":"社会保険扶養除外（130万円の壁）","is_active":true},"fuyou_150":{"key":"fuyou_150","kind":"tax","year":2024,"yen":1500000,"label":"配偶者特別控除上限（150万円の壁）","is_active":true}}' | vercel env add THRESHOLD_FALLBACK production

# Set version
echo "v2.1.0" | vercel env add NEXT_PUBLIC_APP_VERSION production

# Set system enabled flag
echo "true" | vercel env add THRESHOLD_SYSTEM_ENABLED production
```

### Method 2: Vercel Dashboard (Web Interface)

1. Go to https://vercel.com/dashboard
2. Select project: `huyou-wakarundesu`
3. Go to **Settings** → **Environment Variables**
4. Add the following variables for **Production** environment:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `THRESHOLD_FALLBACK` | `{"fuyou_103":{"key":"fuyou_103","kind":"tax","year":2024,"yen":1030000,"label":"配偶者控除（103万円の壁）","is_active":true},"fuyou_106":{"key":"fuyou_106","kind":"social","year":2024,"yen":1060000,"label":"社会保険加入義務（106万円の壁）","is_active":true},"fuyou_130":{"key":"fuyou_130","kind":"social","year":2024,"yen":1300000,"label":"社会保険扶養除外（130万円の壁）","is_active":true},"fuyou_150":{"key":"fuyou_150","kind":"tax","year":2024,"yen":1500000,"label":"配偶者特別控除上限（150万円の壁）","is_active":true}}` | Production |
| `NEXT_PUBLIC_APP_VERSION` | `v2.1.0` | Production |
| `THRESHOLD_SYSTEM_ENABLED` | `true` | Production |

## 🔍 Verification Commands

### After Setting Environment Variables

```bash
# Check environment variables are set
vercel env ls production | grep -E "(THRESHOLD|VERSION)"

# Expected output:
# THRESHOLD_FALLBACK          Production
# NEXT_PUBLIC_APP_VERSION      Production  
# THRESHOLD_SYSTEM_ENABLED     Production
```

### After Deployment

```bash
# Test health endpoint
curl -s https://huyou-wakarundesu.vercel.app/api/health

# Expected response includes:
# {"healthy": true, "mode": "production", "version": "v2.1.0"}

# Test threshold API
curl -s https://huyou-wakarundesu.vercel.app/api/thresholds/2024

# Expected response:
# {"fuyou_103": {...}, "fuyou_106": {...}, "fuyou_130": {...}, "fuyou_150": {...}}
```

## 📋 THRESHOLD_FALLBACK Format Explanation

The THRESHOLD_FALLBACK JSON contains threshold definitions with the following structure:

```json
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
```

### Field Descriptions

- **key**: Unique identifier for the threshold
- **kind**: Type of threshold ("tax" or "social")
- **year**: Year the threshold applies to
- **yen**: Threshold amount in Japanese yen
- **label**: Human-readable description in Japanese
- **is_active**: Whether the threshold is currently active

## 🔄 Fallback Strategy

The system uses a three-tier fallback strategy:

1. **Database First**: Load from `fuyou_thresholds` table
2. **Environment Variable**: Use `THRESHOLD_FALLBACK` if database unavailable
3. **Hardcoded**: Use built-in defaults as last resort

## 🚨 Troubleshooting

### Issue: Environment variable not updating

**Symptoms:** Application still uses old values

**Solution:**
1. Check environment variable is set: `vercel env ls production`
2. Redeploy application: `vercel --prod`
3. Clear Vercel cache: `vercel --prod --force`

### Issue: Invalid JSON format

**Symptoms:** Application fails to parse THRESHOLD_FALLBACK

**Solution:**
1. Validate JSON format online: https://jsonlint.com/
2. Ensure no extra characters or line breaks
3. Use exact value provided above

### Issue: Threshold values not loading

**Symptoms:** Default values used instead of configured values

**Solution:**
1. Check `THRESHOLD_SYSTEM_ENABLED` is set to "true"
2. Verify database connection
3. Check API endpoint: `/api/thresholds/2024`

## 🎯 Next Steps After Environment Setup

1. **Deploy Application**
   ```bash
   vercel --prod
   ```

2. **Verify Deployment**
   ```bash
   curl -s https://huyou-wakarundesu.vercel.app/api/health
   ```

3. **Test Threshold Calculations**
   - Access admin interface at `/admin/thresholds`
   - Test threshold calculations with sample data
   - Verify fallback behavior

4. **Monitor Application**
   - Check error logs in Vercel dashboard
   - Monitor performance metrics
   - Set up alerts for failures

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Test API endpoints manually
4. Review application logs in Vercel dashboard

---

**Generated:** $(date)  
**Version:** v2.1.0  
**Status:** Ready for Production