"use client";
import { useEffect } from 'react';
import OneSignal from 'react-onesignal';
import { supabase } from "@/hooks/useAuth";

export default function OneSignalInit() {
  useEffect(() => {
    const initOneSignal = async () => {
      try {
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
          allowLocalhostAsSecureOrigin: true, 
          // サービスワーカーのパスをルートに固定して認識を安定させる
          serviceWorkerPath: 'OneSignalSDKWorker.js', 
          welcomeNotification: {
            title: "Cafe Timer",
            message: "先生、通知設定が完了しました！",
          },
        });

        // 初期化直後にログイン状態を確認
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // OneSignalのExternal IDとしてSupabaseのUser IDをセット
          // これによりDBのIDと通知先が強固に紐付く
          await OneSignal.login(user.id);
        }
      } catch (error) {
        console.error("OneSignal init error", error);
      }
    };

    initOneSignal();
  }, []);

  return null;
}