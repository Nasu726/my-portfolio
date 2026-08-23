---
title: "Nasu Stack"
description: "「初心者は困らせない、ベテランは縛らない」React / Astro 向けのUIコンポーネント集。レイアウトと非同期の状態管理を最初から実装済みで提供し、shadcn 方式でコードごとコピーして使える。"
pubDate: 2026-08-20
tags: ["React", "Astro", "shadcn", "TypeScript", "UI"]
links:
  github: "https://github.com/Nasu726/Nasu-Stack"
  demo: "https://nasu726.github.io/Nasu-Stack/catalog/"
---

## Nasu Stack

「初心者は困らせない、ベテランは縛らない」を目標にした、React / Astro 向けのコンポーネント集とスターターテンプレートです。ノーコードのビジュアルビルダーと素のフレームワークの間、**コードは触れるけれど全部は組み立てられない層**を対象にしています。

見た目だけのコンポーネントは含みません。shadcn のブロック市場にすでに2500個以上あるためです。入っているのは**状態を持つコンポーネント**と**レイアウトコンポーネント**の2種類だけで、v1.0.0 時点で40個を個別配布しています。

- カタログ（実物が触れます）: [nasu726.github.io/Nasu-Stack/catalog/](https://nasu726.github.io/Nasu-Stack/catalog/)
- デモサイト（参考実装）: [nasu726.github.io/Nasu-Stack/demo/](https://nasu726.github.io/Nasu-Stack/demo/)

### 主なコンポーネント

- **状態を持つもの**: `ActionButton`（ローディング・エラー・二重送信防止）、`AsyncForm` + `Field`、`DataList` / `DataTable`、`AsyncSelect`、`FileDrop`、`Toast`、`ConfirmDialog`
- **レイアウト**: `PageBlock` / `Section` / `Stack` / `Inline` / `Columns` / `Tiles` / `Spread` / `Box`
- **フック**: `useAction` / `useResource` / `useInteractionGuard` / `useOptimisticList`
- **生成系**: `buildMeta`（SEO / JSON-LD）、`buildSitemap`、`buildRss`

### 設計思想

```
Theme     : tokens.css / themes.css
   ↓
Layout    : Stack / Columns / Tiles ...
   ↓
Component : ActionButton / AsyncForm ...
   ↓
Contract  : Action<TInput, TOutput>
```

すべては一つの契約に落ちます。

```ts
type Action<TInput, TOutput> = (
  input: TInput,
  ctx: { signal: AbortSignal }
) => Promise<TOutput>;
```

`Promise` を返す関数でありさえすればよいので、バックエンドを選びません。失敗はすべて `ActionError` に正規化されます。

そのほかの原則：

- **コンポーネントは外側の余白を持たない** — 余白はレイアウトコンポーネントだけが持つ
- **制約はデフォルトであって壁ではない** — 余白は9段階だが `space="13px"` も通る
- **乗り換えではなく「降りる」** — `ActionButton` → `Button` + `useAction()` → `useInteractionGuard()` → 素のReact
- **静かに縮退する** — `ActionProvider` が無ければ通知が消えるだけ、`ConfirmProvider` が無ければ `window.confirm` にフォールバック
- **JSを使わずに済むなら使わない** — モバイルメニューは `useState` ではなく `<details>`

### 責任境界

UIライブラリは「安全そうに見えるもの」を提供してしまうので、境界を [`docs/boundaries.ja.md`](https://github.com/Nasu726/Nasu-Stack/blob/main/docs/boundaries.ja.md) に明文化しています。

**担当する**: レイアウト、非同期の状態管理、ローディング / エラー表示、部品内部のアクセシビリティ（フォーカス・キーボード・ARIA）、二重送信の防止と中断シグナル

**担当しない**: 認証・認可、サーバ側の正典バリデーション、CSRF対策、レート制限、ボット対策、アップロードの実体検査、中断時のサーバ側ロールバック保証

`FileDrop` の `accept` / `maxSize` も `HoneypotField` もセキュリティ機構ではありません。最終的な判断は必ずサーバ側で行う必要があります。

### 品質チェック

数値を人間に読ませるのではなく、満たせなければビルドを落とす方式です。`pnpm verify` が29項目、`pnpm verify:create` が112項目を検査します（タップ領域24px以上、ARIA role、フォーカス復帰、画像のレイアウト領域確保、モーダル時のスクロールロックなど）。モバイル対応チェッカーは横はみ出し・小さすぎるタップ領域・16px未満の入力欄などを検出し、`npm run check` で CI に組み込めます。

### 導入

```bash
npx https://github.com/Nasu726/Nasu-Stack/releases/download/v1.0.0/create-nasu-stack-1.0.0.tgz my-site
```

既存プロジェクトへの追加は shadcn 経由です。

```bash
npx shadcn@4.17.0 add Nasu726/Nasu-Stack/action-button
```

npm 名は未取得のため、**`npx create-nasu-stack` は実行しないでください**（無関係な第三者のコードが実行されます）。配布は GitHub Release のみです。ライセンスは MIT。
