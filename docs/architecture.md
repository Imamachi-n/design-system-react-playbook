# Architecture - Design System React Playbook

## Context

デザインシステムの学習と、React コンポーネントへの落とし込み方をまとめるプレイブックプロジェクト。

## 技術スタック

| カテゴリ | 選定技術 | 選定理由 |
|---|---|---|
| パッケージマネージャ | pnpm (workspaces + catalog) | 高速・厳密な依存管理・catalog でバージョン統一 |
| 言語 | TypeScript | 型安全なコンポーネント API |
| リンター/フォーマッター | Biome | ESLint + Prettier を 1 ツールに統合・高速 |
| コンポーネントビルド | Vite (Library Mode) | Rollup ベース・柔軟な設定・Storybook と同じエコシステム |
| CSS | Vanilla Extract | TypeScript で型安全な CSS・ゼロランタイム・recipe でバリアント管理 |
| Storybook | Storybook 10 + @storybook/react-vite | コンポーネント開発・ビジュアルドキュメント・a11y チェック |
| ドキュメント | Astro Starlight | ドキュメント特化・高速・React コンポーネント埋め込み可能 |
| テスト | Vitest + React Testing Library | Vite ネイティブ・高速・Jest 互換 API |

## ワークスペース構成

```text
packages/
├── ui/            → @playbook/ui        (React コンポーネントライブラリ)
├── storybook/     → @playbook/storybook (Storybook 10)
├── docs/          → @playbook/docs      (Astro Starlight)
└── tsconfig/      → @playbook/tsconfig  (共有 TypeScript 設定)
```

### packages/ui
- コンポーネント + スタイル + ストーリー + テストをコロケーション
- Vite Library Mode で ESM + 型定義を出力
- デザイントークンは `createGlobalTheme` で CSS カスタムプロパティとして定義
- `@vanilla-extract/recipes` の `recipe` でバリアントを管理

### packages/storybook
- `packages/ui` 内の `*.stories.tsx` を参照
- `@vanilla-extract/vite-plugin` で Vanilla Extract をサポート
- `@storybook/addon-a11y` でアクセシビリティチェック

### packages/docs
- Astro Starlight + `docsLoader` で MDX コンテンツを管理
- `@astrojs/react` で React コンポーネントのライブプレビュー埋め込み

### packages/tsconfig
- `base.json`: 共通設定 (ES2022, strict, bundler moduleResolution)
- `react-library.json`: React ライブラリ向け (JSX, DOM lib)
- `astro.json`: Astro 向け

## 設計判断

### ストーリーのコロケーション
ストーリーファイルはコンポーネントの隣に配置（`Button.stories.tsx` ↔ `Button.tsx`）。
Storybook は別ワークスペース（`packages/storybook`）で、glob で参照。
→ コンポーネント開発時に関連ファイルが一箇所にまとまり、Storybook の設定依存は分離。

### CSS Modules ではなく Vanilla Extract
型安全な CSS 定義と `recipe` によるバリアント管理が、デザインシステムの学習テーマに合致。
CSS カスタムプロパティ経由のトークン管理も Vanilla Extract の強み。

### pnpm catalog
`react`, `typescript` 等の共通依存バージョンを `pnpm-workspace.yaml` の `catalog` で一元管理。
各 `package.json` では `"react": "catalog:"` と記述するだけ。

## npm scripts

| コマンド | 説明 |
|---|---|
| `pnpm dev` | Storybook 起動 (port 6006) |
| `pnpm dev:docs` | ドキュメントサイト起動 |
| `pnpm build` | 全パッケージビルド |
| `pnpm build:ui` | UI ライブラリのみビルド |
| `pnpm build:docs` | ドキュメントサイトのみビルド |
| `pnpm lint` | Biome による lint |
| `pnpm lint:fix` | Biome による自動修正 |
| `pnpm test` | UI ライブラリのテスト実行 |
