# Figma → コード生成パイプライン

## Context

Figma をデザインシステムのソースオブトゥルースとし、Figma 上のデザインデータ（Variables、コンポーネント）から Claude が自動的にコードを生成するパイプラインを構築する。

**ワークフロー**:

1. Figma AI / デザイナーが Figma 上にデザインシステムを構築
2. Claude が Figma MCP ツールでデザインデータを読み取り
3. 既存コードパターンに合わせて全コード（トークン・コンポーネント・テスト・ドキュメント）を生成

## 新パッケージ: `packages/ds-generator`

変換ロジック・テンプレート・CLI を格納するライブラリパッケージ。

### ディレクトリ構成

```text
packages/ds-generator/
├── package.json
├── tsconfig.json
├── ds-generator.config.yaml       # Figma ファイルキー、出力先パスの設定
├── design-principles.yaml         # デザイン原則（命名規則、a11y ルール等）
├── src/
│   ├── index.ts                   # Public API
│   ├── parsers/
│   │   ├── types.ts               # FigmaVariable, FigmaComponentData 等の型定義
│   │   ├── mcp-parser.ts          # MCP ツール出力のパーサー（Interactive モード用）
│   │   └── rest-api-parser.ts     # Figma REST API レスポンスのパーサー（CLI モード用）
│   ├── transformers/
│   │   └── tokens.ts              # FigmaVariable[] → TokenGroup[] → コード文字列
│   ├── renderers/
│   │   ├── token-renderer.ts      # createGlobalTheme コードを出力
│   │   ├── component-renderer.ts  # React コンポーネントコードを出力
│   │   ├── css-renderer.ts        # recipe() コードを出力
│   │   ├── story-renderer.ts      # Storybook ストーリーを出力
│   │   ├── test-renderer.ts       # Vitest テストを出力
│   │   └── doc-renderer.ts        # Starlight MDX を出力
│   ├── templates/                 # Handlebars テンプレート
│   │   ├── token.css.ts.hbs
│   │   ├── component.tsx.hbs
│   │   ├── component.css.ts.hbs
│   │   ├── component.stories.tsx.hbs
│   │   ├── component.test.tsx.hbs
│   │   └── component.mdx.hbs
│   ├── utils/
│   │   ├── color.ts               # RGBA float → hex 変換、コントラスト比計算
│   │   └── naming.ts              # PascalCase / camelCase 変換
│   ├── diff/
│   │   ├── snapshot.ts            # Figma 状態のスナップショット保存・読み込み
│   │   └── comparator.ts          # 前回との差分検出
│   └── cli/
│       ├── index.ts               # Commander CLI エントリポイント
│       ├── figma-client.ts        # Figma REST API クライアント
│       └── commands/
│           ├── sync-tokens.ts
│           ├── sync-components.ts
│           └── diff.ts
└── __tests__/
```

### 依存パッケージ

```json
{
  "dependencies": {
    "handlebars": "^4.7.0",
    "yaml": "^2.4.0",
    "commander": "^12.0.0",
    "chalk": "^5.3.0"
  }
}
```

**Note**: `@vanilla-extract/css` や React には依存しない。コードは**文字列として生成**する。

## 核心: Figma データ → コード変換

### 1. トークン変換（決定的・LLM 不要）

**MCP `get_variable_defs` の出力例**:

```text
{'primary/50': '#eff6ff', 'primary/500': '#3b82f6', 'spacing/4': 16, ...}
```

**REST API の出力例** (`GET /v1/files/:file_key/variables/local`):

```json
{
  "variables": {
    "VariableID:1:1": {
      "name": "primary/500",
      "resolvedType": "COLOR",
      "valuesByMode": { "1:0": {"r": 0.231, "g": 0.510, "b": 0.965, "a": 1} }
    }
  }
}
```

**変換ステップ**:

1. 変数名の `/` でパス分割 → ネストされたオブジェクトに変換 (`primary/500` → `{ primary: { 500: ... } }`)
2. COLOR 型: RGBA float (0-1) → hex 文字列 (`{r:0.231, g:0.510, b:0.965}` → `"#3b82f6"`)
3. FLOAT 型: 数値 → px 文字列 (`16` → `"16px"`)
4. コレクション名で分類 → 別々のトークンファイルに出力

**出力先 & 既存パターン**:

- [colors.css.ts](packages/ui/src/tokens/colors.css.ts) — `createGlobalTheme(":root", { primary: { 50: "#eff6ff", ... } })`
- [spacing.css.ts](packages/ui/src/tokens/spacing.css.ts) — `createGlobalTheme(":root", { 0: "0", 1: "4px", ... })`
- [typography.css.ts](packages/ui/src/tokens/typography.css.ts) — `createGlobalTheme(":root", { fontFamily: {...}, fontSize: {...}, ... })`

### 2. コンポーネント変換（LLM 支援）

トークンと異なり、コンポーネントは Figma の視覚構造 → React コンポーネント API の意味的な変換が必要なため、Claude を使う。

**データ収集** (MCP ツール):

- `get_metadata` → コンポーネントセット構造（バリアント一覧）
- `get_design_context` → デザイン情報・コード表現
- `get_variable_defs` → 参照されているトークン
- `get_screenshot` → 視覚的リファレンス

**生成ファイル一覧**（各コンポーネントにつき 6 ファイル）:

