"use client";

import { AuthProvider } from "@/hooks/firebase";
import { ThemeProvider } from "@/hooks/useTheme";
import "./globals.css";
import { Noto_Sans_JP } from "next/font/google";
const NotoSansJPFont400 = Noto_Sans_JP({ weight: "400", subsets: ["latin"] });
const NotoSansJPFont700 = Noto_Sans_JP({ weight: "700", subsets: ["latin"] });

function AppLayout({ children }: { children: React.ReactNode }) {
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
    <html lang="ja">
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
