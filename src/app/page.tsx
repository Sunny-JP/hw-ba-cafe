"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth, db, auth } from "@/hooks/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import TimerDashboard from "@/components/TimerDashboard";
import { log } from "node:console";

export const runtime = "edge";

export interface TapEntry {
  timestamp: string;
  isOshi: boolean;
}

interface AppData {
  tapHistory: TapEntry[];
  ticket1Time: string | null;
  ticket2Time: string | null;
}

export default function Home() {
  console.log("Home");
  const { isLoggedIn, isLoading, loginWithGoogle } = useAuth();

  const [tapHistory, setTapHistory] = useState<TapEntry[]>([]);
  const [ticket1Time, setTicket1Time] = useState<Date | null>(null);
  const [ticket2Time, setTicket2Time] = useState<Date | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);

  const saveDataToFirebase = useCallback(
    async (data: AppData) => {
      console.log("saveDataToFirebase");
      const uid = auth.currentUser?.uid;
      if (!uid || isSyncing) return;
      setIsSyncing(true);

      try {
        const userDocRef = doc(db, "users", uid);
        await setDoc(userDocRef, data, { merge: true });
      } catch (err) {
        console.error("Firebaseへの保存に失敗", err);
      } finally {
        setIsSyncing(false);
      }
    },
    [isSyncing],
  );

  const loadDataFromFirebase = useCallback(async () => {
    console.log("loadDataFromFirebase");
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      const userDocRef = doc(db, "users", uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as AppData;
        if (data.tapHistory) {
          setTapHistory(data.tapHistory);
        }
        if (data.ticket1Time) setTicket1Time(new Date(data.ticket1Time));
        if (data.ticket2Time) setTicket2Time(new Date(data.ticket2Time));
      } else {
        const initialData: AppData = {
          tapHistory: [],
          ticket1Time: null,
          ticket2Time: null,
        };
        await saveDataToFirebase(initialData);
      }
    } catch (err) {
      console.error("Firebaseからの読み込みに失敗", err);
    }
  }, [saveDataToFirebase]);

  const handleTap = async (isFave: boolean) => {
    console.log("handleTap");
    const newEntry: TapEntry = {
      timestamp: new Date().toISOString(),
      isOshi: isFave,
    };
    const newHistory = [...tapHistory, newEntry];
    setTapHistory(newHistory);

    if (isLoggedIn) {
      const newData: AppData = {
        tapHistory: newHistory,
        ticket1Time: ticket1Time?.toISOString() || null,
        ticket2Time: ticket2Time?.toISOString() || null,
      };
      await saveDataToFirebase(newData);
    }
  };

  const handleInvite = async (ticketNumber: 1 | 2) => {
    console.log("handleInvite");
    const newInviteTime = new Date();
    let newData: AppData;
    if (ticketNumber === 1) {
      setTicket1Time(newInviteTime);
      newData = {
        tapHistory,
        ticket1Time: newInviteTime.toISOString(),
        ticket2Time: ticket2Time?.toISOString() || null,
      };
    } else {
      setTicket2Time(newInviteTime);
      newData = {
        tapHistory,
        ticket1Time: ticket1Time?.toISOString() || null,
        ticket2Time: newInviteTime.toISOString(),
      };
    }
    if (isLoggedIn) {
      await saveDataToFirebase(newData);
    }
  };

  useEffect(() => {
    console.log(
      `useEffect triggered. isLoggedIn: ${isLoggedIn}, isLoading: ${isLoading}`,
    );
    if (isLoggedIn && !isLoading) {
      console.log("useEffect condition met: Loading data from Firebase.");
      loadDataFromFirebase();
    } else if (!isLoggedIn && !isLoading) {
      console.log(
        "useEffect condition met: Not logged in, resetting tap history.",
      );
      setTapHistory([]);
    }
  }, [isLoggedIn, isLoading, loadDataFromFirebase]); // Depend on isLoggedIn and isLoading

  const lastTap =
    tapHistory.length > 0 ? tapHistory[tapHistory.length - 1] : null;
  const lastTapTime = lastTap ? new Date(lastTap.timestamp) : null;

  const handleGoogleLogin = async () => {
    console.log("handleGoogleLogin");
    try {
      await loginWithGoogle();
      console.log("Logged in successfully");
    } catch (error) {
      console.error("Googleログインに失敗", error);
    }
  };

  if (isLoading) {
    console.log("Loading...");
    return <div className="text-center p-10">読み込み中...</div>;
  }

  return (
    <div className="bg-background min-h-screen">
      {!isLoggedIn ? (
        <div className="flex flex-col items-center justify-center h-screen p-8">
          <div className="card text-center !bg-card border border-muted">
            <h2 className="text-xl font-bold mb-4">ようこそ！</h2>
            <p className="mb-6 text-muted-foreground">
              タイマー機能を利用するには、Googleアカウントでログインしてください。
            </p>
            <button onClick={handleGoogleLogin} className="btn btn-primary">
              <span>Googleでログイン</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          <TimerDashboard
            lastTapTime={lastTapTime}
            ticket1Time={ticket1Time}
            ticket2Time={ticket2Time}
            onTap={handleTap}
            onInvite={handleInvite}
            isSyncing={isSyncing}
          />

          <div className="p-4 sm:p-8 space-y-6 max-w-md mx-auto timer-dashboard-bg">
            <div className="timer-card">
              <h2 className="timer-card-title">Tap History</h2>
              <ul className="history-text">
                {tapHistory
                  .slice(-5)
                  .reverse()
                  .map((tap) => (
                    <li key={tap.timestamp} className="mb-1">
                      {new Date(tap.timestamp).toLocaleString("ja-JP")}
                      {tap.isOshi && (
                        <span className="ml-2 text-pink-500 font-bold">
                          (推し)
                        </span>
                      )}
                    </li>
                  ))}
                {tapHistory.length === 0 && <li>まだ記録がありません</li>}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
