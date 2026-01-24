"use client";

import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { useEffect } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
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