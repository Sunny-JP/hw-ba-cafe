"use client";

export const runtime = "edge";

import { useState } from "react";
import { AuthProvider } from "@/hooks/firebase";
import { ThemeProvider } from "@/hooks/useTheme";
import Header from "@/components/Header";
import SidePane from "@/components/SidePane";
import "./globals.css";
import { Noto_Sans_JP } from "next/font/google";
//const NotoSansJPFont400 = Noto_Sans_JP({ weight: "400", subsets: ["latin"] });
const NotoSansJPFont700 = Noto_Sans_JP({ weight: "700", subsets: ["latin"] });

function AppLayout({ children }: { children: React.ReactNode }) {
  const [isPaneOpen, setIsPaneOpen] = useState(false);

  return (
    <>
      <Header onMenuClick={() => setIsPaneOpen(true)} />
      <SidePane
        isOpen={isPaneOpen}
        onClose={() => setIsPaneOpen(false)}
        user={null}
        logout={() => {}}
      />
      <div className="pt-20">{children}</div>
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
      <body className={`${NotoSansJPFont700.className}`}>
        <ThemeProvider>
          <AuthProvider>
            <AppLayout>{children}</AppLayout>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
