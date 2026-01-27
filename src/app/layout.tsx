import type { Metadata, Viewport } from "next";
import { Mandali, Kosugi_Maru } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const mandali = Mandali({ 
  weight: "400", 
  subsets: ["latin"],
  variable: "--font-mandali",
});

const kosugi = Kosugi_Maru({ 
  weight: "400", 
  subsets: ["latin"],
  variable: "--font-kosugi",
});

export const metadata: Metadata = {
  title: "Cafe Timer",
  description: "カフェタイマー",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cafe Timer",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfbfb' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className={`${mandali.variable} ${kosugi.variable} h-full`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}