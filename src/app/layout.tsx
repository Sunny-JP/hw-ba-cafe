"use client";

export const runtime = "edge";

import { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ThemeProvider } from '@/hooks/useTheme';
import Header from '@/components/Header';
import SidePane from '@/components/SidePane';
import "./globals.css";
import { Noto_Sans_JP } from "next/font/google";
const NotoSansJPFont400 = Noto_Sans_JP({ weight: "400", subsets: ["latin"] });
const NotoSansJPFont700 = Noto_Sans_JP({ weight: "700", subsets: ["latin"] });

function AppLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const [isPaneOpen, setIsPaneOpen] = useState(false);

    return (
        <>
            <Header onMenuClick={() => setIsPaneOpen(true)} />
            <SidePane 
                isOpen={isPaneOpen} 
                onClose={() => setIsPaneOpen(false)}
                user={user}
                logout={logout}
            />
            <div className="pt-20"> 
                {children}
            </div>
        </>
    );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) return <html><body>Google Client IDが設定されていません。</body></html>;

  return (
    <html lang="ja">
      <body className={`${NotoSansJPFont700.className}`}>
        <GoogleOAuthProvider clientId={clientId}>
          <AuthProvider>
            <ThemeProvider>
              <AppLayout>{children}</AppLayout>
            </ThemeProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}