# Cafe Timer

「Cafe Timer」は、ゲーム『ブルーアーカイブ』のカフェ機能を支援する非公式ファンメイドツールです。<br />
生徒さんのカフェ訪問タイミングを通知でお知らせし、先生方の業務をサポートします。
  
### 主な機能
- 生徒さんの再タップ可能タイミングのカウントダウン
- 生徒さんの訪問タイミング（4:00/16:00 JST）のカウントダウン
- 招待券のクールタイム管理
- タップ履歴のカレンダー表示

### 対応プラットフォーム
PCおよびスマートフォンの最新ブラウザで動作します。<br />
PWAに対応しているため、ホーム画面に追加してアプリのように使うことができます。
<br /><br />

## 技術スタック

* **Framework:** Next.js (App Router)
* **Deployment:** Cloudflare Pages
* **Build Tool:** @cloudflare/next-on-pages
* **PWA:** @ducanh2912/next-pwa
* **Database:** Supabase
* **Push Notification:** OneSignal
* **Styling:** Tailwind CSS

## セットアップ & 開発

### 1. 依存関係のインストール
```
npm install
```

### 2. 開発サーバーの起動
```
npm run dev
```

## ビルド & デプロイ
Cloudflare Pages でのビルドには特定の設定が必要です。

### Cloudflare Pages ビルド設定
- Build command: `npx @cloudflare/next-on-pages@1`
- Build output directory: `.vercel/output/static`
- Compatibility Date: `2024-12-30`
- Compatibility Flags: `nodejs_compat`

### 設定
1. output 設定の禁止: `next.config.ts`で`output: 'standalone'`や`output: 'export'`は設定しません。設定すると、Cloudflare 向けのビルドプロセスと競合し、404エラーの原因となります。

2. Edge Runtime の指定: APIルート（`src/app/api/**/route.ts`）を Cloudflare Workers 上で動作させるため、各ファイルに以下の指定が必要です。
``` TypeScript
export const runtime = 'edge';
```

3. Webpack の明示的使用: Next.js 16 + PWA プラグイン環境において、ビルドの整合性を保つために`package.json`で Webpack モードを指定しています。
``` JSON
"build": "next build --webpack"
```

## ディレクトリ構造
- `src/app/api/`: Cloudflare Workers (Edge Runtime) 上で動作する API エンドポイント
- `public/`: アイコン、マニフェスト、OneSignal SDK 等の静的アセット
