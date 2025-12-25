import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

console.log(firebaseConfig);

if (!getApps()?.length) initializeApp(firebaseConfig);

export const db = getFirestore();
export const storage = getStorage();
export const auth = getAuth();

import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from "firebase/auth";
import * as React from "react";
import { ReactNode, useContext, useEffect, useState } from "react";

type ContextType = {
  isLoggedIn: boolean;
  isLoading: boolean;
  userName: string;
  loginWithGoogle: () => Promise<void>; // Add login function to context
};

const AuthContext = React.createContext<ContextType | null>({
  isLoggedIn: false,
  isLoading: false,
  userName: "",
  loginWithGoogle: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  console.log("AuthProvider");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      console.log("Google Sign-In successful from AuthProvider");
    } catch (error) {
      console.error("Google Sign-In failed in AuthProvider:", error);
      throw error; // Re-throw to allow caller to handle errors
    }
  };

  useEffect(() => {
    console.log("AuthProvider: useEffect running");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("AuthProvider: onAuthStateChanged triggered");
      if (user) {
        console.log("AuthProvider: User is logged in", user.displayName);
        setIsLoggedIn(true);
        setUserName(user.displayName || "");
      } else {
        console.log("AuthProvider: User is logged out");
        setIsLoggedIn(false);
        setUserName("");
      }
      setIsLoading(false);
    });
    return () => {
      console.log("AuthProvider: Unsubscribing from onAuthStateChanged");
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, isLoading, userName, loginWithGoogle }}
    >
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
