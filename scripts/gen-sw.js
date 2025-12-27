const fs = require("fs");
const path = require("path");
// ローカルの.env.localを読み込む（本番環境では無視されるので安全）
require("dotenv").config({ path: ".env.local" });

// 読み込むテンプレート
const templatePath = path.join(__dirname, "../firebase-messaging-sw.template.js");
// 書き出す先（publicフォルダ）
const outputPath = path.join(__dirname, "../public/firebase-messaging-sw.js");

try {
  // 1. テンプレートを読み込む
  let content = fs.readFileSync(templatePath, "utf8");

  // 2. 環境変数で置換する（もし値がなければ空文字にする）
  content = content.replace("__FIREBASE_API_KEY__", process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "");
  content = content.replace("__FIREBASE_AUTH_DOMAIN__", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "");
  content = content.replace("__FIREBASE_PROJECT_ID__", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "");
  content = content.replace("__FIREBASE_STORAGE_BUCKET__", process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "");
  content = content.replace("__FIREBASE_MESSAGING_SENDERID__", process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDERID || "");
  content = content.replace("__FIREBASE_APP_ID__", process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "");
  content = content.replace("__FIREBASE_MEASUREMENT_ID__", process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "");

  // 3. ファイルを書き出す
  fs.writeFileSync(outputPath, content);
  console.log("✅ Service Worker generated successfully.");
} catch (error) {
  console.error("❌ Error generating Service Worker:", error);
  process.exit(1);
}
