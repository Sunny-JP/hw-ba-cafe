"use client";

import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { createClient, User } from '@supabase/supabase-js';
import OneSignal from 'react-onesignal';

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
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsLoading(false);
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithDiscord = async () => {
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : undefined;
    
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: currentOrigin,
      },
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    try {
      await OneSignal.logout();
    } catch (e) {
      console.error("OneSignal logout error", e);
    }
    setUser(null);
  };

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