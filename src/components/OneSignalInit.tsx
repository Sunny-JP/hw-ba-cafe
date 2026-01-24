"use client";
import { useEffect } from 'react';
import OneSignal from 'react-onesignal';

let isInitialized = false;

export default function OneSignalInit() {
  useEffect(() => {
    if (isInitialized) return;

    isInitialized = true;

    const initOneSignal = async () => {
      try {
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
          allowLocalhostAsSecureOrigin: true, 
          serviceWorkerPath: 'OneSignalSDKWorker.js', 
          
          welcomeNotification: {
            title: "Café Timer",
            message: "先生、通知設定が完了しました！これでお仕事の時間をお知らせします。",
          },
        });
        console.log("OneSignal Initialized");
      } catch (error) {
        console.error("OneSignal init error", error);
      }
    };

    initOneSignal();
  }, []);

  return null;
}