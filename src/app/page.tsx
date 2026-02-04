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
  
  // ステートの分離
  const [timerHistory, setTimerHistory] = useState<number[]>([]);
  const [calendarHistory, setCalendarHistory] = useState<number[]>([]);
  
  const [ticket1Time, setTicket1Time] = useState<Date | null>(null);
  const [ticket2Time, setTicket2Time] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  // 月次データ取得の共通関数
  const fetchMonthlyData = useCallback(async (year: number, month: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase.rpc('get_taps_by_logical_month', {
      target_user_id: user.id,
      target_year: year,
      target_month: month
    });

    if (error) {
      console.error("Fetch monthly data error:", error);
      return [];
    }
    return (data || []).map((t: any) => new Date(t.tap_time).getTime());
  }, []);

  // 初期ロード
  const loadInitialData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    try {
      if (typeof window !== 'undefined' && OneSignal.User) {
        await OneSignal.login(user.id);
      }
    } catch (e) {
      console.warn("OneSignal login skipped:", e);
    }

    try {
      // 1. チケット情報の取得
      const { data: profile } = await supabase
        .from('profiles')
        .select('ticket1_time, ticket2_time')
        .eq('id', user.id)
        .single();

      if (profile) {
        if (profile.ticket1_time) setTicket1Time(new Date(profile.ticket1_time));
        if (profile.ticket2_time) setTicket2Time(new Date(profile.ticket2_time));
      }

      // 2. 現在の論理的な月を判定してフル取得
      const now = new Date();
      const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
      let year = jstNow.getUTCFullYear();
      let month = jstNow.getUTCMonth() + 1;
      
      // 4時境界の補正 (1日の朝4時前なら前月を取得)
      if (jstNow.getUTCDate() === 1 && jstNow.getUTCHours() < 4) {
        const prev = new Date(jstNow);
        prev.setUTCDate(0);
        year = prev.getUTCFullYear();
        month = prev.getUTCMonth() + 1;
      }

      const fullMonthlyData = await fetchMonthlyData(year, month);
      
      // 両方のステートを更新（カレンダーは全件、タイマーは計算用に全件持たせる）
      setCalendarHistory(fullMonthlyData);
      setTimerHistory(fullMonthlyData);

    } catch (e) {
      console.error("Initial load error", e);
    } finally {
      setIsDataLoaded(true);
    }
  }, [fetchMonthlyData]);

  // カレンダーの月切り替え用
  const loadMonthlyData = useCallback(async (year: number, month: number) => {
    setIsSyncing(true);
    const data = await fetchMonthlyData(year, month);
    setCalendarHistory(data);
    setIsSyncing(false);
  }, [fetchMonthlyData]);

  const syncTickets = async (t1ISO?: string | null, t2ISO?: string | null) => {
    if (!isLoggedIn) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch('/api/tap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ ticket1Time: t1ISO, ticket2Time: t2ISO })
      });
    } catch (error) {
      console.error("Ticket sync failed", error);
    }
  };

  const handleTap = async () => { 
    if (!isLoggedIn || isSyncing) return;
    
    const now = new Date();
    const newTapMs = now.getTime();
    
    setTimerHistory(prev => [...prev, newTapMs]);
    setCalendarHistory(prev => [...prev, newTapMs]);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      // APIを叩くことで通知予約も同時に行う
      await fetch('/api/tap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ tapTime: now.toISOString() })
      });
    }
  };

  const handleInvite = async (ticketNumber: 1 | 2) => { 
    const now = new Date();
    let t1ISO = ticket1Time?.toISOString() || null;
    let t2ISO = ticket2Time?.toISOString() || null;

    if (ticketNumber === 1) { 
        setTicket1Time(now);
        t1ISO = now.toISOString();
    } else { 
        setTicket2Time(now);
        t2ISO = now.toISOString();
    }
    await syncTickets(t1ISO, t2ISO);
  };

  useEffect(() => { 
    if (isLoggedIn && !isLoading) loadInitialData(); 
  }, [isLoggedIn, isLoading, loadInitialData]);

  const lastTapTime = timerHistory.length > 0 ? new Date(timerHistory[timerHistory.length - 1]) : null;

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
                    tapHistory={timerHistory}
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
                    <HistoryCalendar tapHistory={calendarHistory} onMonthChange={loadMonthlyData} />
                  </div>
              )}
            </div>
            {/* Desktop View */}
            <div className="hidden min-[1000px]:flex flex-1 items-center justify-center p-6 h-[calc(100vh-64px)] overflow-hidden">
              <div className="grid grid-cols-2 gap-6 w-full max-w-[160svh] mx-auto items-stretch">
                <div className="flex flex-col justify-center">
                  <TimerDashboard
                    tapHistory={timerHistory}
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
                  <HistoryCalendar tapHistory={calendarHistory} onMonthChange={loadMonthlyData} />
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