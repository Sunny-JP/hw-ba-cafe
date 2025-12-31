/** 本番用 */
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { CloudTasksClient } from "@google-cloud/tasks";
import { messages } from "./messages";

admin.initializeApp();

const project = "ba-cafe-timer"; 
const location = "asia-northeast2"; 
const queue = "notification-queue"; 

const tasksClient = new CloudTasksClient();

export const scheduleNotification = functions.region(location).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "ログインが必要です");
  }

  const userId = context.auth.uid;
  const delayHours = 3; 
  const seconds = delayHours * 60 * 60; 

  const url = `https://${location}-${project}.cloudfunctions.net/sendFcmNotification`;
  const payload = { userId };
  const parent = tasksClient.queuePath(project, location, queue);

  const task = {
    httpRequest: {
      httpMethod: "POST" as const,
      url,
      body: Buffer.from(JSON.stringify(payload)).toString("base64"),
      headers: { "Content-Type": "application/json" },
    },
    scheduleTime: {
      seconds: Date.now() / 1000 + seconds,
    },
  };

  try {
    await tasksClient.createTask({ parent, task });
    console.log(`[PROD] Task created! User: ${userId}, Delay: ${delayHours} hours`);
    return { success: true, message: "3時間後に通知を予約しました" };
  } catch (error) {
    console.error("Task creation failed:", error);
    throw new functions.https.HttpsError("internal", "通知予約に失敗しました");
  }
});

export const sendFcmNotification = functions.region(location).https.onRequest(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
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

    const randomMsg = messages[Math.floor(Math.random() * messages.length)];

    const message = {
      token: fcmToken,
      notification: {
        title: randomMsg.title,
        body: randomMsg.body,
      },
      webpush: {
        fcmOptions: {
          link: "/",
        },
      },
    };

    await admin.messaging().send(message);
    console.log(`Notification sent to ${userId}: ${randomMsg.title}`);
    res.status(200).send("Sent successfully");

  } catch (error: any) {
    const errorCode = error.code;
    console.error(`Error sending notification to ${userId}:`, error);

    if (errorCode === 'messaging/registration-token-not-registered' || 
        errorCode === 'messaging/invalid-registration-token' ||
        errorCode === 'messaging/invalid-argument') {
      
      console.log(`Removing invalid token for user ${userId}. Reason: ${errorCode}`);
      
      try {
        await admin.firestore().collection("users").doc(userId).update({
          fcmToken: admin.firestore.FieldValue.delete()
        });
      } catch (dbError) {
        console.error("Failed to remove token from DB:", dbError);
      }
      res.status(200).send("Token invalid, task finished.");
      return;
    }
    res.status(500).send("Internal Server Error (Retryable)");
  }
});


/** デバッグ用
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { CloudTasksClient } from "@google-cloud/tasks";

admin.initializeApp();

const project = "ba-cafe-timer"; 
const location = "asia-northeast2"; 
const queue = "notification-queue"; 

const tasksClient = new CloudTasksClient();

export const scheduleNotification = functions.region(location).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "ログインが必要です");
  }

  const userId = context.auth.uid;

  const debugDelays = [60, 300, 600, 1800, 3600];

  const url = `https://${location}-${project}.cloudfunctions.net/sendFcmNotification`;
  const payload = { userId };
  const parent = tasksClient.queuePath(project, location, queue);

  try {
    const promises = debugDelays.map(async (delay) => {
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
          seconds: Date.now() / 1000 + delay,
        },
      };

      await tasksClient.createTask({ parent, task });
      console.log(`[DEBUG] Task created! User: ${userId}, Delay: ${delay}s`);
    });

    await Promise.all(promises);

    return { success: true, message: `テスト通知を${debugDelays.length}件予約しました` };

  } catch (error) {
    console.error("Task creation failed:", error);
    throw new functions.https.HttpsError("internal", "通知予約に失敗しました");
  }
});

export const sendFcmNotification = functions.region(location).https.onRequest(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
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
        title: "【テスト】カフェ業務の時間です",
        body: "これはデバッグ用の通知テストです。",
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
    const errorCode = error.code;
    console.error(`Error sending notification to ${userId}:`, error);

    if (errorCode === 'messaging/registration-token-not-registered' || 
        errorCode === 'messaging/invalid-registration-token' ||
        errorCode === 'messaging/invalid-argument') {
      
      console.log(`Removing invalid token for user ${userId}. Reason: ${errorCode}`);
      
      try {
        await admin.firestore().collection("users").doc(userId).update({
          fcmToken: admin.firestore.FieldValue.delete()
        });
      } catch (dbError) {
        console.error("Failed to remove token from DB:", dbError);
      }
      res.status(200).send("Token invalid, task finished.");
      return;
    }
    res.status(500).send("Internal Server Error (Retryable)");
  }
});
*/