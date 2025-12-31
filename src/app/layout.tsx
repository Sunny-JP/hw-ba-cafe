"use client";

import { AuthProvider } from "@/hooks/firebase";
import { ThemeProvider } from "@/hooks/useTheme";
import { useEffect } from "react";
import "./globals.css";
import { Noto_Sans_JP } from "next/font/google";
const NotoSansJPFont400 = Noto_Sans_JP({ weight: "400", subsets: ["latin"] });
const NotoSansJPFont700 = Noto_Sans_JP({ weight: "700", subsets: ["latin"] });

function AppLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const setSvh = () => {
      document.documentElement.style.setProperty('--svh', `${window.innerHeight}px`);
    };
    setSvh();
    window.addEventListener('resize', setSvh);
    return () => window.removeEventListener('resize', setSvh);
  }, []);

  return (
    <>
      {children}
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="h-full">
      <body className={`${NotoSansJPFont700.className, NotoSansJPFont400.className} h-full`}>
        <ThemeProvider>
          <AuthProvider>
            <AppLayout>{children}</AppLayout>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
