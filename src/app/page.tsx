"use client";

import { useState, useEffect } from 'react';
import { useGoogleLogin, googleLogout, CredentialResponse } from '@react-oauth/google';

// --- 型定義 ---
interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

interface DriveFile {
    id: string;
    name: string;
}

// --- メインコンポーネント ---
export default function Home() {
  // --- 状態管理 (State) ---
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tapHistory, setTapHistory] = useState<string[]>([]);
  const [driveFileId, setDriveFileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const DRIVE_FILENAME = 'bluearchive-cafe-timer-data.json';
  const TAP_INTERVAL_HOURS = 3;
  
  // --- 認証処理 ---
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setAccessToken(tokenResponse.access_token);

      // ユーザー情報を取得
      const profileInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      const profileInfo = await profileInfoRes.json();
      setUser(profileInfo);
      
      // Driveからデータを読み込み
      await loadDataFromDrive(tokenResponse.access_token);
      setIsLoading(false);
    },
    onError: errorResponse => console.error(errorResponse),
    scope: 'https://www.googleapis.com/auth/drive.file',
  });

  const logout = () => {
    googleLogout();
    setUser(null);
    setAccessToken(null);
    setTapHistory([]);
    setDriveFileId(null);
  };

  // --- Google Drive連携処理 (fetch APIを使用) ---
  const loadDataFromDrive = async (token: string) => {
    try {
      // 1. ファイルを検索
      const searchParams = new URLSearchParams({
        q: `name='${DRIVE_FILENAME}' and 'root' in parents and trashed=false`,
        fields: 'files(id, name)',
      });
      const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?${searchParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const searchData = await searchRes.json();
      
      if (searchData.files && searchData.files.length > 0) {
        // 2a. ファイルが見つかった場合 -> 読み込む
        const fileId = searchData.files[0].id;
        setDriveFileId(fileId);
        const fileContentRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const history = await fileContentRes.json() as string[];
        setTapHistory(history);
      } else {
        // 2b. ファイルが見つからない場合 -> 新規作成
        await saveDataToDrive(token, [], true);
      }
    } catch (err) {
      console.error("Driveからの読み込みに失敗", err);
    }
  };

  const saveDataToDrive = async (token: string, history: string[], isCreating = false) => {
    if (!token) return;
    setIsSyncing(true);
    
    // APIのエンドポイントとHTTPメソッドを決定
    let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    let method: 'POST' | 'PATCH' = 'POST';

    if (!isCreating && driveFileId) {
      url = `https://www.googleapis.com/upload/drive/v3/files/${driveFileId}?uploadType=multipart`;
      method = 'PATCH';
    }

    // 送信するデータを作成 (Multipart形式)
    const metadata = { name: DRIVE_FILENAME, mimeType: 'application/json' };
    const fileContent = JSON.stringify(history);
    
    const body = new FormData();
    body.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    body.append('file', new Blob([fileContent], { type: 'application/json' }));

    try {
        const response = await fetch(url, {
            method: method,
            headers: { Authorization: `Bearer ${token}` },
            body: body,
        });
        const data = await response.json();
        if (data.id) {
          setDriveFileId(data.id);
        }
    } catch (err) {
        console.error("Driveへの保存に失敗", err);
    } finally {
        setIsSyncing(false);
    }
  };
  
  // --- イベントハンドラ ---
  const handleTap = () => {
    const newHistory = [...tapHistory, new Date().toISOString()];
    setTapHistory(newHistory);
    if(accessToken) {
      saveDataToDrive(accessToken, newHistory);
    }
  };

  // --- 表示用データ計算 (変更なし) ---
  const lastTapTime = tapHistory.length > 0 ? new Date(tapHistory[tapHistory.length - 1]) : null;
  const nextTapTime = lastTapTime ? new Date(lastTapTime.getTime() + TAP_INTERVAL_HOURS * 60 * 60 * 1000) : null;
  const today = new Date().toLocaleDateString('ja-JP');
  const todayTapsCount = tapHistory.filter(iso => new Date(iso).toLocaleDateString('ja-JP') === today).length;

  // --- レンダリング (変更なし) ---
  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-slate-100 text-gray-800">
      <div className="w-full max-w-md mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600">ブルアカ カフェタイマー</h1>
          <p className="text-slate-500 mt-2">Next.js + fetch API Edition</p>
        </header>

        {!user ? (
          <div className="card text-center">
            <h2 className="card-title">🔐 Googleアカウント連携</h2>
            <p>Googleドライブにデータを保存し、どの端末からでも同じ履歴を利用できます。</p>
            <button onClick={() => login()} className="btn btn-primary mt-4" disabled={isLoading}>
              {isLoading ? "処理中..." : "Googleアカウントでログイン"}
            </button>
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <div className='flex items-center justify-center gap-3'>
                <img src={user.picture} alt="user avatar" className='w-10 h-10 rounded-full' />
                <span className="font-semibold">{user.name}としてログイン中</span>
              </div>
              <button onClick={logout} className="text-sm text-slate-500 hover:text-blue-600 mt-2">ログアウト</button>
            </div>
            
            <div className="card">
              <h2 className="card-title">👋 なでなでタイマー</h2>
              <button onClick={handleTap} className="btn btn-primary w-full" disabled={isSyncing}>
                {isSyncing ? "保存中..." : "なでなでした！"}
              </button>
              <p className="mt-2"><strong>最後にタップした時間:</strong> {lastTapTime ? lastTapTime.toLocaleString('ja-JP') : '記録なし'}</p>
              <p><strong>次にタップ可能な時間:</strong> {nextTapTime ? nextTapTime.toLocaleString('ja-JP') : '---'}</p>
            </div>
            
            <div className="card">
              <h2 className="card-title">📊 タップ統計</h2>
              <p><strong>総タップ回数:</strong> {tapHistory.length}回</p>
              <p><strong>今日のタップ回数:</strong> {todayTapsCount}回</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}