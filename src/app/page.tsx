"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth, db, auth, functions } from "@/hooks/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import Header from "@/components/Header";
import TimerDashboard from "@/components/TimerDashboard";
import BottomNavBar from "@/components/BottomNavBar";
import HistoryCalendar from "@/components/HistoryCalendar";
import Settings from "@/components/Settings";
import SidePanel from "@/components/SidePanel";
import { shouldScheduleNotification } from "@/lib/timeUtils";

interface OldTapEntry { timestamp: string; }
interface AppData {
  tapHistory: number[];
  ticket1Time: number | null;
  ticket2Time: number | null;
}
type Tab = 'timer' | 'history';

export default function Home() {
  const { isLoggedIn, isLoading, loginWithGoogle } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('timer');
  const [tapHistory, setTapHistory] = useState<number[]>([]);
  const [ticket1Time, setTicket1Time] = useState<Date | null>(null);
  const [ticket2Time, setTicket2Time] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  const saveDataToFirebase = useCallback(async (data: AppData) => { const uid = auth.currentUser?.uid; if (!uid || isSyncing) return; setIsSyncing(true); try { const userDocRef = doc(db, "users", uid); await setDoc(userDocRef, data, { merge: true }); } catch (err) { console.error("Firebase save error", err); } finally { setIsSyncing(false); } }, [isSyncing]);
  const loadDataFromFirebase = useCallback(async () => { const uid = auth.currentUser?.uid; if (!uid) return; try { const userDocRef = doc(db, "users", uid); const docSnap = await getDoc(userDocRef); if (docSnap.exists()) { const data = docSnap.data(); let needsSave = false; if (data.tapHistory && data.tapHistory.length > 0 && typeof data.tapHistory[0] === 'object' && data.tapHistory[0] !== null) { data.tapHistory = (data.tapHistory as OldTapEntry[]).map(entry => new Date(entry.timestamp).getTime()); needsSave = true; } if (data.ticket1Time && typeof data.ticket1Time === 'string') { data.ticket1Time = new Date(data.ticket1Time).getTime(); needsSave = true; } if (data.ticket2Time && typeof data.ticket2Time === 'string') { data.ticket2Time = new Date(data.ticket2Time).getTime(); needsSave = true; } if (needsSave) { await saveDataToFirebase(data as AppData); } if (data.tapHistory) setTapHistory(data.tapHistory as number[]); if (data.ticket1Time) setTicket1Time(new Date(data.ticket1Time)); if (data.ticket2Time) setTicket2Time(new Date(data.ticket2Time)); } else { const initialData: AppData = { tapHistory: [], ticket1Time: null, ticket2Time: null }; await saveDataToFirebase(initialData); } } catch (err) { console.error("Firebase load error", err); } finally { setIsDataLoaded(true); } }, [saveDataToFirebase]);
  
  const handleTap = async () => { if (!isLoggedIn) return; const tapTime = new Date(); const newEntry = tapTime.getTime(); const newHistory = [...tapHistory, newEntry]; setTapHistory(newHistory); const newData: AppData = { tapHistory: newHistory, ticket1Time: ticket1Time?.getTime() || null, ticket2Time: ticket2Time?.getTime() || null, }; await saveDataToFirebase(newData); if (shouldScheduleNotification(tapTime)) { try { const scheduleFn = httpsCallable(functions, 'scheduleNotification'); await scheduleFn(); console.log("Notification scheduled"); } catch (error) { console.error("Notification schedule failed", error); } } else { console.log("Notification skipped (boundary limit)"); } };
  const handleInvite = async (ticketNumber: 1 | 2) => { const newInviteTime = new Date(); let newData: AppData; if (ticketNumber === 1) { setTicket1Time(newInviteTime); newData = { tapHistory, ticket1Time: newInviteTime.getTime(), ticket2Time: ticket2Time?.getTime() || null }; } else { setTicket2Time(newInviteTime); newData = { tapHistory, ticket1Time: ticket1Time?.getTime() || null, ticket2Time: newInviteTime.getTime() }; } if (isLoggedIn) await saveDataToFirebase(newData); };
  const handleGoogleLogin = async () => { try { await loginWithGoogle(); } catch (error) { console.error("Google Login failed", error); } };

  useEffect(() => { if (isLoggedIn && !isLoading) { loadDataFromFirebase(); } else if (!isLoggedIn && !isLoading) { setTapHistory([]); setIsDataLoaded(true); } }, [isLoggedIn, isLoading, loadDataFromFirebase]);

  const lastTap = tapHistory.length > 0 ? tapHistory[tapHistory.length - 1] : null;
  const lastTapTime = lastTap ? new Date(lastTap) : null;

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <Header isLoggedIn={isLoggedIn} onMenuClick={() => setIsSidePanelOpen(true)} />

      <main className="pt-16 flex-1 flex flex-col">
        {!isLoggedIn ? (
          <div className="flex flex-col items-center justify-center flex-1 p-8">
            <div className="timer-card text-center bg-card border border-muted p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4">Welcome!</h2>
              <p className="mb-6 text-muted-foreground">タイマーを利用するにはログインしてください</p>
              <button onClick={handleGoogleLogin} className="btn-timer btn-timer-tap">
                Google Login
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="min-[1000px]:hidden flex-1">
              {activeTab === 'timer' && (
                  <TimerDashboard
                    tapHistory={tapHistory}
                    lastTapTime={lastTapTime}
                    ticket1Time={ticket1Time}
                    ticket2Time={ticket2Time}
                    onTap={handleTap}
                    onInvite={handleInvite}
                    isSyncing={isSyncing}
                    isDataLoaded={isDataLoaded}
                  />
              )}
              {activeTab === 'history' && (
                  <div className="p-4">
                    <HistoryCalendar tapHistory={tapHistory} />
                  </div>
              )}
            </div>

            {/* Desktop View */}
            <div className="hidden min-[1000px]:flex flex-1 items-center justify-center p-6 h-[calc(100vh-64px)] overflow-hidden">
              <div className="grid grid-cols-2 gap-6 w-full max-w-[160svh] mx-auto items-stretch">
                <div className="flex flex-col justify-center">
                  <TimerDashboard
                    tapHistory={tapHistory}
                    lastTapTime={lastTapTime}
                    ticket1Time={ticket1Time}
                    ticket2Time={ticket2Time}
                    onTap={handleTap}
                    onInvite={handleInvite}
                    isSyncing={isSyncing}
                    isDataLoaded={isDataLoaded}
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <HistoryCalendar tapHistory={tapHistory} />
                </div>
              </div>
            </div>
            
            <BottomNavBar activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <SidePanel isOpen={isSidePanelOpen} onClose={() => setIsSidePanelOpen(false)} title="Settings">
              <Settings />
            </SidePanel>
          </>
        )}
      </main>
    </div>
  );
}