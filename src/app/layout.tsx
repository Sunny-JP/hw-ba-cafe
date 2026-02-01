import type { Metadata, Viewport } from "next";
import { Mandali, Kosugi_Maru } from "next/font/google";
import { GoogleAnalytics } from '@next/third-parties/google';
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
  description: "この一瞬を、アーカイブ。",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cafe Timer",
  },
  openGraph: {
    title: "Cafe Timer",
    description: "この一瞬を、アーカイブ。",
    url: "https://cafetimer.rabbit1.cc",
    siteName: "Cafe Timer",
    images: [
      {
        url: "https://cafetimer.rabbit1.cc/ogp.png",
        alt: "Cafe Timer",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cafe Timer",
    description: "この一瞬を、アーカイブ。",
    images: ["https://cafetimer.rabbit1.cc/ogp.png"],
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
        <GoogleAnalytics gaId="G-FQSKNGBJ7W" />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}