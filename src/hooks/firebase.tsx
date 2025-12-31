"use client";

import { getApps, initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, Firestore, doc, setDoc, updateDoc, deleteField } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { getFunctions, Functions } from "firebase/functions";
import { getMessaging, getToken, deleteToken, Messaging } from "firebase/messaging"; // deleteTokenを追加
import * as React from "react";
import { ReactNode, useContext, useEffect, useState } from "react";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDERID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let analytics: Analytics | undefined;
let functions: Functions;
let messaging: Messaging | undefined;

// 初期化ロジック
if (typeof window !== "undefined" && !getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  functions = getFunctions(app, "asia-northeast2");
  messaging = getMessaging(app);

  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
} else if (getApps().length) {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  if (typeof window !== "undefined") {
    functions = getFunctions(app, "asia-northeast2");
    messaging = getMessaging(app);
  }
}

export { auth, db, storage, analytics, functions, messaging };

// --- 通知関連の関数 ---

export const requestNotificationPermission = async (uid: string) => {
  if (!messaging) return false;

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert("このブラウザは通知に対応していません。");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return false;
    }

    const registrations = await navigator.serviceWorker.getRegistrations();
    if (registrations.length === 0) {
      await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    }
    
    const activeRegistration = await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
      serviceWorkerRegistration: activeRegistration,
    });

    if (token) {
      const userRef = doc(db, "users", uid);
      await setDoc(userRef, { fcmToken: token }, { merge: true });
      return true;
    }
    return false;
  } catch (error) {
    console.error("通知設定エラー:", error);
    alert("設定中にエラーが発生しました。");
    return false;
  }
};

export const unregisterNotification = async (uid: string) => {
    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            fcmToken: deleteField()
        });
        return true;
    } catch (error) {
        console.error("通知解除エラー:", error);
        return false;
    }
};

/**
 * ★変更: DB書き込みは行わず、新品の有効なトークンを取得して返す関数
 * キャッシュ(deleteToken)を削除することで、確実にサーバーで有効なトークンを再発行します。
 */
export const getFreshFcmToken = async () => {
  try {
    if (!messaging || Notification.permission !== 'granted') return null;

    const registration = await navigator.serviceWorker.ready;

    // 1. キャッシュされている古いトークンを削除（強制再発行のため）
    try {
        await deleteToken(messaging);
        // console.log("Token cache cleared.");
    } catch (e) {
        // キャッシュがない場合のエラーは無視して進む
        console.warn("Cache clear warning:", e);
    }

    // 2. 新品のトークンを取得
    const currentToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    return currentToken || null;
  } catch (error) {
    console.error("Token retrieval failed:", error);
    return null;
  }
};

// --- Auth Context ---

type ContextType = {
    isLoggedIn: boolean;
    isLoading: boolean;
    userName: string;
    loginWithGoogle: () => Promise<void>;
  };
  
  const AuthContext = React.createContext<ContextType | null>({
    isLoggedIn: false,
    isLoading: true,
    userName: "",
    loginWithGoogle: async () => {},
  });
  
  export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userName, setUserName] = useState("");
  
    const loginWithGoogle = async () => {
      if (!auth) return;
      const provider = new GoogleAuthProvider();
      try {
        await signInWithPopup(auth, provider);
      } catch (error) {
        console.error("Google Sign-In failed:", error);
        throw error;
      }
    };
  
    useEffect(() => {
      if (!auth) return;
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setIsLoggedIn(true);
          setUserName(user.displayName || "");
        } else {
          setIsLoggedIn(false);
          setUserName("");
        }
        setIsLoading(false);
      });
      return () => unsubscribe();
    }, []);
  
    return (
      <AuthContext.Provider value={{ isLoggedIn, isLoading, userName, loginWithGoogle }}>
        {children}
      </AuthContext.Provider>
    );
  };
  
  export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === null) {
      throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
  };