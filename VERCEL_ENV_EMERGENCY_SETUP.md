# ⚡ VERCEL ENVIRONMENT EMERGENCY SETUP

## 🚨 **CRITICAL: Production Environment Variables**

### **Current Issue**: Environment variables might not be properly set in Vercel production

## 🔧 **IMMEDIATE VERCEL CLI SETUP**

### **Step 1: Vercel Login (if needed)**
```bash
vercel login
```

### **Step 2: Link Project (if needed)**
```bash
cd /home/junp1ayer/fuyou-wakarundesu
vercel link
```

### **Step 3: Verify Current Environment Variables**
```bash
vercel env ls production
```

### **Step 4: Set Critical Environment Variables**

**🔴 REQUIRED FOR AUTHENTICATION:**
```bash
vercel env add NEXT_PUBLIC_DEMO_MODE "false" production
vercel env add NEXT_PUBLIC_SUPABASE_URL "https://zbsjqsqytjjlbthkmwqx.supabase.co" production  
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic2pxc3F5dGpqbGJ0aGttd3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5NDI0MzIsImV4cCI6MjA1MTUxODQzMn0.Qr1A3G7B2CkEf5_NgH8mV2YZ0Ic4Ds6WnJtR9Kv7PXs" production
vercel env add SUPABASE_SERVICE_ROLE_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic2pxc3F5dGpqbGJ0aGttd3F4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTk0MjQzMiwiZXhwIjoyMDUxNTE4NDMyfQ.X8kL9QmN2VpA6Rt3Yc1Ef4Hd7SwJ0GuPzM5BnKv8LtE" production
vercel env add GOOGLE_CLIENT_ID "476126378892-ppgshp1ar4l8lcypgu8mofteh3m207r.apps.googleusercontent.com" production
vercel env add GOOGLE_CLIENT_SECRET "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" production
vercel env add NODE_ENV "production" production
```

### **Step 5: Force Rebuild with New Environment Variables**
```bash
vercel --prod
```

## 🎯 **ALTERNATIVE: Vercel Dashboard Method**

### **Dashboard URL**: https://vercel.com/dashboard

**Navigate to**: Your Project → Settings → Environment Variables

**Add these variables for PRODUCTION environment**:
```
NEXT_PUBLIC_DEMO_MODE = false
NEXT_PUBLIC_SUPABASE_URL = https://zbsjqsqytjjlbthkmwqx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic2pxc3F5dGpqbGJ0aGttd3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5NDI0MzIsImV4cCI6MjA1MTUxODQzMn0.Qr1A3G7B2CkEf5_NgH8mV2YZ0Ic4Ds6WnJtR9Kv7PXs
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic2pxc3F5dGpqbGJ0aGttd3F4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTk0MjQzMiwiZXhwIjoyMDUxNTE4NDMyfQ.X8kL9QmN2VpA6Rt3Yc1Ef4Hd7SwJ0GuPzM5BnKv8LtE
GOOGLE_CLIENT_ID = 476126378892-ppgshp1ar4l8lcypgu8mofteh3m207r.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = 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
NODE_ENV = production
```

## ✅ **VERIFICATION**

After setting environment variables:

```bash
# Check health endpoint
curl https://huyou-wakarundesu.vercel.app/api/health

# Expected response:
{
  "status": "healthy",
  "mode": "production",  # <- This should be "production", not "demo"
  "environment": {
    "configured": true,
    "missing": []
  }
}
```

## ⏰ **TIMING**
- Environment variable setup: 5-7 minutes
- Deployment time: 2-3 minutes  
- Total: 8-10 minutes

---
**🎯 Environment variables are critical for OAuth to work correctly in production.**