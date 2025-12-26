"use client";

export const runtime = "edge";

import { useState, useEffect, useCallback } from "react";
import { useAuth, db, auth } from "@/hooks/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import TimerDashboard from "@/components/TimerDashboard";
import BottomNavBar from "@/components/BottomNavBar";
import HistoryCalendar from "@/components/HistoryCalendar";
import Settings from "@/components/Settings";


export interface TapEntry {
  timestamp: string;
}

interface AppData {
  tapHistory: TapEntry[];
  ticket1Time: string | null;
  ticket2Time: string | null;
}

type Tab = 'timer' | 'history' | 'settings';

export default function Home() {
  const { isLoggedIn, isLoading, loginWithGoogle } = useAuth();
  

  const [activeTab, setActiveTab] = useState<Tab>('timer');
  const [tapHistory, setTapHistory] = useState<TapEntry[]>([]);
  const [ticket1Time, setTicket1Time] = useState<Date | null>(null);
  const [ticket2Time, setTicket2Time] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  
  const saveDataToFirebase = useCallback(async (data: AppData) => {
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
  }, [isSyncing]);

  const loadDataFromFirebase = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      const userDocRef = doc(db, "users", uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as AppData;
        if (data.tapHistory) setTapHistory(data.tapHistory);
        if (data.ticket1Time) setTicket1Time(new Date(data.ticket1Time));
        if (data.ticket2Time) setTicket2Time(new Date(data.ticket2Time));
      } else {
        const initialData: AppData = { tapHistory: [], ticket1Time: null, ticket2Time: null };
        await saveDataToFirebase(initialData);
      }
    } catch (err) {
      console.error("Firebaseからの読み込みに失敗", err);
    }
  }, [saveDataToFirebase]);


  const handleTap = async () => {
    const newEntry: TapEntry = { timestamp: new Date().toISOString() };
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
    const newInviteTime = new Date();
    let newData: AppData;
    
    if (ticketNumber === 1) {
      setTicket1Time(newInviteTime);
      newData = { tapHistory, ticket1Time: newInviteTime.toISOString(), ticket2Time: ticket2Time?.toISOString() || null };
    } else {
      setTicket2Time(newInviteTime);
      newData = { tapHistory, ticket1Time: ticket1Time?.toISOString() || null, ticket2Time: newInviteTime.toISOString() };
    }
    
    if (isLoggedIn) await saveDataToFirebase(newData);
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Googleログインに失敗", error);
    }
  };


  useEffect(() => {
    if (isLoggedIn && !isLoading) {
      loadDataFromFirebase();
    } else if (!isLoggedIn && !isLoading) {
      setTapHistory([]);
    }
  }, [isLoggedIn, isLoading, loadDataFromFirebase]);


  const lastTap = tapHistory.length > 0 ? tapHistory[tapHistory.length - 1] : null;
  const lastTapTime = lastTap ? new Date(lastTap.timestamp) : null;


  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">読み込み中...</div>;
  }

  return (
    <div className="bg-background">
      {!isLoggedIn ? (
        <div className="flex flex-col items-center justify-center h-screen p-8">
          <div className="timer-card text-center bg-card! border border-muted p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">ようこそ！</h2>
            <p className="mb-6 text-muted-foreground">
              タイマー機能を利用するには、Googleアカウントでログインしてください。
            </p>
            <button onClick={handleGoogleLogin} className="btn-timer btn-timer-tap px-4 py-2 rounded bg-blue-500 text-white">
              <span>Googleでログイン</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile View (Tabs) */}
          <div className="mobile-view">
            {activeTab === 'timer' && (
                <TimerDashboard
                  tapHistory={tapHistory}
                  lastTapTime={lastTapTime}
                  ticket1Time={ticket1Time}
                  ticket2Time={ticket2Time}
                  onTap={handleTap}
                  onInvite={handleInvite}
                  isSyncing={isSyncing}
                />
            )}
            {activeTab === 'history' && (
                <HistoryCalendar tapHistory={tapHistory} />
            )}
            {activeTab === 'settings' && (
                <Settings />
            )}
          </div>

          {/* Desktop View (Side-by-side) */}
          <div className="desktop-view">
            <div className="space-y-6">
              <TimerDashboard
                tapHistory={tapHistory}
                lastTapTime={lastTapTime}
                ticket1Time={ticket1Time}
                ticket2Time={ticket2Time}
                onTap={handleTap}
                onInvite={handleInvite}
                isSyncing={isSyncing}
              />
            </div>
            <div>
              <HistoryCalendar tapHistory={tapHistory} />
            </div>
            <div>
              <Settings />
            </div>
          </div>
          
          <BottomNavBar activeTab={activeTab} setActiveTab={setActiveTab} />
        </>
      )}
    </div>
  );
}