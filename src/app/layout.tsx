"use client";

import { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import SidePane from '@/components/SidePane';
import "./globals.css";

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
      <body>
        <GoogleOAuthProvider clientId={clientId}>
          <AuthProvider>
            <AppLayout>{children}</AppLayout>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}