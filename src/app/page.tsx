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
      if (typeof window !== 'undefined' && OneSignal.Notifications) {
        await OneSignal.login(user.id);
      }
    } catch (e) {
      console.warn("OneSignal login skipped:", e);
    }
  
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        if (data.tap_history && Array.isArray(data.tap_history)) {
          const numericHistory = data.tap_history
            .map((t: string) => new Date(t).getTime())
            .filter((t: number) => !isNaN(t));

          setTapHistory(numericHistory);
          console.log("Success: Loaded tap history", numericHistory.length, "items");
        }

        if (data.ticket1_time) setTicket1Time(new Date(data.ticket1_time));
        if (data.ticket2_time) setTicket2Time(new Date(data.ticket2_time));
      }
    } catch (e) {
      console.error("Load error", e);
    } finally {
      setIsDataLoaded(true);
    }
  }, []);

  const syncData = async (tapISO?: string, t1ISO?: string | null, t2ISO?: string | null) => {
    if (!isLoggedIn) return;
    setIsSyncing(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const isPushEnabled = OneSignal.User.PushSubscription.optedIn;
      const onesignalId = OneSignal.User.PushSubscription.id;

      await fetch('/api/tap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          tapTime: tapISO,
          isPushEnabled: isPushEnabled,
          onesignalId: onesignalId,
          ticket1Time: t1ISO,
          ticket2Time: t2ISO
        })
      });
    } catch (error) {
      console.error("Sync failed", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTap = async () => { 
    if (!isLoggedIn || isSyncing) return;
    
    const now = new Date();
    now.setMilliseconds(0);
    const newTapMs = now.getTime();
    
    setTapHistory(prev => [...prev, newTapMs]);
    
    await syncData(
      now.toISOString(), 
      ticket1Time?.toISOString() || null, 
      ticket2Time?.toISOString() || null
    );
  };

  const handleInvite = async (ticketNumber: 1 | 2) => { 
    const now = new Date();
    now.setMilliseconds(0);
    
    let t1ISO = ticket1Time?.toISOString() || null;
    let t2ISO = ticket2Time?.toISOString() || null;

    if (ticketNumber === 1) { 
        setTicket1Time(now);
        t1ISO = now.toISOString();
    } else { 
        setTicket2Time(now);
        t2ISO = now.toISOString();
    }
    await syncData(undefined, t1ISO, t2ISO);
  };

  useEffect(() => { 
    if (isLoggedIn && !isLoading) loadData(); 
  }, [isLoggedIn, isLoading, loadData]);

  const lastTapTime = tapHistory.length > 0 ? new Date(tapHistory[tapHistory.length - 1]) : null;

  if (isLoading) return <div className="flex justify-center items-center h-screen font-bold">Loading...</div>;
  return (
    <div className="bg-background h-screen flex flex-col">
      <OneSignalInit />
      <Header isLoggedIn={isLoggedIn} onMenuClick={() => setIsSidePanelOpen(true)} />
      <main className="pt-16 pb-16 min-[1000px]:pb-0 flex-1 flex flex-col">
        {!isLoggedIn ? <LoginScreen /> : (
          <>
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