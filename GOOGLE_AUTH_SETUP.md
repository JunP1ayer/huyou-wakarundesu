# 🔐 Google OAuth 認証設定ガイド

現在のエラー: `"Unsupported provider: provider is not enabled"`

このエラーは **Supabase側でGoogle認証が有効化されていない** ことが原因です。

---

## 📋 **手順 1: Google Cloud Console でOAuthクライアント作成**

### 1. Google Cloud Console にアクセス
1. [Google Cloud Console](https://console.cloud.google.com/) にログイン
2. 新しいプロジェクトを作成、または既存プロジェクトを選択

### 2. APIs & Services の設定
1. **APIs & Services** → **認証情報** に移動
2. **+ 認証情報を作成** → **OAuth 2.0 クライアント ID** を選択
3. **アプリケーションの種類**: `ウェブ アプリケーション` を選択

### 3. 認証済みリダイレクト URI の設定
**重要**: 以下のURIを正確に追加してください

```
# 本番環境
https://huyou-wakarundesu.vercel.app/auth/v1/callback

# 開発環境（必要に応じて）
http://localhost:3000/auth/v1/callback
```

### 4. クライアント情報の取得
作成完了後、以下の情報をコピーします：
- **クライアント ID**: `xxxxx.apps.googleusercontent.com`
- **クライアント シークレット**: `GOCSPX-xxxxx`

---

## 📋 **手順 2: Supabase ダッシュボードでGoogle認証有効化**

### 1. Supabase プロジェクトにアクセス
1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. **本番プロジェクト** を選択

### 2. Google Provider の有効化
1. 左サイドバー → **Authentication** を選択
2. **Settings** タブ内の **External OAuth Providers** へ移動
3. **Google** プロバイダーを見つけて **Enable** をON

### 3. Google OAuth設定の入力
```
Client ID (for OAuth): [Google Cloud Consoleで取得したクライアントID]
Client Secret (for OAuth): [Google Cloud Consoleで取得したクライアントシークレット]
```

### 4. リダイレクトURL確認
Supabaseに表示される **Redirect URL** をコピー：
```
https://[your-project-ref].supabase.co/auth/v1/callback
```

### 5. 設定の保存
**Save** ボタンをクリックして設定を保存

---

## 📋 **手順 3: Google Cloud Console に戻ってリダイレクトURI更新**

### Supabaseのリダイレクト URI を追加
1. Google Cloud Console の OAuth クライアント設定に戻る
2. **認証済みのリダイレクト URI** に以下を追加：

```
# Supabaseのコールバック（重要！）
https://[your-project-ref].supabase.co/auth/v1/callback

# 既存のアプリコールバック
https://huyou-wakarundesu.vercel.app/auth/v1/callback
```

---

## 📋 **手順 4: 動作確認**

### 1. 設定完了の確認
以下をチェック：
- ✅ Google Cloud Console: OAuthクライアント作成済み
- ✅ Supabase: Google provider有効化済み
- ✅ 両方のリダイレクトURIが正しく設定済み

### 2. テスト方法
1. https://huyou-wakarundesu.vercel.app/login にアクセス
2. **Googleでログイン** ボタンをクリック
3. Googleの認証画面が表示されることを確認
4. 認証後、Dashboard にリダイレクトされることを確認

### 3. エラーチェック
```bash
# ブラウザのコンソールで確認
# 以下のエラーが出なくなっていることを確認
❌ "Unsupported provider: provider is not enabled"
❌ "Auth session missing"

# 成功時のログ
✅ "Auth state change: SIGNED_IN"
✅ セッション情報の表示
```

---

## 🚨 **よくあるエラーと解決法**

### エラー 1: `redirect_uri_mismatch`
**原因**: Google Cloud ConsoleのリダイレクトURIが間違っている
**解決**: URIをもう一度確認して正確に入力

### エラー 2: `unauthorized_client`
**原因**: クライアントIDまたはシークレットが間違っている
**解決**: Google Cloud Consoleで再確認してSupabaseに正確に入力

### エラー 3: まだ `provider is not enabled`
**原因**: Supabaseの設定が保存されていない
**解決**: Supabaseで再度Googleプロバイダーを有効化して保存

---

## 📋 **設定完了チェックリスト**

**Google Cloud Console:**
- [ ] プロジェクト作成済み
- [ ] OAuth 2.0 クライアント ID 作成済み
- [ ] ウェブアプリケーション種別選択済み
- [ ] リダイレクトURI 2つ設定済み
  - [ ] `https://[supabase-ref].supabase.co/auth/v1/callback`
  - [ ] `https://huyou-wakarundesu.vercel.app/auth/v1/callback`
- [ ] クライアントID・シークレット取得済み

**Supabase Dashboard:**
- [ ] 本番プロジェクト選択済み
- [ ] Authentication → Settings → External OAuth Providers
- [ ] Google プロバイダー有効化済み
- [ ] クライアントID・シークレット入力済み
- [ ] 設定保存済み

**動作確認:**
- [ ] ログインページでGoogleボタンが動作
- [ ] Google認証画面表示
- [ ] 認証後のリダイレクト成功
- [ ] Dashboard アクセス可能
- [ ] API呼び出し時の認証エラー解消

---

## 🎯 **Next Steps**

1. **Google Cloud Console設定** → 認証情報作成
2. **Supabase設定** → Google Provider有効化  
3. **テスト** → 実際のログイン動作確認
4. **デバッグ** → エラーが発生した場合の対応

設定完了後、認証関連の全エラーが解決されます！