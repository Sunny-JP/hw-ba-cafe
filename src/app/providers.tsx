"use client";

import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { useEffect } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
  const Message = `
    ____        __      _____ _                         
   / ___|__ _  / _| ___|_   _(_)_ __ ___   ___ _ __ 
  | |   / _\` || |_ / _ \\ | | | | '_ \` _ \\ / _ \\ '__|
  | |__| (_| ||  _|  __/ | | | | | | | | |  __/ |   
   \\____\\__,_||_|  \\___| |_| |_|_| |_| |_|\\___|_|   

  >> Welcome, Sensei.
  >> I've been waiting for your next order.`;
    console.log("%c" + Message, "color: #7ad3ff; font-weight: bold; font-family: monospace;");
    
    const setSvh = () => {
      document.documentElement.style.setProperty('--svh', `${window.innerHeight}px`);
    };
    setSvh();
    window.addEventListener('resize', setSvh);
    return () => window.removeEventListener('resize', setSvh);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}