# 扶養わかるんです - Turborepo Monorepo

[![CI](https://github.com/[your-username]/huyou-wakarundesu/workflows/CI/badge.svg)](https://github.com/[your-username]/huyou-wakarundesu/actions)

## 🏗️ Monorepo 構成

```
/
├── apps/
│   ├── huyou/            # 既存の扶養判定アプリ
│   └── fuyou/            # 新しいMVP (扶養わかるんです)
├── packages/
│   └── ui/               # 共通UIコンポーネント
├── .github/workflows/    # CI/CD設定
└── turbo.json           # Turborepo設定
```

## 🚀 開発環境のセットアップ

### 必要な環境
- Node.js 18.20.0以上
- pnpm 8.0.0以上

### ローカル開発

```bash
# 依存関係のインストール
pnpm install

# 全アプリの開発サーバー起動
pnpm dev

# 特定のアプリのみ起動
pnpm --filter @app/huyou dev
pnpm --filter @app/fuyou dev
```

### ビルド・テスト

```bash
# 全アプリのビルド
pnpm build

# リント実行
pnpm lint

# テスト実行
pnpm test

# 特定のアプリのみ
pnpm --filter @app/huyou build
pnpm --filter @app/fuyou test
```

## 📦 アプリケーション

### Apps/Huyou
既存の扶養判定アプリケーション
- Supabase認証
- 動的閾値管理
- ダッシュボード機能

### Apps/Fuyou  
新しいMVP - 扶養わかるんです v0.1
- 3問で扶養区分判定
- Moneytree LINK モック連携
- シンプルなユーザーフロー

## 🔧 CI/CD

### GitHub Actions
- **Pull Request**: lint, test, build, preview deploy
- **Main Branch**: production deploy

### Vercel デプロイ
- **Huyou**: 本番アプリ
- **Fuyou**: MVP環境

環境変数設定:
```
VERCEL_TOKEN=<your-vercel-token>
VERCEL_ORG_ID=<your-org-id>
VERCEL_PROJECT_ID_HUYOU=<huyou-project-id>
VERCEL_PROJECT_ID_FUYOU=<fuyou-project-id>
```

## 🎯 Turborepo コマンド

```bash
# 全タスク並列実行
pnpm turbo run build lint test --parallel

# キャッシュ情報表示
pnpm turbo run build --dry-run

# 特定のアプリに依存するタスクのみ
pnpm turbo run build --filter=@app/huyou

# 変更があったアプリのみ
pnpm turbo run test --filter=[HEAD^1]
```

## 📋 開発ルール

1. **コミット前**: `pnpm lint && pnpm test`
2. **パッケージ追加**: workspace rootで `pnpm add -w <package>`
3. **アプリ固有の依存関係**: 各アプリディレクトリで実行
4. **共通UI**: `packages/ui` を更新し、両アプリで利用

## 🔗 リンク

- [Turborepo公式ドキュメント](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Vercel Monorepo](https://vercel.com/docs/concepts/git/monorepos)

## 🚨 注意事項

- Node.js 18.20.0以上が必要（一部パッケージの要件）
- `pnpm install`は必ずルートディレクトリで実行
- 各アプリの環境変数は個別に設定
- キャッシュが問題の場合は `pnpm turbo run build --force`