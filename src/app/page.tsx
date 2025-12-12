"use client";

export const runtime = "edge";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import TimerDashboard from "@/components/TimerDashboard";
import HistoryCalendar from '@/components/HistoryCalendar';
import Settings from '@/components/Settings';
import BottomNavBar from '@/components/BottomNavBar';

// --- ★ データ構造の定義を変更 ★ ---
// 個々のタップ記録の型
export interface TapEntry {
  timestamp: string;
  isOshi: boolean;
}

// Driveに保存する全体のデータ型
interface AppData {
  tapHistory: TapEntry[];
  ticket1Time: string | null;
  ticket2Time: string | null;
}

type Tab = 'timer' | 'history' | 'settings';

export default function Home() {
  const { user, accessToken, isLoading, login } = useAuth();
  
  const [tapHistory, setTapHistory] = useState<TapEntry[]>([]);
  const [ticket1Time, setTicket1Time] = useState<Date | null>(null);
  const [ticket2Time, setTicket2Time] = useState<Date | null>(null);

  const [driveFileId, setDriveFileId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const DRIVE_FILENAME = 'ba-cafe-timer-data.json';

  const [activeTab, setActiveTab] = useState<Tab>('timer');


  // --- ★ Google Driveへのデータ保存関数 (完全版) ★ ---
  const saveDataToDrive = useCallback(async (token: string, data: AppData, isCreating = false) => {
    if (isSyncing) return; // 同期中の多重実行を防ぐ
    setIsSyncing(true);

    const content = JSON.stringify(data);
    const blob = new Blob([content], { type: 'application/json' });
    const formData = new FormData();
    const metadata = { name: DRIVE_FILENAME, mimeType: 'application/json' };
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', blob);
    
    let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    let method: 'POST' | 'PATCH' = 'POST';

    // 既存ファイルがあれば更新(PATCH)、なければ新規作成(POST)
    if (!isCreating && driveFileId) {
        url = `https://www.googleapis.com/upload/drive/v3/files/${driveFileId}?uploadType=multipart`;
        method = 'PATCH';
    }

    try {
        const response = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: formData });
        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`Failed to save data: ${errorBody}`);
        }
        const result = await response.json();
        if (result.id) {
          setDriveFileId(result.id); // 新規作成時にファイルIDを保存
        }
    } catch (err) {
        console.error("Driveへの保存に失敗", err);
    } finally {
        setIsSyncing(false);
    }
  }, [driveFileId, isSyncing]);


  // --- ★ Google Driveからのデータ読み込み関数 (完全版) ★ ---
  const loadDataFromDrive = useCallback(async (token: string) => {
    try {
      const searchParams = new URLSearchParams({ q: `name='${DRIVE_FILENAME}' and 'root' in parents and trashed=false`, fields: 'files(id, name)' });
      const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?${searchParams}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!searchRes.ok) throw new Error('Failed to search file');
      const searchData = await searchRes.json();
      
      if (searchData.files && searchData.files.length > 0) {
        const fileId = searchData.files[0].id;
        setDriveFileId(fileId);
        const fileContentRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, { headers: { Authorization: `Bearer ${token}` } });
        if (!fileContentRes.ok) throw new Error('Failed to download file');
        
        const data: AppData & { lastTapTime?: string } = await fileContentRes.json(); // 古い形式も読めるように型定義
        
        // --- ★ 読み込みロジックを更新 ★ ---
        // tapHistoryがあればそれを使い、なければ古い形式(lastTapTime)から移行する
        if (data.tapHistory) {
          setTapHistory(data.tapHistory);
        } else if (data.lastTapTime) {
          // 古いデータ形式からの移行処理
          setTapHistory([{ timestamp: data.lastTapTime, isOshi: false }]);
        }
        
        if (data.ticket1Time) setTicket1Time(new Date(data.ticket1Time));
        if (data.ticket2Time) setTicket2Time(new Date(data.ticket2Time));
      } else {
        // 新規作成時は空の履歴で初期化
        const initialData: AppData = { tapHistory: [], ticket1Time: null, ticket2Time: null };
        await saveDataToDrive(token, initialData, true);
      }
    } catch (err) {
      console.error("Driveからの読み込みに失敗", err);
    }
  }, [saveDataToDrive]);


  // --- ★ handleTapのロジックを「追記」に変更 ★ ---
  const handleTap = async (isFave: boolean) => {
    const newEntry: TapEntry = {
      timestamp: new Date().toISOString(),
      isOshi: isFave,
    };
    // 既存の履歴に新しい記録を追加
    const newHistory = [...tapHistory, newEntry];
    setTapHistory(newHistory);

    if (accessToken) {
      const newData: AppData = { 
        tapHistory: newHistory, // 更新された完全な履歴を保存
        ticket1Time: ticket1Time?.toISOString() || null, 
        ticket2Time: ticket2Time?.toISOString() || null 
      };
      await saveDataToDrive(accessToken, newData);
    }
  };

  // --- handleInviteは履歴に影響しないので、tapHistoryをそのまま渡す ---
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
    if (accessToken) {
        await saveDataToDrive(accessToken, newData);
    }
  };

  useEffect(() => {
    if (user && accessToken) {
      loadDataFromDrive(accessToken);
    } else {
      setTapHistory([]); // ログアウト時に履歴をリセット
    }
  }, [user, accessToken, loadDataFromDrive]);

  // --- ★ TimerDashboardに渡すために最新のタップ時間を算出 ★ ---
  const lastTap = tapHistory.length > 0 ? tapHistory[tapHistory.length - 1] : null;
  const lastTapTime = lastTap ? new Date(lastTap.timestamp) : null;


  if (isLoading) {
    return <div className="text-center p-10">読み込み中...</div>;
  }
  
  const renderContent = () => {
    // Large screen layout
    return (
      <div className="hidden md:grid md:grid-cols-3 md:gap-4 p-4">
        <div className="md:col-span-2">
          <TimerDashboard 
            lastTapTime={lastTapTime}
            ticket1Time={ticket1Time}
            ticket2Time={ticket2Time}
            onTap={handleTap}
            onInvite={handleInvite}
            isSyncing={isSyncing}
          />
        </div>
        <div className="space-y-4">
          <HistoryCalendar tapHistory={tapHistory} />
          <Settings />
        </div>
      </div>
    );
  };

  const renderMobileContent = () => {
    switch (activeTab) {
      case 'timer':
        return (
          <TimerDashboard 
            lastTapTime={lastTapTime}
            ticket1Time={ticket1Time}
            ticket2Time={ticket2Time}
            onTap={handleTap}
            onInvite={handleInvite}
            isSyncing={isSyncing}
          />
        );
      case 'history':
        return <HistoryCalendar tapHistory={tapHistory} />;
      case 'settings':
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-background min-h-screen pb-16 md:pb-0">
      {!user ? (
          <div className="flex flex-col items-center justify-center h-screen p-8">
            <div className="card text-center !bg-card border border-muted">
                <h2 className="text-xl font-bold mb-4">ようこそ！</h2>
                <p className="mb-6 text-muted-foreground">タイマー機能を利用するには、Googleアカウントでログインしてください。</p>
                <button
                    onClick={() => login()}
                    className="btn btn-primary"
                >
                    <span>Googleでログイン</span>
                </button>
            </div>
          </div>
      ) : (
        <>
          {/* Desktop Layout */}
          {renderContent()}

          {/* Mobile Layout */}
          <div className="md:hidden">
            {renderMobileContent()}
          </div>
          
          <BottomNavBar activeTab={activeTab} setActiveTab={setActiveTab} />
        </>
      )}
    </div>
  );
}