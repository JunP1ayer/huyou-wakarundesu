# 🚀 Quick Deploy Steps - v2.1.0

## 1️⃣ Set Environment Variables (Vercel Dashboard)

Go to: https://vercel.com/dashboard → Project Settings → Environment Variables

Add these 3 variables for **Production**:

### THRESHOLD_FALLBACK
```
{"fuyou_103":{"key":"fuyou_103","kind":"tax","year":2024,"yen":1030000,"label":"配偶者控除（103万円の壁）","is_active":true},"fuyou_106":{"key":"fuyou_106","kind":"social","year":2024,"yen":1060000,"label":"社会保険加入義務（106万円の壁）","is_active":true},"fuyou_130":{"key":"fuyou_130","kind":"social","year":2024,"yen":1300000,"label":"社会保険扶養除外（130万円の壁）","is_active":true},"fuyou_150":{"key":"fuyou_150","kind":"tax","year":2024,"yen":1500000,"label":"配偶者特別控除上限（150万円の壁）","is_active":true}}
```

### NEXT_PUBLIC_APP_VERSION
```
v2.1.0
```

### THRESHOLD_SYSTEM_ENABLED
```
true
```

## 2️⃣ Apply Database Migration (Supabase Dashboard)

Go to: https://supabase.com/dashboard/project/zbsjqsqytjjlbpchpacl/sql/new

Copy & paste the contents of: `supabase/migrations/006_dynamic_thresholds.sql`

Click **Run**

## 3️⃣ Deploy to Production

### Option A: GitHub Push
```bash
git push origin main
```

### Option B: Vercel Dashboard
Go to: Vercel Dashboard → Deploy → New Deployment → Select `main` branch

## 4️⃣ Verify Deployment

```bash
# Check health
curl https://huyou-wakarundesu.vercel.app/api/health

# Check thresholds
curl https://huyou-wakarundesu.vercel.app/api/thresholds/2024
```

## ✅ Success Indicators

- Health API shows `"version": "v2.1.0"`
- Thresholds API returns 4 thresholds
- Admin interface accessible at `/admin/thresholds`
- No errors in Vercel function logs

---

**Time Required**: ~10 minutes  
**Risk Level**: Low (rollback available)