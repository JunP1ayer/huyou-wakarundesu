# 扶養わかるんです 💰

学生・アルバイト向けの扶養控除計算・管理アプリケーション

[![CI/CD](https://github.com/JunP1ayer/huyou-wakarundesu/actions/workflows/deploy.yml/badge.svg)](https://github.com/JunP1ayer/huyou-wakarundesu/actions/workflows/deploy.yml)
[![Coverage](https://img.shields.io/badge/coverage-8.6%25-orange)](./coverage/lcov-report/index.html)
[![Tests](https://img.shields.io/badge/tests-116%20passing-brightgreen)](./test-results/)

## 🎯 概要

扶養控除の複雑な制度を簡単に理解し、適切な範囲内でアルバイトができるようサポートするWebアプリケーションです。

### 主要機能
- 🧮 **扶養控除自動計算**: 103万円、106万円、130万円の壁を自動判定
- 📊 **収入ダッシュボード**: リアルタイムの収入状況と残り可能額を表示
- 🏦 **銀行API連携**: 自動収入追跡（MoneyTree連携）
- 🔔 **閾値通知**: 扶養控除上限への接近アラート
- 📱 **モバイル対応**: PWA対応でスマートフォンでも快適利用

## 🚀 セットアップ

### 前提条件
- Node.js 18.20.0 以上
- npm 9.0.0 以上
- Supabase アカウント

### インストール
```bash
# リポジトリクローン
git clone https://github.com/JunP1ayer/huyou-wakarundesu.git
cd huyou-wakarundesu

# 依存関係インストール
npm ci --legacy-peer-deps

# 環境変数設定
npm run setup

# 開発サーバー起動
npm run dev
```

### 環境変数
```bash
# 必須
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# オプション
OPENAI_API_KEY=your_openai_key  # AI チャット機能用
VERCEL_TOKEN=your_vercel_token  # デプロイメント用
```

## 🧪 テスト

### ユニットテスト
```bash
# 全テスト実行
npm test

# ウォッチモード
npm run test:watch

# カバレッジ確認
npm run test:coverage
```

### E2Eテスト
```bash
# E2Eテスト実行
npm run test:e2e

# UIモード（デバッグ用）
npm run test:e2e:ui

# デバッグモード
npm run test:e2e:debug
```

## 📋 テストポリシー

### Flaky Test Zero Tolerance
**重要**: Flaky テストは **14日以内** に修正または無効化が必要です。

- **自動検知**: 毎日午前3時に Flaky テスト検知実行
- **Issue自動作成**: `flaky-test` ラベル付きで GitHub Issue 生成
- **解決期限**: 検知から2週間以内の対応必須

詳細は [Testing Policy](./docs/testing.md) を参照してください。

## 🛠️ 技術スタック

- **Frontend**: Next.js 15.3.4, React 19, TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Testing**: Jest, Playwright, React Testing Library
- **CI/CD**: GitHub Actions, Vercel
- **Monitoring**: Sentry, Google Analytics

## 📁 プロジェクト構造

```
├── app/                    # Next.js App Router
├── components/            # React コンポーネント
├── lib/                   # ビジネスロジック・ユーティリティ
├── hooks/                 # カスタムフック
├── e2e/                   # E2Eテスト (Playwright)
├── __tests__/             # ユニットテスト (Jest)
├── docs/                  # ドキュメント
└── supabase/              # データベースマイグレーション
```

## 🚀 デプロイメント

### Vercel (本番環境)
```bash
# 自動デプロイ: main ブランチへのプッシュで自動実行
git push origin main

# 手動デプロイ
npm run deploy
```

### 品質ゲート
- ✅ ユニットテスト全通過 (116/116)
- ✅ ESLint警告 < 50
- ✅ TypeScript型チェック通過
- ✅ E2Eテスト通過 (Flaky許容)

## 📊 メトリクス

### 現在の状況
- **テストカバレッジ**: 8.6% → 目標 25%
- **テスト数**: 116 tests (全通過)
- **Flaky Tests**: 0 (目標維持)
- **CI成功率**: >95%

### 改善ロードマップ
1. **Phase 1** (2週間): Flaky テスト完全撲滅
2. **Phase 2** (4週間): カバレッジ 25% 達成
3. **Phase 3** (6週間): ミューテーションテスト・パフォーマンステスト

## 🤝 貢献

### プルリクエスト要件
- [ ] ユニットテスト通過
- [ ] ESLint/TypeScript エラーなし
- [ ] E2Eテスト通過
- [ ] `e2e/**` 変更時はQAレビュー必須

### コードレビュー
- **CODEOWNERS**: E2E テスト変更時は必須レビュー
- **品質基準**: テストポリシー準拠
- **ドキュメント**: 重要な変更は `docs/` 更新

## 🆘 トラブルシューティング

### よくある問題
1. **環境変数エラー**: `npm run verify-env` で確認
2. **認証問題**: Supabase設定を `docs/NEW_AUTH_DESIGN.md` で確認
3. **テスト失敗**: `docs/testing.md` のガイドライン確認

### サポート
- **Issues**: GitHub Issues で報告
- **緊急時**: `flaky-test` ラベルで優先対応
- **ドキュメント**: `docs/` ディレクトリ参照

## 📄 ライセンス

MIT License - 詳細は [LICENSE](./LICENSE) ファイルを参照

## 🔗 関連リンク

- [本番サイト](https://huyou-wakarundesu.vercel.app)
- [ステージング](https://huyou-wakarundesu-git-main.vercel.app)
- [カバレッジレポート](./coverage/lcov-report/index.html)
- [GitHub Actions](https://github.com/JunP1ayer/huyou-wakarundesu/actions)

---

最終更新: 2025-01-14