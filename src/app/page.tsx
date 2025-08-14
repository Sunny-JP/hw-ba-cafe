"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import StatsGraph from '@/components/StatsGraph';
import { parseISO } from 'date-fns';

export interface TapEntry {
  timestamp: string;
  isOshi: boolean;
}

const LoginIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
  </svg>
);

export default function Home() {
  const { user, accessToken, isLoading, login } = useAuth();
  
  const [tapHistory, setTapHistory] = useState<TapEntry[]>([]);
  const [isOshiTap, setIsOshiTap] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [driveFileId, setDriveFileId] = useState<string | null>(null);

  const DRIVE_FILENAME = 'bluearchive-cafe-timer-data.ndjson';
  const TAP_INTERVAL_HOURS = 3;

  const loadDataFromDrive = async (token: string) => {
    try {
      const searchParams = new URLSearchParams({
        q: `name='${DRIVE_FILENAME}' and 'root' in parents and trashed=false`,
        fields: 'files(id, name)',
      });
      const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?${searchParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!searchRes.ok) throw new Error('Failed to search file on Drive');
      const searchData = await searchRes.json();
      
      if (searchData.files && searchData.files.length > 0) {
        const fileId = searchData.files[0].id;
        setDriveFileId(fileId);
        const fileContentRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!fileContentRes.ok) throw new Error('Failed to download file content');
        
        const ndjsonText = await fileContentRes.text();
        if (ndjsonText && ndjsonText.trim() !== '') {
          const history = ndjsonText.trim().split('\n').map(line => JSON.parse(line));
          setTapHistory(history);
        }
      } else {
        await saveDataToDrive(token, [], true);
      }
    } catch (err) {
      console.error("Driveからの読み込みに失敗", err);
    }
  };

  const saveDataToDrive = async (token: string, history: TapEntry[], isCreating = false) => {
    if (!token) return;
    setIsSyncing(true);
    
    let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    let method: 'POST' | 'PATCH' = 'POST';

    if (!isCreating && driveFileId) {
      url = `https://www.googleapis.com/upload/drive/v3/files/${driveFileId}?uploadType=multipart`;
      method = 'PATCH';
    }

    const fileContent = history.length > 0 ? history.map(entry => JSON.stringify(entry)).join('\n') : '';
    const metadata = { name: DRIVE_FILENAME, mimeType: 'application/x-ndjson' };
    
    const body = new FormData();
    body.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    body.append('file', new Blob([fileContent], { type: 'application/x-ndjson' }));

    try {
        const response = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body });
        if (!response.ok) throw new Error('Failed to save data to Drive');
        const data = await response.json();
        if (data.id) setDriveFileId(data.id);
    } catch (err) {
        console.error("Driveへの保存に失敗", err);
    } finally {
        setIsSyncing(false);
    }
  };
  
  const handleTap = () => {
    const newEntry: TapEntry = {
      timestamp: new Date().toISOString(),
      isOshi: isOshiTap,
    };
    const newHistory = [...tapHistory, newEntry];
    setTapHistory(newHistory);
    if(accessToken) {
      saveDataToDrive(accessToken, newHistory);
    }
  };

  useEffect(() => {
    if (user && accessToken) {
      loadDataFromDrive(accessToken);
    } else {
      setTapHistory([]);
      setDriveFileId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, accessToken]);

  const lastTap = tapHistory.length > 0 ? tapHistory[tapHistory.length - 1] : null;
  const lastTapTime = lastTap ? parseISO(lastTap.timestamp) : null;
  const nextTapTime = lastTapTime ? new Date(lastTapTime.getTime() + (TAP_INTERVAL_HOURS * 60 * 60 * 1000)) : null;

  if (isLoading) {
    return <div className="text-center p-10">読み込み中...</div>;
  }
  
  return (
    <main className="flex flex-col items-center p-4 sm:p-8 text-foreground">
      <div className="w-full max-w-md mx-auto">
        {!user ? (
          <div className="card text-center">
            <h2 className="text-xl font-bold mb-4">ようこそ！</h2>
            <p className="mb-6">全ての機能を利用するには、Googleアカウントでログインしてください。</p>
            <button
                onClick={() => login()}
                className="btn btn-primary inline-flex items-center justify-center whitespace-nowrap"
            >
                <LoginIcon />
                <span>Googleでログイン</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="card">
              <h2 className="card-title">👋 なでなでタイマー</h2>
              <div className="my-4 flex items-center justify-center gap-2">
                <input 
                  type="checkbox" id="oshi-toggle" checked={isOshiTap}
                  onChange={(e) => setIsOshiTap(e.target.checked)}
                  className="w-4 h-4 accent-pink-500 cursor-pointer"
                />
                <label htmlFor="oshi-toggle" className="font-semibold text-pink-600 cursor-pointer">推しキャラのタップ</label>
              </div>
              
              <button onClick={handleTap} className="btn btn-primary w-full" disabled={isSyncing}>
                {isSyncing ? "保存中..." : "なでなでした！"}
              </button>

              <p className="mt-2"><strong>最後にタップした時間:</strong> {lastTapTime ? lastTapTime.toLocaleString('ja-JP') : '記録なし'}</p>
              <p><strong>次にタップ可能な時間:</strong> {nextTapTime ? nextTapTime.toLocaleString('ja-JP') : '---'}</p>
            </div>
            
            <div className="card">
              <StatsGraph tapHistory={tapHistory} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}