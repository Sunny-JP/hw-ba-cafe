import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { CloudTasksClient } from "@google-cloud/tasks";

admin.initializeApp();

// プロジェクト設定
// ※重要: 環境変数がうまく取れない場合があるため、プロジェクトIDを直接書くか、
// const project = JSON.parse(process.env.FIREBASE_CONFIG!).projectId; の代わりに
// 以下のように明示的に書くのが確実です。
const project = "ba-cafe-timer"; // .env.localのNEXT_PUBLIC_FIREBASE_PROJECT_IDと同じ
const location = "asia-northeast2"; // FirestoreやTasksのキューを作った場所
const queue = "notification-queue"; // 前の手順で作ったキューの名前

const tasksClient = new CloudTasksClient();

/**
 * 1. 通知予約用の関数 (アプリから呼ばれる)
 * ユーザーがTapした時に呼び出され、3時間後のタスクを予約します。
 */
export const scheduleNotification = functions.region(location).https.onCall(async (data, context) => {
  // 認証チェック: ログインしていないユーザーは拒否
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "ログインが必要です");
  }

  const userId = context.auth.uid;
  // const delayHours = 3; // 3時間
  // const seconds = delayHours * 60 * 60; // 秒に変換
  const seconds = 60; // デバッグ用: 1分後に設定

  // Cloud Tasksが実行する関数のURL
  const url = `https://${location}-${project}.cloudfunctions.net/sendFcmNotification`;

  const payload = { userId };

  // タスクの作成
  const parent = tasksClient.queuePath(project, location, queue);
  const task = {
    httpRequest: {
      httpMethod: "POST" as const,
      url,
      body: Buffer.from(JSON.stringify(payload)).toString("base64"),
      headers: {
        "Content-Type": "application/json",
      },
    },
    scheduleTime: {
      seconds: Date.now() / 1000 + seconds,
    },
  };

  try {
    await tasksClient.createTask({ parent, task });
    console.log(`Task created for user: ${userId}`);
    return { success: true, message: "3時間後に通知を予約しました" };
  } catch (error) {
    console.error("Task creation failed:", error);
    throw new functions.https.HttpsError("internal", "通知予約に失敗しました");
  }
});

/**
 * 2. 通知送信用の関数 (Cloud Tasksから呼ばれる)
 * 3時間経った後に実行され、実際にFCM通知を送ります。
 */
export const sendFcmNotification = functions.region(location).https.onRequest(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    res.status(400).send("No userId provided");
    return;
  }

  try {
    // Firestoreから最新のトークンを取得
    const userDoc = await admin.firestore().collection("users").doc(userId).get();
    const userData = userDoc.data();
    const fcmToken = userData?.fcmToken;

    if (!fcmToken) {
      console.log("No FCM token found.");
      // エラーを返すとタスクが再試行されてしまうため、あえて200 OKで終了させる
      res.status(200).send("No token");
      return;
    }

    // 通知メッセージの作成
    const message = {
      token: fcmToken,
      notification: {
        title: "カフェ業務の時間です",
        body: "前回のタップから3時間が経過しました。",
      },
      webpush: {
        fcmOptions: {
          link: "/", // 通知をクリックした時の飛び先
        },
      },
    };

    // 通知送信
    await admin.messaging().send(message);
    console.log(`Notification sent to ${userId}`);
    res.status(200).send("Sent successfully");
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).send("Internal Server Error");
  }
});