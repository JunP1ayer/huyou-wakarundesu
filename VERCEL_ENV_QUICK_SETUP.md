# 🚀 Vercel 環境変数 クイック設定

## 必須設定項目 (Production)

### 1. Supabase 設定

```
Variable Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://[本番プロジェクトRef].supabase.co
Environment: Production
```

```
Variable Name: NEXT_PUBLIC_SUPABASE_ANON_KEY  
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[本番用匿名キー]
Environment: Production
```

```
Variable Name: SUPABASE_SERVICE_ROLE_KEY
Value: [本番用サービスロールキー]
Environment: Production
```

### 2. OpenAI API 設定

```
Variable Name: OPENAI_API_KEY
Value: sk-proj-[本番用OpenAI APIキー]
Environment: Production
```

### 3. App Version

```
Variable Name: NEXT_PUBLIC_APP_VERSION
Value: 1.1.0-production
Environment: Production
```

## 📍 環境変数の取得先

### Supabase
1. https://supabase.com/dashboard にログイン
2. 本番プロジェクトを選択
3. Settings → API で確認:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role → `SUPABASE_SERVICE_ROLE_KEY`

### OpenAI
1. https://platform.openai.com/api-keys にログイン
2. "Create new secret key" をクリック
3. 名前: "fuyou-wakarundesu-production"
4. 生成されたキー → `OPENAI_API_KEY`

## ✅ 設定確認方法

### 1. 設定後のデプロイ待ち
Vercel で環境変数を保存すると自動的に新しいデプロイが開始されます。

### 2. API確認
```bash
# Health Check (本番モード確認)
curl https://fuyou-wakarundesu.vercel.app/api/health

# 期待結果:
{
  "status": "healthy",
  "mode": "production",
  "supabase": "connected",
  "openai": "available"
}
```

### 3. 扶養分類API確認
```bash
curl -X POST https://fuyou-wakarundesu.vercel.app/api/classifyFuyou \
  -H "Content-Type: application/json" \
  -d '{"answers":{"estIncome":300000},"isStudent":false}'

# 期待結果:
{
  "category": "扶養内",
  "recommendation": "...",
  "calculations": {...}
}
```

## ⚠️ 重要な注意事項

1. **Environment を "Production" に設定**
   - Preview/Development では設定しない
   
2. **セキュリティ**
   - `SUPABASE_SERVICE_ROLE_KEY` は絶対に公開しない
   - `OPENAI_API_KEY` も機密情報として扱う
   
3. **デプロイ確認**
   - 環境変数保存後、自動デプロイが完了するまで数分待つ
   - Functions タブでビルドログを確認

## 🔄 設定手順 (ブラウザ)

1. **Vercel Dashboard** → **fuyou-wakarundesu** プロジェクト
2. **Settings** → **Environment Variables**
3. **Add New** ボタンをクリック
4. 上記の環境変数を1つずつ追加
5. 各変数で **Environment: Production** を選択
6. **Save** をクリック
7. 自動デプロイの完了を待つ
8. API確認で動作テスト

## 📞 サポート

設定で問題が発生した場合:
- `VERCEL_ENV_SETUP.md` で詳細手順を確認
- Vercel Functions タブでエラーログを確認
- API Health Check で設定状況を確認