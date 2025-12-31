import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

// 開発環境か本番環境かを判定する
const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // domains を remotePatterns に変更
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
    unoptimized: true,
  },

  // PWAプラグインとの競合エラーを消すための設定
  // PWAプラグインがWebpack設定を注入するため、明示的にTurbopack設定(空でも可)を書く必要があります
  turbopack: {}, 

  // 本番ビルド(npm run build)の時だけ 'export' にする
  // 開発中(npm run dev)は undefined (通常モード) で動かす
  output: isProd ? 'export' : undefined,
};

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  // 開発モードではPWA機能を無効にする
  disable: process.env.NODE_ENV === "development",
  // Firebase通知用SWを除外
  publicExcludes: ["!firebase-messaging-sw.js"], 
  // 内部設定
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
  },
});

export default withPWA(nextConfig);
