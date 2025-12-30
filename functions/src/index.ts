import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { CloudTasksClient } from "@google-cloud/tasks";

admin.initializeApp();

const project = "ba-cafe-timer"; 
const location = "asia-northeast2"; 
const queue = "notification-queue"; 

const tasksClient = new CloudTasksClient();

/**
 * 1. 通知予約用の関数
 * (ここは変更ありませんが、そのまま使えます)
 */
export const scheduleNotification = functions.region(location).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "ログインが必要です");
  }

  const userId = context.auth.uid;
  const delayHours = 3; 
  const seconds = delayHours * 60 * 60; 
  // const seconds = 15 * 60; // デバッグ用: 15分後に設定

  // Cloud Tasksが実行する関数のURL
  const url = `https://${location}-${project}.cloudfunctions.net/sendFcmNotification`;
  const payload = { userId };

  const parent = tasksClient.queuePath(project, location, queue);
  const task = {
    httpRequest: {
      httpMethod: "POST" as const,
      url,
      body: Buffer.from(JSON.stringify(payload)).toString("base64"),
      headers: {
        "Content-Type": "application/json",
      },
      // Cloud Tasksに認証ヘッダーを付与する場合の推奨設定（今回は必須ではありませんが参考まで）
      // oidcToken: { serviceAccountEmail: ... } 
    },
    scheduleTime: {
      seconds: Date.now() / 1000 + seconds,
    },
  };

  try {
    await tasksClient.createTask({ parent, task });
    console.log(`[DEBUG] Task created! User: ${userId}, Delay: ${seconds} seconds (${seconds/60} minutes)`);
    return { success: true, message: "3時間後に通知を予約しました" };
  } catch (error) {
    console.error("Task creation failed:", error);
    throw new functions.https.HttpsError("internal", "通知予約に失敗しました");
  }
});

/**
 * 2. 通知送信用の関数 (修正版)
 * エラーハンドリングを強化しています。
 */
export const sendFcmNotification = functions.region(location).https.onRequest(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    // データ不備は再試行しても直らないので 200 OK で終わらせるか、400を返してログに残す
    // Cloud Tasksの設定によっては400番台はリトライしない設定も可能ですが、200で止めるのが最も安全です。
    console.error("No userId provided");
    res.status(200).send("No userId provided");
    return;
  }

  try {
    const userRef = admin.firestore().collection("users").doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data();
    const fcmToken = userData?.fcmToken;

    if (!fcmToken) {
      console.log(`No FCM token for user ${userId}. Skipping.`);
      res.status(200).send("No token");
      return;
    }

    const message = {
      token: fcmToken,
      notification: {
        title: "カフェ業務の時間です",
        body: "前回のタップから3時間が経過しました。",
      },
      webpush: {
        fcmOptions: {
          link: "/",
        },
      },
    };

    await admin.messaging().send(message);
    console.log(`Notification sent to ${userId}`);
    res.status(200).send("Sent successfully");

  } catch (error: any) {
    // ★ここが重要な修正ポイントです★
    
    const errorCode = error.code;
    console.error(`Error sending notification to ${userId}:`, error);

    // 具体的なエラーコード判定
    // 'messaging/registration-token-not-registered': トークンが無効（アプリ削除など）
    // 'messaging/invalid-argument': トークン形式不正など
    if (errorCode === 'messaging/registration-token-not-registered' || 
        errorCode === 'messaging/invalid-registration-token' ||
        errorCode === 'messaging/invalid-argument') {
      
      console.log(`Removing invalid token for user ${userId}. Reason: ${errorCode}`);
      
      // 1. Firestoreから無効なトークンを削除 (これでReact側のボタンが「通知OFF」等の表示に戻るきっかけになる)
      try {
        await admin.firestore().collection("users").doc(userId).update({
          fcmToken: admin.firestore.FieldValue.delete()
        });
      } catch (dbError) {
        console.error("Failed to remove token from DB:", dbError);
        // DB更新に失敗しても、通知自体は失敗が確定しているので、タスクは完了させるべき
      }

      // 2. ★重要: 200 OK を返して Cloud Tasks の再試行を止める
      res.status(200).send("Token invalid, task finished.");
      return;
    }

    // 上記以外のエラー（ネットワークエラーやFirebaseサーバーダウンなど）は
    // 一時的な可能性があるので 500 を返してリトライさせる
    res.status(500).send("Internal Server Error (Retryable)");
  }
});