# MUI + tss-react 移行 & デザインシステム構築計画

## Context

技術スタックを Vanilla Extract から **MUI + tss-react** に変更し、[MUI Figma テンプレート](https://www.figma.com/community/file/912837788133317724/material-ui-for-figma-and-mui-x) をデザインのソースオブトゥルースとして Figma → コード生成パイプラインを構築する。

MUI Figma テンプレートのコンポーネントは MUI の React API と 1:1 で対応しているため、Figma のバリアントがそのまま MUI のコンポーネント props にマッピングできる。

## Part 1: 技術スタック移行

### Phase 1: 依存パッケージの入れ替え

**pnpm-workspace.yaml** — catalog に追加:

```yaml
"@mui/material": ^7.3.8
"@emotion/react": ^11.14.0
"@emotion/styled": ^11.14.1
tss-react: ^4.9.20
```

**packages/ui/package.json**:
- 削除: `@vanilla-extract/css`, `@vanilla-extract/recipes`, `@vanilla-extract/vite-plugin`
- 追加: `@mui/material`, `tss-react` (dependencies), `@emotion/react`, `@emotion/styled` (peerDependencies)
- `exports` から `"./styles.css"` を削除、`"./theme"` を追加

**packages/storybook/package.json**:
- 削除: `@vanilla-extract/vite-plugin`
- 追加: `@storybook/addon-themes`, `@emotion/react`, `@emotion/styled`, `@mui/material`

### Phase 2: トークン → MUI テーマ移行

以下の 3 ファイルを**削除**:
- [colors.css.ts](packages/ui/src/tokens/colors.css.ts)
- [spacing.css.ts](packages/ui/src/tokens/spacing.css.ts)
- [typography.css.ts](packages/ui/src/tokens/typography.css.ts)

以下の 2 ファイルを**新規作成**:

**`packages/ui/src/tokens/theme.ts`** — 既存トークン値を `createTheme` に統合:

```typescript
import { createTheme } from "@mui/material/styles";

const primaryScale = { 50: "#eff6ff", /* ... */ 900: "#1e3a8a" };
const neutralScale = { 50: "#fafafa", /* ... */ 900: "#171717" };

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
  spacing: 4,  // base 4px
  shape: { borderRadius: 6 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 500 },
        sizeSmall: { height: "32px" },
        sizeMedium: { height: "40px" },
        sizeLarge: { height: "48px" },
      },
    },
  },
});
```

**`packages/ui/src/tokens/theme.d.ts`** — PaletteColor に 50-900 スケールを拡張

**[packages/ui/src/tokens/index.ts](packages/ui/src/tokens/index.ts)** — `export { theme } from "./theme"` に変更

### Phase 3: コンポーネント移行

**方針**: MUI ネイティブ API をそのまま採用する。独自のラッパー層は設けず、MUI Button を直接 re-export + テーマカスタマイズで対応する。Figma テンプレートのバリアント名と完全一致するため、Figma → コード変換が機械的になる。

**[Button.css.ts](packages/ui/src/components/Button/Button.css.ts)** を**削除**

**[Button.tsx](packages/ui/src/components/Button/Button.tsx)** を MUI Button の re-export に書き換え:

```typescript
export { default as Button } from "@mui/material/Button";
export type { ButtonProps } from "@mui/material/Button";
```

ボタンの見た目カスタマイズは Phase 2 の `theme.ts` 内の `components.MuiButton.styleOverrides` で行う（コンポーネントファイルではなくテーマに集約）。

**API の変更点**:

| 変更前 (独自) | 変更後 (MUI ネイティブ) |
|---|---|
| `variant="primary"` | `variant="contained"` |
| `variant="secondary"` | `variant="outlined"` |
| `variant="ghost"` | `variant="text"` |
| `size="sm"` | `size="small"` |
| `size="md"` | `size="medium"` |
| `size="lg"` | `size="large"` |
| — | `color="primary"/"secondary"/"error"/...` (新規) |

**PlaybookProvider** を新規作成 (`packages/ui/src/providers/PlaybookProvider.tsx`):

```typescript
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "../tokens";

export function PlaybookProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
```

**[packages/ui/src/index.ts](packages/ui/src/index.ts)** — `PlaybookProvider` と `theme` の export を追加

**[Button.test.tsx](packages/ui/src/components/Button/Button.test.tsx)** — `ThemeProvider` ラッパー追加、`vitest.setup.ts` に `window.matchMedia` モック追加

### Phase 4: ビルド設定

**[packages/ui/vite.config.ts](packages/ui/vite.config.ts)**:
- `vanillaExtractPlugin` を削除
- `rollupOptions.external` に MUI / Emotion パッケージを追加
- entry に `theme` を追加

**[packages/ui/vitest.config.ts](packages/ui/vitest.config.ts)**: `vanillaExtractPlugin` を削除

**[packages/storybook/.storybook/main.ts](packages/storybook/.storybook/main.ts)**:
- `vanillaExtractPlugin` と `viteFinal` を削除
- addons に `@storybook/addon-themes` を追加

**[packages/storybook/.storybook/preview.ts](packages/storybook/.storybook/preview.ts)**:
- `withThemeFromJSXProvider` デコレータを追加（ThemeProvider + CssBaseline）

### Phase 5: ドキュメント更新

| ファイル | 変更内容 |
|---|---|
| [docs/architecture.md](docs/architecture.md) | 技術スタック表を MUI + tss-react に更新 |
| [design-tokens.mdx](packages/docs/src/content/docs/getting-started/design-tokens.mdx) | `createGlobalTheme` → `createTheme` のコード例に差し替え |
| [introduction.mdx](packages/docs/src/content/docs/getting-started/introduction.mdx) | MUI ベースである旨を追記 |
| [button.mdx](packages/docs/src/content/docs/components/button.mdx) | `recipe()` → MUI Button ラッパーの実装例に差し替え |
| [component-api-design.mdx](packages/docs/src/content/docs/patterns/component-api-design.mdx) | スタイル分離パターンを MUI テーマオーバーライドに更新 |

### ファイル操作サマリ

| 操作 | ファイル数 | 対象 |
|---|---|---|
| 削除 | 4 | colors.css.ts, spacing.css.ts, typography.css.ts, Button.css.ts |
| 新規作成 | 4 | theme.ts, theme.d.ts, PlaybookProvider.tsx, providers/index.ts |
| 修正 | 17 | package.json x3, config x4, component x2, test x1, docs x5, index.ts x2 |

---

## Part 2: Figma → コード生成パイプライン（更新版）

MUI Figma テンプレートにより、パイプラインが大幅に簡素化される。

### トークン同期（決定的・LLM 不要）

```text
Figma Variables (MUI テンプレート)
  ↓ get_variable_defs (MCP)
  ↓ パース: primary/main → palette.primary.main
  ↓
createTheme({ palette: {...}, typography: {...}, spacing: ... })
```

MUI Figma テンプレートの Variables は MUI の `createTheme` 構造に直接対応:
- `color/primary/main` → `palette.primary.main`
- `space/8` → `spacing` の基本単位
- Typography styles → `typography` variants

### コンポーネント同期（MUI 標準は LLM 不要）

MUI ネイティブ API をそのまま採用しているため、Figma テンプレートのコンポーネントは完全に機械的にマッピング可能:

```text
Figma Component: Button (Variant=Contained, Size=Medium, Color=Primary)
  ↓ そのまま props に対応（変換不要）
<Button variant="contained" size="medium" color="primary" />
```

MUI Figma テンプレートの全コンポーネントで同様の 1:1 対応が成立する。

**LLM が必要なケース**: MUI にない独自コンポーネントのみ → tss-react でカスタムスタイリング

### `ds-generator` レンダラーの変更

| レンダラー | 変更前 (Vanilla Extract) | 変更後 (MUI) |
|---|---|---|
| token-renderer | `createGlobalTheme(":root", {...})` | `createTheme({palette: {...}})` |
| css-renderer | `recipe({base, variants})` | `components.MuiXxx.styleOverrides` |
| component-renderer | `<button className={recipe(...)}>` | MUI コンポーネント re-export（ラッパー不要） |

---

## 検証方法

```bash
pnpm clean && pnpm install  # 依存解決
pnpm build                   # 全パッケージビルド
pnpm test                    # Button テスト通過
pnpm dev                     # Storybook でボタン表示確認
pnpm lint                    # Biome チェック通過
pnpm build:docs              # ドキュメントビルド
```
