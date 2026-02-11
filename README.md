# Design System React Playbook

デザインシステムの学習と、React コンポーネントへの落とし込み方をまとめたプレイブックプロジェクト。

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| パッケージマネージャ | pnpm（workspaces + catalog） |
| 言語 | TypeScript |
| リンター / フォーマッター | Biome |
| コンポーネントビルド | Vite（Library Mode） |
| CSS | Vanilla Extract |
| コンポーネント開発 | Storybook |
| ドキュメント | Astro Starlight |
| テスト | Vitest + React Testing Library |

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

## コマンド

```bash
# 依存パッケージのインストール
pnpm install

# Storybook の起動（port 6006）
pnpm dev

# ドキュメントサイトの起動
pnpm dev:docs

# 全パッケージのビルド
pnpm build

# UI ライブラリのみビルド
pnpm build:ui

# ドキュメントサイトのみビルド
pnpm build:docs

# Biome によるリント
pnpm lint

# Biome による自動修正
pnpm lint:fix

# テスト実行
pnpm test
```
