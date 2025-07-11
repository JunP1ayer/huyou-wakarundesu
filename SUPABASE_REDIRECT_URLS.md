# Supabase リダイレクト URL 設定

## 設定手順

1. [Supabaseダッシュボード](https://supabase.com/dashboard) にアクセス
2. プロジェクトを選択
3. 「Authentication」→「URL Configuration」に移動
4. 以下のURLを追加してください

## 追加すべきリダイレクトURL

### 本番環境用
```
https://huyou-wakarundesu.vercel.app/auth/callback
```

### プレビュー環境用（Vercel）
```
https://huyou-wakarundesu-*.vercel.app/auth/callback
```

### ローカル開発環境用
```
http://localhost:3000/auth/callback
```

## 設定後の確認事項

1. ✅ 認証コールバックが正常に動作することを確認
2. ✅ ローカル開発環境でGoogle OAuth認証が機能することを確認
3. ✅ Vercel Preview環境で認証が機能することを確認
4. ✅ 本番環境で認証が機能することを確認

## 注意事項

- ワイルドカード（*）を使用したURLは、Vercelのプレビューデプロイメント用です
- セキュリティのため、不要なリダイレクトURLは削除してください
- 新しいドメインを追加する場合は、同様にこのリストを更新してください

## 認証フロー

1. ユーザーが `/login` でGoogle認証をクリック
2. Google OAuth画面でユーザーが認証
3. Googleが `/auth/callback` にリダイレクト
4. 新しいルートハンドラー（`/app/auth/callback/route.ts`）が認証コードを処理
5. セッション作成後、適切なページ（`/` または `/dashboard`）にリダイレクト