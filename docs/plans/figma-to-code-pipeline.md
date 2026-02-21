# Figma → コード生成パイプライン

## Context

[MUI Figma テンプレート](https://www.figma.com/community/file/912837788133317724/material-ui-for-figma-and-mui-x) をデザインシステムのソースオブトゥルースとし、Figma 上のデザインデータ（Variables、コンポーネント）から自動的にコードを生成するパイプラインを構築する。

MUI Figma テンプレートのコンポーネントは MUI の React API と 1:1 で対応しているため、**MUI 標準コンポーネントは LLM 不要で機械的に生成**できる。カスタムコンポーネント（MUI にないもの）のみ Claude による LLM 支援を使う。

**ワークフロー**:

1. デザイナーが MUI Figma テンプレート上でデザインシステムを構築
2. Figma MCP ツール（Interactive モード）または REST API（Automated モード）でデザインデータを読み取り
3. MUI 標準コンポーネントは機械的に生成、カスタムコンポーネントは Claude が生成

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
│   │   ├── tokens.ts              # FigmaVariable[] → MUI createTheme 構造
│   │   └── component-classifier.ts # MUI 標準 or カスタムコンポーネントの判定
│   ├── renderers/
│   │   ├── theme-renderer.ts      # createTheme() オブジェクト全体を出力
│   │   ├── theme-overrides-renderer.ts  # components.MuiXxx.styleOverrides を出力
│   │   ├── mui-reexport-renderer.ts     # MUI re-export コンポーネント生成（機械的）
│   │   ├── custom-component-renderer.ts # tss-react カスタムコンポーネント（LLM 支援）
│   │   ├── story-renderer.ts      # Storybook ストーリーを出力
│   │   ├── test-renderer.ts       # Vitest テストを出力
│   │   └── doc-renderer.ts        # Starlight MDX を出力
│   ├── templates/                 # TypeScript テンプレートリテラル
│   │   ├── mui-component.ts       # MUI re-export テンプレート
│   │   ├── custom-component.ts    # tss-react カスタムコンポーネントテンプレート
│   │   ├── theme-override.ts      # styleOverrides エントリテンプレート
│   │   ├── story.ts               # Storybook ストーリーテンプレート
│   │   ├── test.ts                # Vitest テストテンプレート
│   │   ├── barrel-export.ts       # index.ts テンプレート
│   │   └── mdx-doc.ts             # Starlight MDX テンプレート
│   ├── utils/
│   │   ├── color.ts               # RGBA float → hex 変換、コントラスト比計算
│   │   ├── naming.ts              # PascalCase / camelCase 変換
│   │   └── mui-mapping.ts         # MUI コンポーネント名 ↔ Figma ノード名 ↔ import パスの対応表
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
    "yaml": "^2.4.0",
    "commander": "^12.0.0",
    "chalk": "^5.3.0"
  }
}
```

**Note**: MUI や React には依存しない。コードは**文字列として生成**する。

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

1. 変数名の `/` でパス分割 → MUI テーマ構造にマッピング (`color/primary/main` → `palette.primary.main`)
2. COLOR 型: RGBA float (0-1) → hex 文字列 (`{r:0.231, g:0.510, b:0.965}` → `"#3b82f6"`)
3. FLOAT 型: 数値 → テーマ設定値 (spacing base unit, borderRadius 等)
4. 全トークンを単一の `createTheme()` オブジェクトに統合

**出力先 & 既存パターン**:

- [packages/ui/src/tokens/theme.ts](packages/ui/src/tokens/theme.ts) — 単一ファイルに `createTheme()` として統合

```typescript
import { createTheme } from "@mui/material/styles";

const primaryScale = { 50: "#eff6ff", ..., 900: "#1e3a8a" };
const neutralScale = { 50: "#fafafa", ..., 900: "#171717" };

export const theme = createTheme({
  palette: {
    primary: { main: primaryScale[600], light: primaryScale[400], dark: primaryScale[800], ...primaryScale },
    grey: neutralScale,
    success: { main: "#16a34a" },
    warning: { main: "#d97706" },
    error: { main: "#dc2626" },
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontWeightMedium: 500,
    fontWeightBold: 700,
  },
  spacing: 4,
  shape: { borderRadius: 6 },
  components: {
    MuiButton: { /* ... styleOverrides */ },
  },
});
```

### 2. コンポーネント変換（2パス）

#### パス A: MUI 標準コンポーネント（LLM 不要、機械的）

MUI Figma テンプレートの Variant 名が MUI props と 1:1 対応するため、変換処理自体が不要:

```text
Figma: Button (Variant=Contained, Size=Medium, Color=Primary)
  ↓ そのまま対応（変換不要）
