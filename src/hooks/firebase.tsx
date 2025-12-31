"use client";

import { getApps, initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, Firestore, doc, setDoc, updateDoc, deleteField } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { getFunctions, Functions } from "firebase/functions";
import { getMessaging, getToken, Messaging } from "firebase/messaging";
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
 * ★追加機能: 
 * アプリ利用時(Tap時)にこっそりトークンを最新化する関数。
 * 課金枠節約のため、トークンとUIDに変更がない場合はDB書き込みをスキップする。
 */
export const refreshFcmToken = async (uid: string) => {
  try {
    // messagingが初期化されていない、または通知権限がない場合は何もしない
    if (!messaging || Notification.permission !== 'granted') return null;

    const registration = await navigator.serviceWorker.ready;
    
    // 1. 今の最新トークンを取得
    const currentToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (currentToken) {
      // 2. LocalStorageから「前回保存したトークン」と「その時のUID」を取り出す
      const savedToken = localStorage.getItem('sentFcmToken');
      const savedUid = localStorage.getItem('sentFcmUid');

      // 3. 比較：トークンも同じ、かつ、ユーザーも同じ場合のみDB書き込みをスキップ
      if (savedToken === currentToken && savedUid === uid) {
        console.log("Token & User are up-to-date. Skipping DB write.");
        return currentToken;
      }

      // 4. どちらかが違う場合は、現在のユーザーのDBに書き込む
      const userRef = doc(db, "users", uid);
      await setDoc(userRef, { fcmToken: currentToken }, { merge: true });
      
      // 5. LocalStorageを更新（トークンとユーザーID両方）
      localStorage.setItem('sentFcmToken', currentToken);
      localStorage.setItem('sentFcmUid', uid);
      
      console.log(`Token refreshed for user ${uid}`);
      return currentToken;
    }
    return null;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return null;
  }
};

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