# Design System React Playbook

デザインシステムの学習と、React コンポーネントへの落とし込み方をまとめたプレイブックプロジェクト。

## 開発環境

本プロジェクトでは以下のツールを使用しています。

| ツール | 説明 |
| --- | --- |
| [pnpm](https://pnpm.io/) | パッケージマネージャー（モノレポ対応・catalog によるバージョン統一） |
| [Biome](https://biomejs.dev/) | リンター・フォーマッター |
| [Vite](https://vite.dev/) | コンポーネントライブラリのビルド（Library Mode） |
| [Vanilla Extract](https://vanilla-extract.style/) | TypeScript による型安全なゼロランタイム CSS |
| [Storybook](https://storybook.js.org/) | コンポーネント開発・ビジュアルドキュメント |
| [Astro Starlight](https://starlight.astro.build/) | ドキュメントサイト |
| [Vitest](https://vitest.dev/) | テストフレームワーク（React Testing Library と併用） |

## ディレクトリ構成

```text
├── packages/
│   ├── ui/              # コアコンポーネントライブラリ
│   │   └── src/
│   │       ├── tokens/      # デザイントークン（Vanilla Extract）
│   │       └── components/  # React コンポーネント
│   ├── storybook/       # Storybook（コンポーネント開発環境）
│   ├── docs/            # Astro Starlight ドキュメントサイト
│   └── tsconfig/        # 共有 TypeScript 設定
├── docs/                # アーキテクチャ設計ドキュメント
├── biome.json
├── pnpm-workspace.yaml
└── package.json
```

## ワークスペース

| パッケージ | 名前 | 説明 |
|---|---|---|
| `packages/ui` | `@playbook/ui` | React コンポーネントライブラリ本体。Vanilla Extract によるスタイル定義、デザイントークン、テストを含む |
| `packages/storybook` | `@playbook/storybook` | Storybook。`packages/ui` 内のストーリーファイルを参照してコンポーネントを表示 |
| `packages/docs` | `@playbook/docs` | Astro Starlight ドキュメントサイト。デザインシステムの学習コンテンツを MDX で管理 |
| `packages/tsconfig` | `@playbook/tsconfig` | 共有 TypeScript 設定。各パッケージから `extends` で参照 |

## セットアップ

```bash
pnpm install
```

## 使用方法

### 開発サーバー

```bash
# Storybook の起動（port 6006）
pnpm dev

# ドキュメントサイトの起動
pnpm dev:docs
```

### ビルド

```bash
# 全パッケージのビルド
pnpm build

# UI ライブラリのみビルド
pnpm build:ui

# ドキュメントサイトのみビルド
pnpm build:docs
```

### リント・テスト

```bash
# Biome によるリント
pnpm lint

# Biome による自動修正
pnpm lint:fix

# テスト実行
pnpm test
```
