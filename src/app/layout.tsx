"use client"; // 追加

import { GoogleOAuthProvider } from '@react-oauth/google';
import "./globals.css";

// メタデータはサーバーコンポーネントでしか使えないため、layout.tsxからは一旦削除またはコメントアウトします。
// export const metadata = { ... };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return (
      <html>
        <body>
          <h1>Google Client IDが設定されていません。</h1>
          <p>.env.localファイルを確認してください。</p>
        </body>
      </html>
    );
  }

  return (
    <html lang="ja">
      <body>
        <GoogleOAuthProvider clientId={clientId}>
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}