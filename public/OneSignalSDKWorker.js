// 1. next-pwa が自動生成するPWA用キャッシュワーカーを読み込む
importScripts("/sw.js");

// 2. OneSignal の通知用ワーカーを読み込む
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
