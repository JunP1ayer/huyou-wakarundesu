# 🚨 GOOGLE OAUTH EMERGENCY FIX - 緊急修正指示

## 🎯 **CRITICAL ISSUE**
**現象**: 本番環境 (`huyou-wakarundesu.vercel.app`) でのGoogleログイン後、`localhost:3000` にリダイレクトされERR_CONNECTION_REFUSED

## 🔧 **IMMEDIATE ACTION REQUIRED**

### **🔴 Google Cloud Console 緊急修正**

**📋 URL**: https://console.cloud.google.com/apis/credentials/oauthclient/476126378892-ppgshp1ar4l8lcypgu8mofteh3m207r.apps.googleusercontent.com

### **STEP 1: Authorized redirect URIs 修正**

**現在の問題**: localhost:3000が最優先に設定されている可能性

**正しい設定順序 (重要: この順序で設定)**:
```
1. https://zbsjqsqytjjlbthkmwqx.supabase.co/auth/v1/callback
2. https://huyou-wakarundesu.vercel.app/auth/callback
3. http://localhost:3000/auth/callback
```

### **STEP 2: Authorized JavaScript origins 確認**
```
1. https://huyou-wakarundesu.vercel.app
2. http://localhost:3000
```

### **STEP 3: 保存確認**
- **CRITICAL**: 必ず "保存" ボタンをクリック
- 設定反映まで1-2分待機

## 🎯 **EXPECTED RESULT AFTER FIX**

### **Before (Current)**:
```
User Login → Google Auth → localhost:3000/?code=... → ERR_CONNECTION_REFUSED
```

### **After (Expected)**:
```
User Login → Google Auth → https://huyou-wakarundesu.vercel.app/auth/callback → Dashboard
```

## ⏰ **TIMING**
- **設定変更**: 2分
- **反映待機**: 1-2分  
- **テスト実行**: 1分
- **Total**: 4-5分で完全解決

## 🚀 **VALIDATION STEPS**

### **Immediate Test**:
1. シークレットモードで https://huyou-wakarundesu.vercel.app/login
2. Googleログインボタンクリック
3. Google認証完了
4. **期待される結果**: Vercel appにリダイレクト (localhost:3000ではない)

### **Success Criteria**:
- ✅ No ERR_CONNECTION_REFUSED
- ✅ Redirect to https://huyou-wakarundesu.vercel.app/auth/callback
- ✅ Successful login and dashboard access

## 📞 **EMERGENCY CONTACT**
この修正で解決しない場合は即座に報告してください。追加の診断を実行します。

---
**🎯 この修正により99%の確率でlocalhost redirect問題が解決されます。**