| ファイル             | パターン参照元                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------- |
| `{Name}.tsx`         | [Button.tsx](packages/ui/src/components/Button/Button.tsx) — `ComponentPropsWithRef`, `Omit<..., "className">` |
| `{Name}.css.ts`      | [Button.css.ts](packages/ui/src/components/Button/Button.css.ts) — `recipe({ base, variants, defaultVariants })` |
| `{Name}.stories.tsx` | [Button.stories.tsx](packages/ui/src/components/Button/Button.stories.tsx) — `Meta`, `StoryObj`, `tags: ["autodocs"]` |
| `{Name}.test.tsx`    | [Button.test.tsx](packages/ui/src/components/Button/Button.test.tsx) — `vitest`, `@testing-library/react`     |
| `index.ts`           | [index.ts](packages/ui/src/components/Button/index.ts) — barrel export                                       |
| `{name}.mdx`         | [button.mdx](packages/docs/src/content/docs/components/button.mdx) — 日本語、セクション順序固定              |

**Figma バリアントの対応**:

```text
Figma: Variant=Primary, Size=Medium
  ↓
Code:  variant: "primary" | "secondary" | "ghost"
       size: "sm" | "md" | "lg"
```

## 2 つの実行モード

### Interactive モード（Claude Code + MCP）

ユーザーが Claude Code で Figma URL を渡すと、Claude が MCP ツールで読み取り → コード生成:

```text
User: "この Figma からトークンを同期して: https://figma.com/design/ABC123/DS?node-id=1:0"
Claude:
  1. get_variable_defs(fileKey="ABC123", nodeId="1:0") を呼び出し
  2. mcp-parser.ts のロジックで FigmaVariable[] にパース
  3. token-renderer.ts で createGlobalTheme コードを生成
  4. packages/ui/src/tokens/ に書き込み
```

### Automated モード（CLI）

```bash
# トークン同期（LLM 不要、決定的）
pnpm ds-gen sync-tokens --figma-token=$FIGMA_TOKEN

# コンポーネント同期（Claude API で生成）
pnpm ds-gen sync-components --figma-token=$FIGMA_TOKEN --claude-token=$ANTHROPIC_API_KEY

# 差分プレビュー（書き込みなし）
pnpm ds-gen diff --figma-token=$FIGMA_TOKEN
```

## デザイン原則の役割

`design-principles.yaml` は Claude のコード生成時にコンテキストとして注入:

```yaml
naming:
  components:
    convention: PascalCase
  props:
    convention: camelCase
accessibility:
  minimumContrastRatio: 4.5
  requireFocusVisible: true
  preferSemanticHTML: true
api:
  propsPattern: "ComponentPropsWithRef"
  omitClassName: true
  spreadNativeProps: true
styling:
  framework: "vanilla-extract"
  pattern: "recipe"
  tokenReference: "Always reference tokens, never hardcode values"
documentation:
  language: "ja"
```

## 差分更新（インクリメンタル同期）

1. 同期成功後に `.figma-snapshot.json` を保存（変数 ID、名前、値のハッシュ）
2. 次回同期時に前回のスナップショットと比較
3. **トークン**: 追加/変更/削除を検出 → ファイルの該当箇所のみ更新
4. **コンポーネント**: `// @ds-gen:preserve` コメントで手動編集部分を保護
5. **削除**: 自動削除はしない → 警告のみ

## Code Connect 連携

コンポーネント生成後、Figma Dev Mode でコードスニペットを表示するための Code Connect マッピングを設定:

- Interactive モード: `add_code_connect_map` MCP ツールで登録
- Automated モード: `.figma.tsx` ファイルを生成 → `figma connect publish` で公開

## 既存ファイルへの変更

| ファイル                                                     | 変更内容                                   |
| ------------------------------------------------------------ | ------------------------------------------ |
| [package.json](package.json)                                 | `ds-gen` スクリプト追加                    |
| [tsconfig.json](tsconfig.json)                               | `references` に ds-generator 追加          |
| `.gitignore`                                                 | `.env`, `output/`, `.figma-snapshot.json` 追加 |
| [packages/ui/src/index.ts](packages/ui/src/index.ts)         | 新コンポーネントの barrel export 追加      |
| [astro.config.mjs](packages/docs/astro.config.mjs)           | 新コンポーネントの sidebar エントリ追加    |

## 実装順序

1. **Foundation**: パッケージ作成、型定義、ユーティリティ（color.ts, naming.ts）
2. **Token Pipeline**: パーサー → トランスフォーマー → レンダラー → テスト
3. **Component Pipeline**: テンプレート作成 → レンダラー → design-principles.yaml
4. **CLI**: figma-client.ts → コマンド実装 → config ファイル
5. **差分更新**: スナップショット → 比較 → マージ戦略
6. **Code Connect**: マッパー → .figma.tsx 生成

## 検証方法

1. **トークン**: 生成された `.css.ts` が `pnpm build:ui` を通ること
2. **コンポーネント**: `pnpm test` でテストが通ること
3. **Storybook**: `pnpm dev` でストーリーが表示されること
4. **ドキュメント**: `pnpm build:docs` で MDX ページがビルドされること
5. **フォーマット**: `pnpm lint` (Biome) でエラーがないこと
6. **Figma 連携**: 実際の Figma ファイルで MCP ツール → コード生成の E2E テスト
