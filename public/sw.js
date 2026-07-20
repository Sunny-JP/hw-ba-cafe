try {
  // OneSignalのService Workerを読み込む
  importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
} catch (error) {
  // 広告ブロッカーやトラッキング防止機能で通信が遮断された場合、
  // エラーをキャッチしてService Worker全体のクラッシュを防ぐ
  console.error("OneSignal Service Workerの読み込みがブロックされました。ブラウザのセキュリティ設定を確認してください:", error);
}
