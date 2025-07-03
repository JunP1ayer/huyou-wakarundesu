# Vercel CLI セットアップ & 環境変数設定

## 1. Vercel CLI でログイン & プロジェクトリンク

```bash
# Vercelにログイン
vercel login

# プロジェクトをリンク (既存プロジェクトを選択)
vercel link

# 現在の設定確認
vercel env ls
```

## 2. CLI で環境変数設定 (代替方法)

```bash
# Supabase設定
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# 入力: https://your-project-ref.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production  
# 入力: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# 入力: your-service-role-key

# OpenAI設定
vercel env add OPENAI_API_KEY production
# 入力: sk-proj-your-openai-api-key

# App Version
vercel env add NEXT_PUBLIC_APP_VERSION production
# 入力: 1.1.0-production
```

## 3. 設定確認 & デプロイ

```bash
# 環境変数一覧確認
vercel env ls

# 手動デプロイ (環境変数が反映されない場合)
vercel --prod

# デプロイ状況確認
vercel ls
```

## 4. API動作確認

```bash
# プロジェクトURLを取得
vercel ls | grep fuyou

# Health API確認
curl https://[YOUR-VERCEL-URL]/api/health

# 扶養分類API確認
curl -X POST https://[YOUR-VERCEL-URL]/api/classifyFuyou \
  -H "Content-Type: application/json" \
  -d '{"answers":{"estIncome":300000},"isStudent":false}'
```

## 5. トラブルシューティング

```bash
# ログ確認
vercel logs --follow

# 環境変数削除 (間違えた場合)
vercel env rm VARIABLE_NAME production

# 再デプロイ
vercel --prod --force
```