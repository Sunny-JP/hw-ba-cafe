import type { NextConfig } from "next";

// 開発環境か本番環境かを判定する
const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
    unoptimized: true,
  },

  // 本番ビルド(npm run build)の時だけ 'export' にする
  // 開発中(npm run dev)は undefined (通常モード) で動かす
  output: isProd ? 'export' : undefined,
};

export default nextConfig;
