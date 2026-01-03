import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

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
};

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  publicExcludes: ["!OneSignalSDKWorker.js"], 
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
  },
});

export default withPWA(nextConfig);