<Button variant="contained" size="medium" color="primary" />
```

`component-classifier.ts` で `mui-mapping.ts` の対応表を参照し、MUI 標準コンポーネントかどうかを判定。

**生成ファイル一覧（5ファイル + theme.ts 更新）**:

| ファイル | パターン参照元 |
|---|---|
| `{Name}.tsx` | [Button.tsx](packages/ui/src/components/Button/Button.tsx) — MUI re-export（2行） |
| `{Name}.stories.tsx` | [Button.stories.tsx](packages/ui/src/components/Button/Button.stories.tsx) — `Meta`, `StoryObj`, `tags: ["autodocs"]`, MUI props ベースの argTypes |
| `{Name}.test.tsx` | [Button.test.tsx](packages/ui/src/components/Button/Button.test.tsx) — `vitest`, `@testing-library/react`, `renderWithTheme` ヘルパー |
| `index.ts` | [index.ts](packages/ui/src/components/Button/index.ts) — barrel export |
| `{name}.mdx` | [button.mdx](packages/docs/src/content/docs/components/button.mdx) — 日本語、MUI ベースの実装説明 |

加えて [theme.ts](packages/ui/src/tokens/theme.ts) の `components` セクションに `MuiXxx.styleOverrides` エントリを追加。

**テンプレート例** — `{Name}.tsx`:

```typescript
export type { ${Name}Props } from "@mui/material/${Name}";
export { default as ${Name} } from "@mui/material/${Name}";
```

**テンプレート例** — `{Name}.test.tsx`:

```typescript
import { ThemeProvider } from "@mui/material/styles";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { theme } from "../../tokens";
import { ${Name} } from "./${Name}";

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe("${Name}", () => {
  it("renders correctly", () => {
    renderWithTheme(<${Name}>Test</${Name}>);
    // ...
  });
});
```

#### パス B: カスタムコンポーネント（LLM 支援）

MUI にないコンポーネントのみ tss-react で独自実装。

**データ収集** (MCP ツール):

- `get_metadata` → コンポーネントセット構造（バリアント一覧）
- `get_design_context` → デザイン情報・コード表現
- `get_variable_defs` → 参照されているトークン
- `get_screenshot` → 視覚的リファレンス

Claude に上記データ + `design-principles.yaml` を渡してコード生成。

**生成ファイル一覧（5ファイル）**:

| ファイル | 内容 |
|---|---|
| `{Name}.tsx` | tss-react の `makeStyles` でスタイリングした React コンポーネント |
| `{Name}.stories.tsx` | カスタム props ベースの argTypes |
| `{Name}.test.tsx` | `renderWithTheme` パターン |
| `index.ts` | barrel export |
| `{name}.mdx` | 日本語ドキュメント |

## 2 つの実行モード

### Interactive モード（Claude Code + MCP）

ユーザーが Claude Code で Figma URL を渡すと、Claude が MCP ツールで読み取り → コード生成:

```text
User: "この Figma からトークンを同期して: https://figma.com/design/ABC123/DS?node-id=1:0"
Claude:
  1. get_variable_defs(fileKey="ABC123", nodeId="1:0") を呼び出し
  2. mcp-parser.ts のロジックで FigmaVariable[] にパース
  3. theme-renderer.ts で createTheme() コードを生成
  4. packages/ui/src/tokens/theme.ts に書き込み
```

### Automated モード（CLI）

```bash
# トークン同期（LLM 不要、決定的）
pnpm ds-gen sync-tokens --figma-token=$FIGMA_TOKEN

# コンポーネント同期
# MUI 標準: 機械的生成（LLM 不要）
# カスタム: Claude API で生成
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
  muiStandard:
    pattern: "reexport"
    styleCustomization: "theme.components.MuiXxx.styleOverrides"
  custom:
    pattern: "tss-react makeStyles"
    spreadNativeProps: true
styling:
  framework: "mui"
  themeSystem: "createTheme"
  customStyling: "tss-react"
  tokenReference: "Always reference theme tokens via useTheme or sx prop"
documentation:
  language: "ja"
testing:
  wrapper: "ThemeProvider"
  helper: "renderWithTheme"
```

## 差分更新（インクリメンタル同期）

1. 同期成功後に `.figma-snapshot.json` を保存（変数 ID、名前、値のハッシュ）
2. 次回同期時に前回のスナップショットと比較
3. **トークン**: 追加/変更/削除を検出 → `theme.ts` の該当箇所のみ更新
4. **コンポーネント**: `// @ds-gen:preserve` コメントで手動編集部分を保護
5. **削除**: 自動削除はしない → 警告のみ

## Code Connect 連携

コンポーネント生成後、Figma Dev Mode でコードスニペットを表示するための Code Connect マッピングを設定:

- Interactive モード: `add_code_connect_map` MCP ツールで登録
- Automated モード: `.figma.tsx` ファイルを生成 → `figma connect publish` で公開

## 既存ファイルへの変更

| ファイル | 変更内容 |
|---|---|
| [package.json](package.json) | `ds-gen` スクリプト追加 |
| [tsconfig.json](tsconfig.json) | `references` に ds-generator 追加 |
| `.gitignore` | `.env`, `output/`, `.figma-snapshot.json` 追加 |
| [packages/ui/src/tokens/theme.ts](packages/ui/src/tokens/theme.ts) | `components` セクションに新コンポーネントの styleOverrides 追加 |
| [packages/ui/src/index.ts](packages/ui/src/index.ts) | 新コンポーネントの barrel export 追加 |
| [astro.config.mjs](packages/docs/astro.config.mjs) | 新コンポーネントの sidebar エントリ追加 |

## 実装順序

1. **Foundation**: パッケージ作成、型定義、ユーティリティ（color.ts, naming.ts, mui-mapping.ts）
2. **Token Pipeline**: パーサー → トランスフォーマー → theme-renderer → テスト
3. **Component Pipeline**: component-classifier → mui-reexport-renderer → テンプレート → design-principles.yaml
4. **Custom Component Pipeline**: custom-component-renderer → tss-react テンプレート
5. **CLI**: figma-client.ts → コマンド実装 → config ファイル
6. **差分更新**: スナップショット → 比較 → マージ戦略
7. **Code Connect**: マッパー → .figma.tsx 生成

## 検証方法

1. **トークン**: 生成された `theme.ts` で `pnpm build:ui` が通ること
2. **コンポーネント**: `pnpm test` でテストが通ること
3. **Storybook**: `pnpm dev` でストーリーが表示されること
4. **ドキュメント**: `pnpm build:docs` で MDX ページがビルドされること
5. **フォーマット**: `pnpm lint` (Biome) でエラーがないこと
6. **Figma 連携**: MUI Figma テンプレートで MCP ツール → コード生成の E2E テスト
