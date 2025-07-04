# 🔧 SUPABASE EMERGENCY CHECKLIST - 緊急確認項目

## 🎯 **CRITICAL VERIFICATION REQUIRED**

### **📋 Dashboard URL**: https://supabase.com/dashboard/project/zbsjqsqytjjlbthkmwqx

## 🔴 **URGENT CHECK 1: Authentication Settings**

### **Location**: Authentication → Settings → General

**Site URL 確認**:
```
✅ CORRECT: https://huyou-wakarundesu.vercel.app
❌ INCORRECT: http://localhost:3000
❌ INCORRECT: https://eflscrkkhwubtbmhsxez.supabase.co
```

**Redirect URLs 確認**:
```
必要なURL (すべて追加されている必要あり):
✅ https://huyou-wakarundesu.vercel.app/auth/callback
✅ https://huyou-wakarundesu.vercel.app/dashboard  
✅ https://huyou-wakarundesu.vercel.app/onboarding
✅ http://localhost:3000/auth/callback (開発用)
```

## 🔴 **URGENT CHECK 2: Google OAuth Provider**

### **Location**: Authentication → Settings → External OAuth Providers → Google

**必須設定確認**:
```
✅ Enable Google provider: ON (有効)

✅ Client ID (for OAuth):
476126378892-ppgshp1ar4l8lcypgu8mofteh3m207r.apps.googleusercontent.com

✅ Client Secret (for OAuth):  
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

✅ Skip nonce check: false (推奨)
✅ Skip email verification: false (推奨)
```

**🚨 CRITICAL**: 設定後、必ず **"Save"** または **"Update"** ボタンをクリック

## 🔴 **URGENT CHECK 3: Email Templates (Optional but Important)**

### **Location**: Authentication → Email Templates

**確認項目**:
- Confirm signup template が適切に設定されているか
- Magic link template が適切に設定されているか

## ⚡ **IMMEDIATE ACTION ITEMS**

### **Priority 1**:
1. Site URL が本番URLに設定されているか確認
2. 間違っている場合は即座に修正

### **Priority 2**:  
3. Google OAuth Provider が完全に有効化されているか確認
4. Client ID/Secret が正確に入力されているか確認

### **Priority 3**:
5. Redirect URLs に本番URLがすべて含まれているか確認
6. 不足している場合は追加

## 🎯 **SUCCESS VALIDATION**

設定完了後、以下で確認:
```bash
# Auth validation endpoint test
curl https://huyou-wakarundesu.vercel.app/api/auth/validate

Expected response:
{
  "status": "ready",
  "oauth": {
    "googleProvider": {
      "status": "enabled",
      "error": null
    }
  }
}
```

## ⏰ **TIMING ESTIMATE**
- 設定確認・修正: 3-5分
- 反映時間: 1-2分
- 合計: 6-7分

---
**🎯 このチェックリストで Supabase側の設定問題が完全に解決されます。**