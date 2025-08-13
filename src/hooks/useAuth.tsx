"use client";

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { useGoogleLogin, googleLogout, TokenResponse } from '@react-oauth/google';

// --- 型定義 ---
interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

interface AuthContextType {
  user: UserProfile | null;
  accessToken: string | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}

// 1. Contextの器を作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 2. AuthProviderコンポーネント（アプリ全体に認証状態を共有する）
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleLogout = useCallback(() => {
    googleLogout();
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('googleAuthToken');
    localStorage.removeItem('userProfile');
  }, []);

  const handleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const accessToken = tokenResponse.access_token;
        setAccessToken(accessToken);

        const profileInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!profileInfoRes.ok) {
          throw new Error('Failed to fetch user profile');
        }

        const profileInfo = await profileInfoRes.json();
        setUser(profileInfo);

        localStorage.setItem('googleAuthToken', JSON.stringify(tokenResponse));
        localStorage.setItem('userProfile', JSON.stringify(profileInfo));
      } catch (error) {
        console.error("Login process failed:", error);
        // エラーが発生した場合はクリーンな状態に戻す
        handleLogout();
      }
    },
    onError: errorResponse => {
      console.error("Google Login Error:", errorResponse);
    },
    scope: 'https://www.googleapis.com/auth/drive.file',
  });

  useEffect(() => {
    const init = () => {
      try {
        const storedTokenStr = localStorage.getItem('googleAuthToken');
        const storedProfileStr = localStorage.getItem('userProfile');

        if (storedTokenStr && storedProfileStr) {
          const storedToken: TokenResponse = JSON.parse(storedTokenStr);
          const storedProfile: UserProfile = JSON.parse(storedProfileStr);
          setAccessToken(storedToken.access_token);
          setUser(storedProfile);
        }
      } catch (error) {
        console.error("Failed to initialize auth state from localStorage", error);
        handleLogout();
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [handleLogout]);

  // Contextに渡す値
  const value = { user, accessToken, isLoading, login: handleLogin, logout: handleLogout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. useAuthカスタムフック（各コンポーネントがこれを使ってContextの値にアクセスする）
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};