"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth, supabase } from "@/hooks/useAuth";
import OneSignal from 'react-onesignal';
import OneSignalInit from "@/components/OneSignalInit";

import Header from "@/components/Header";
import TimerDashboard from "@/components/TimerDashboard";
import BottomNavBar from "@/components/BottomNavBar";
import HistoryCalendar from "@/components/HistoryCalendar";
import Settings from "@/components/Settings";
import SidePanel from "@/components/SidePanel";

type Tab = 'timer' | 'history';

function LoginScreen() {
  const { loginWithDiscord } = useAuth();
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoginLoading(true);
    try {
      await loginWithDiscord();
    } catch (error) {
      console.error("Login failed:", error);
      alert("ログインに失敗しました");
      setIsLoginLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-8">
      <div className="timer-card text-center bg-card border border-muted p-8 rounded-2xl shadow-lg max-w-sm w-full">
        <h2 className="text-2xl font-bold mb-2">Welcome!</h2>
        <p className="mb-8 text-muted-foreground text-sm">
          利用するにはログインしてください
        </p>
        
        <button 
          onClick={handleLogin} 
          disabled={isLoginLoading}
          className={`
            w-full py-4 rounded-xl text-lg font-bold transition-all shadow-md
            ${isLoginLoading 
              ? 'bg-muted text-muted-foreground cursor-wait' 
              : 'bg-[#5865F2] text-white hover:brightness-110 hover:shadow-lg'
            }
          `}
        >
          {isLoginLoading ? 'Connecting...' : 'Discord Login'}
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const { isLoggedIn, isLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<Tab>('timer');
  const [tapHistory, setTapHistory] = useState<number[]>([]);
  const [ticket1Time, setTicket1Time] = useState<Date | null>(null);
  const [ticket2Time, setTicket2Time] = useState<Date | null>(null);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    try {
      if (OneSignal.User) {
        await OneSignal.login(user.id);
      } else {
        console.log("OneSignal not ready yet");
      }
    } catch (e) {
      console.error("OneSignal login error", e);
    }

    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data) {
        if (data.tap_history) setTapHistory(data.tap_history as number[]);
        if (data.ticket1_time) setTicket1Time(new Date(data.ticket1_time));
        if (data.ticket2_time) setTicket2Time(new Date(data.ticket2_time));
      } else {
        console.log("No profile found, waiting for trigger...");
      }
    } catch (e) {
      console.error("Load error", e);
    } finally {
      setIsDataLoaded(true);
    }
  }, []);

  const syncData = async (newTapTime?: number, t1?: number | null, t2?: number | null) => {
    if (!isLoggedIn) return;
    setIsSyncing(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const onesignalId = (OneSignal as any).User?.PushSubscription?.id;

      if (!onesignalId) {
        console.log("Notification ID not ready yet.");
      }

      await fetch('/api/tap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          tapTime: newTapTime,
          onesignalId: onesignalId,
          ticket1Time: t1,
          ticket2Time: t2
        })
      });
      console.log("Sync success");
    } catch (error) {
      console.error("Sync failed", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTap = async () => { 
    if (!isLoggedIn || isSyncing) return;
    
    const tapTime = new Date().getTime();
    setTapHistory([...tapHistory, tapTime]);
    await syncData(tapTime, 
        ticket1Time?.getTime() || null, 
        ticket2Time?.getTime() || null
    );
  };

  const handleInvite = async (ticketNumber: 1 | 2) => { 
    const now = new Date();
    let t1 = ticket1Time?.getTime() || null;
    let t2 = ticket2Time?.getTime() || null;

    if (ticketNumber === 1) { 
        setTicket1Time(now); 
        t1 = now.getTime();
    } else { 
        setTicket2Time(now); 
        t2 = now.getTime();
    }
    await syncData(undefined, t1, t2);
  };

  useEffect(() => { 
    if (isLoggedIn && !isLoading) { 
        loadData(); 
    } else if (!isLoggedIn && !isLoading) { 
        setTapHistory([]); 
        setIsDataLoaded(true); 
    } 
  }, [isLoggedIn, isLoading, loadData]);

  const lastTap = tapHistory.length > 0 ? tapHistory[tapHistory.length - 1] : null;
  const lastTapTime = lastTap ? new Date(lastTap) : null;

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen text-muted-foreground font-bold">Loading...</div>;
  }

  return (
    <div className="bg-background h-screen flex flex-col">
      <OneSignalInit />
      <Header isLoggedIn={isLoggedIn} onMenuClick={() => setIsSidePanelOpen(true)} />
      
      <main className="pt-16 pb-16 min-[1000px]:pb-0 flex-1 flex flex-col">
        {!isLoggedIn ? (
          <LoginScreen />
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