---
name: commit
description: ステージされた変更から Conventional Commits 形式のコミットを作成する
argument-hint: "[追加のコンテキスト]"
disable-model-invocation: true
allowed-tools: Bash(git *), Read, Grep, Glob
---

ステージされた変更を分析し、適切なコミットメッセージを作成してコミットしてください。

## 手順

1. `git status` で未追跡ファイルとステージ状態を確認
2. `git diff --cached` でステージされた変更内容を確認
3. `git log --oneline -5` で直近のコミットスタイルを確認
4. 変更内容を分析し、コミットメッセージを作成
5. コミットを実行し、`git status` で成功を確認

## コミットメッセージ規約

このプロジェクトは Conventional Commits 形式を採用しています。

### フォーマット

```
<type>: <subject>

<body (任意)>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

### type 一覧

| type | 用途 |
|---|---|
| `feat` | 新機能の追加 |
| `fix` | バグ修正 |
| `docs` | ドキュメントのみの変更 |
| `style` | コードの意味に影響しないフォーマット変更 |
| `refactor` | バグ修正でも新機能でもないコード変更 |
| `test` | テストの追加・修正 |
| `chore` | ビルドプロセスやツール設定の変更 |
| `ci` | CI 設定の変更 |

### ルール

- subject は命令形で書く（日本語の場合は体言止めも可）
- subject の先頭は小文字（英語の場合）
- subject の末尾にピリオドをつけない
- body は変更の「なぜ」を説明する（任意、複数行の変更がある場合に推奨）
- body は HEREDOC で渡してフォーマットを保持する
- `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>` を必ず末尾に付与

### コミットの注意事項

- `.env` やクレデンシャルなど機密ファイルはコミットしない
- ステージされた変更がない場合はコミットせず、ユーザーに報告する
- `git add -A` や `git add .` は使わない。具体的なファイル名で追加する
- pre-commit hook が失敗した場合は問題を修正して新しいコミットを作成する（`--amend` しない）

$ARGUMENTS
