import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://onesignal.com https://cdn.onesignal.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://lh3.googleusercontent.com https://cdn.discordapp.com;
    font-src 'self';
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://onesignal.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`.replace(/\s{2,}/g, " ").trim();

const nextConfig: NextConfig = {
  poweredByHeader: false,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
    unoptimized: true,
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://rabbit1.cc', 
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,OPTIONS,DELETE,PATCH',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: cspHeader },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
    ];
  },

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