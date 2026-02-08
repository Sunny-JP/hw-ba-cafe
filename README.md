# Cafe Timer

「Cafe Timer」は、ゲーム『ブルーアーカイブ』のカフェ機能を支援する非公式ファンメイドツールです。<br />
生徒さんのカフェ訪問タイミングを通知でお知らせし、先生方の業務をサポートします。

### 主な機能
- **高精度カウントダウン**: 生徒さんの再タップタイミング（3時間）および訪問タイミング（4:00/16:00 JST）をカウントダウン。
- **招待券管理**: 招待券使用後のクールタイムを可視化。
- **タップ履歴のアーカイブ**: 月ごとのタップ履歴をカレンダー形式で確認。画像として保存・共有も可能。
- **プッシュ通知**: ブラウザを閉じていても、OneSignal 連携により次のタイミングを通知。

### 対応プラットフォーム
PCおよびスマートフォンの最新ブラウザに対応。<br />
PWA (Progressive Web App) に対応しているため、ホーム画面に追加することでネイティブアプリのような体験を提供します。
<br /><br />

## 技術スタック

| カテゴリ          | 技術                                |
| :------------ | :-------------------------------- |
| Framework | Next.js (App Router) |
| Styling | Tailwind CSS |
| Database/Auth | Supabase (PostgreSQL) |
| Notification | OneSignal SDK |
| Deployment | Cloudflare Pages |
| Build Tool | @cloudflare/next-on-pages |
| PWA | @ducanh2912/next-pwa |
<br />

## セットアップ & 開発

### 1. 依存関係のインストール
```
npm install
```

### 2. 環境変数の設定
`.env.local` を作成し、以下のキーを設定してください。

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_ONESIGNAL_APP_ID`
- `ONESIGNAL_REST_API_KEY`

### 3. 開発サーバーの起動
```
npm run dev
```
<br />

## ビルド & デプロイ
Cloudflare Pages での動作に最適化されています。

### Cloudflare Pages ビルド設定
- Build command: `npx @cloudflare/next-on-pages@1`
- Build output directory: `.vercel/output/static`

## 主なディレクトリ構造
- `src/app/`: Next.js メインロジック
  - `api/tap/route.ts`: カフェタップ記録、プロフィール更新、OneSignal 通知予約を行う Edge Runtime API
  - `layout.tsx`: アプリケーションの共通レイアウト構造
  - `page.tsx`: メインのダッシュボード画面。タブ切り替えやオーバーレイ表示を管理
  - `providers.tsx`: 認証やテーマなどのコンテキストプロバイダー
  - `manifest.ts`: PWA 設定を定義するマニフェストファイル
  - `globals.css`: スタイル定義
- `src/components/`: 再利用可能な UI コンポーネント
  - `Header.tsx` / `BottomNavBar.tsx`: ナビゲーション UI
  - `TimerDashboard.tsx`: カウントダウン表示とタップ操作のメイン UI
  - `HistoryCalendar.tsx`: 月別タップ履歴を表示するカレンダー
  - `Settings.tsx`: 通知設定、データ削除、ログアウト、各種情報へのリンクを管理
  - `SidePanel.tsx`: 設定画面などを表示するスライドパネル
  - `pages.tsx`: 利用規約やプライバシーポリシーなどの定型文コンテンツを格納
  - `OneSignalInit.tsx`: OneSignal SDK の初期化コンポーネント
- `src/hooks/`: カスタムフック
  - `useAuth.tsx`: Supabase Auth を利用した認証状態の管理
  - `useTheme.tsx`: ダークモードなどのテーマ切り替え管理
- `src/lib/`: ユーティリティと定数
  - `timeUtils.ts`: ブルーアーカイブの仕様（4:00/16:00更新）に基づいた時刻計算ロジック
  - `messages.ts`: プッシュ通知で使用するランダムメッセージ集
- `public/`: アイコン画像や静的アセット
<br /><br />

## 免責事項
本ツールは個人による非公式のファンメイド作品であり、株式会社NEXON、株式会社Yostar、および『ブルーアーカイブ』公式とは一切関係ありません。