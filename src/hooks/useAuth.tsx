"use client";

import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { createClient, User } from '@supabase/supabase-js';

// クライアントサイド用Supabaseインスタンス
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type AuthContextType = {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  loginWithDiscord: () => Promise<void>;
  logout: () => Promise<void>;
  avatarUrl: string | null;
  displayName: string | null;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. セッションの監視
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsLoading(false);
    };
    checkSession();

    // 2. ログイン状態の変化を購読
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithDiscord = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        // ログイン後に戻るURL (本番環境に合わせて自動調整)
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Discordから来るユーザー情報の抽出
  const avatarUrl = user?.user_metadata?.avatar_url || null;
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.custom_claims?.global_name || user?.email || "先生";

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoggedIn: !!user, 
      isLoading, 
      loginWithDiscord, 
      logout,
      avatarUrl,
      displayName
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};