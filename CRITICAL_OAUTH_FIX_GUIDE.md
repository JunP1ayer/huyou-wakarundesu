# 🚨 CRITICAL: OAuth Redirect Fix - localhost問題解決

## 🔍 問題の原因 (IDENTIFIED)

1. **間違ったSupabase URL**: 本番環境は `zbsjqsqytjjlbthkmwqx` プロジェクトを使用しているが、ローカル設定は `eflscrkkhwubtbmhsxez` を参照
2. **間違ったリダイレクト設定**: OAuth が `/dashboard` に直接リダイレクトしていたが、正しくは `/auth/callback` 

## ✅ 修正完了

### 1. 環境変数修正 (FIXED)
**正しいSupabase URL**: `https://zbsjqsqytjjlbthkmwqx.supabase.co`

**更新済みファイル:**
- `.env.production` ✅
- `.env.local` ✅

### 2. OAuth リダイレクト修正 (FIXED)
**変更前:** `redirectTo: ${window.location.origin}/dashboard`
**変更後:** `redirectTo: ${window.location.origin}/auth/callback`

**修正済みファイル:**
- `app/login/page.tsx` ✅

## 🔧 必要な外部設定 (MANUAL REQUIRED)

### Google Cloud Console 設定
**OAuth 2.0 クライアント ID: 476126378892-ppgshp1ar4l8lcypgu8mofteh3m207r.apps.googleusercontent.com**

**承認済みJavaScript生成元:**
```
https://huyou-wakarundesu.vercel.app
http://localhost:3000
```

**承認済みリダイレクトURI (重要):**
```
https://zbsjqsqytjjlbthkmwqx.supabase.co/auth/v1/callback
https://huyou-wakarundesu.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

### Supabase Dashboard 設定
**プロジェクト**: `zbsjqsqytjjlbthkmwqx`
**URL**: https://supabase.com/dashboard/project/zbsjqsqytjjlbthkmwqx

**Authentication → Settings → External OAuth Providers → Google:**
```
✅ Enable Google provider: ON

✅ Client ID (for OAuth):
476126378892-ppgshp1ar4l8lcypgu8mofteh3m207r.apps.googleusercontent.com

✅ Client Secret (for OAuth):
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

✅ Skip nonce check: false
✅ Skip email verification: false
```

**❗ CRITICAL:** Click **"Save"** or **"Update"** button after entering values

### Vercel Environment Variables 設定
**CRITICAL:** Vercelの環境変数を以下に更新:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://zbsjqsqytjjlbthkmwqx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic2pxc3F5dGpqbGJ0aGttd3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5NDI0MzIsImV4cCI6MjA1MTUxODQzMn0.Qr1A3G7B2CkEf5_NgH8mV2YZ0Ic4Ds6WnJtR9Kv7PXs
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic2pxc3F5dGpqbGJ0aGttd3F4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTk0MjQzMiwiZXhwIjoyMDUxNTE4NDMyfQ.X8kL9QmN2VpA6Rt3Yc1Ef4Hd7SwJ0GuPzM5BnKv8LtE
GOOGLE_CLIENT_ID=476126378892-ppgshp1ar4l8lcypgu8mofteh3m207r.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
NEXT_PUBLIC_DEMO_MODE=false
```

## 🎯 正しいOAuthフロー

### 修正後の正しいフロー:
1. **User clicks Google login** → `https://huyou-wakarundesu.vercel.app/login`
2. **Google OAuth redirect** → `https://accounts.google.com/oauth/authorize`
3. **Google callback** → `https://zbsjqsqytjjlbthkmwqx.supabase.co/auth/v1/callback`
4. **Supabase processes auth** → `https://huyou-wakarundesu.vercel.app/auth/callback`
5. **App handles session** → `/onboarding` (new user) or `/dashboard` (existing user)

### ❌ 問題があったフロー:
- OAuth が直接 `/dashboard` にリダイレクト (ステップ4をスキップ)
- 間違ったSupabaseプロジェクトURL

## ⚠️ 三重検証チェックリスト

### 1. Google Cloud Console
- [ ] OAuth 2.0 クライアント設定を開く
- [ ] リダイレクトURIに `https://zbsjqsqytjjlbthkmwqx.supabase.co/auth/v1/callback` が含まれている
- [ ] リダイレクトURIに `https://huyou-wakarundesu.vercel.app/auth/callback` が含まれている
- [ ] `localhost:3000` の参照が **削除されていない** ことを確認

### 2. Supabase Dashboard  
- [ ] 正しいプロジェクト (`zbsjqsqytjjlbthkmwqx`) にログイン
- [ ] Google provider が **有効** 
- [ ] クライアントID/シークレットが正しく入力済み
- [ ] **Save/Update ボタンを押下済み**

### 3. Vercel Environment Variables
- [ ] Vercel dashboard でプロジェクト設定を確認
- [ ] `NEXT_PUBLIC_SUPABASE_URL` が `https://zbsjqsqytjjlbthkmwqx.supabase.co`
- [ ] 他の環境変数も上記の値に一致
- [ ] Deploy trigger またはリビルド実行

## 🚀 テスト手順

### 修正後のテスト:
1. **本番サイトアクセス**: `https://huyou-wakarundesu.vercel.app/login`
2. **Googleログインボタンクリック**
3. **Google認証画面確認** (localhost:3000にリダイレクトされないことを確認)
4. **Callback処理確認**: `/auth/callback` → `/onboarding` または `/dashboard`
5. **ユーザーセッション確認**: ログイン状態が保持されている

---

**🎯 この修正により、OAuth認証が localhost:3000 ではなく本番ドメインで正しく動作するようになります**