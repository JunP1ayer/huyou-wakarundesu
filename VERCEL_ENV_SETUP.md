# Vercel 環境変数設定ガイド

## 🎯 本番環境への切り替え手順

### 1. Vercel Dashboard での設定

1. **Vercel Dashboard** にアクセス: https://vercel.com/dashboard
2. プロジェクト `fuyou-wakarundesu` を選択
3. **Settings** → **Environment Variables** に移動

### 2. 設定する環境変数

以下の環境変数を **Production** 環境に設定してください:

#### 🔑 必須設定 (REQUIRED)

```bash
# App Version
NEXT_PUBLIC_APP_VERSION=1.1.0-production

# Supabase Configuration (本番プロジェクト)
NEXT_PUBLIC_SUPABASE_URL=https://[本番プロジェクトRef].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[本番用匿名キー]
SUPABASE_SERVICE_ROLE_KEY=[本番用サービスロールキー]

# OpenAI API (実運用用)
OPENAI_API_KEY=sk-proj-[本番用OpenAI APIキー]

# MoneyTree API (本番アプリ用)
MONEYTREE_CLIENT_ID=[本番用MoneyTreeクライアントID]
MONEYTREE_CLIENT_SECRET=[本番用MoneyTreeクライアントシークレット]
MONEYTREE_REDIRECT_URI=https://fuyou-wakarundesu.vercel.app/api/auth/moneytree/callback
```

#### 📊 オプション設定 (OPTIONAL)

```bash
# Sentry Error Tracking
SENTRY_DSN=https://[本番用SentryDSN]@sentry.io/[プロジェクトID]
SENTRY_AUTH_TOKEN=[本番用Sentryトークン]

# Analytics
VERCEL_ANALYTICS_ID=[本番用VercelアナリティクスID]
NEXT_PUBLIC_GA_ID=G-[本番用GoogleアナリティクスID]

# Environment
NODE_ENV=production
```

### 3. Vercel CLI での設定 (Alternative)

```bash
# Vercelにログイン
vercel login

# 環境変数を設定
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add OPENAI_API_KEY production
vercel env add MONEYTREE_CLIENT_ID production
vercel env add MONEYTREE_CLIENT_SECRET production
vercel env add MONEYTREE_REDIRECT_URI production
```

### 4. 設定確認

```bash
# 環境変数一覧確認
vercel env ls

# 本番環境の環境変数のみ確認
vercel env ls production
```

### 5. デプロイ後の確認

1. **Health Check API**: https://fuyou-wakarundesu.vercel.app/api/health
   - `status: "healthy"` (デモモードではない)
   - `mode: "production"`

2. **Function Test**:
   ```bash
   curl -X POST https://fuyou-wakarundesu.vercel.app/api/classifyFuyou \
     -H "Content-Type: application/json" \
     -d '{"answers":{"estIncome":300000},"isStudent":false}'
   ```

### 6. 環境変数の取得方法

#### 🔗 Supabase
1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. 本番プロジェクトを選択
3. **Settings** → **API** で確認:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

#### 🤖 OpenAI
1. [OpenAI Platform](https://platform.openai.com/api-keys) にログイン
2. **API Keys** で新しいキーを作成
3. 本番用途として設定

#### 💰 MoneyTree
1. [MoneyTree Link Dashboard](https://moneytree.jp/link) にログイン
2. 本番アプリケーションを選択
3. **API Credentials** で確認:
   - `Client ID` → `MONEYTREE_CLIENT_ID`
   - `Client Secret` → `MONEYTREE_CLIENT_SECRET`

### 7. セキュリティ注意事項

- ⚠️ **絶対に** `.env.production` ファイルを Git にコミットしないでください
- 🔐 本番用キーは開発チーム以外と共有しないでください
- 🔄 定期的にキーローテーションを実施してください
- 📊 Sentry や Analytics 設定で機密情報の漏洩を防いでください

### 8. トラブルシューティング

#### デモモードが解除されない場合
```bash
# 環境変数の値を確認
vercel env ls production

# プレースホルダーが残っていないかチェック
# "your-", "___", "sk-proj-_" などの値がないか確認
```

#### API エラーが発生する場合
```bash
# ログ確認
vercel logs --follow

# 環境変数の再設定
vercel env rm OPENAI_API_KEY production
vercel env add OPENAI_API_KEY production
```