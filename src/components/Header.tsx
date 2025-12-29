"use client";

import ThemeToggleButton from './ThemeToggleButton';

interface HeaderProps {
    onMenuClick?: () => void;
    isLoggedIn?: boolean;
}

export default function Header({ onMenuClick, isLoggedIn = false }: HeaderProps) {
    return (
        <header className="fixed top-0 left-0 right-0 z-20 flex items-center h-16 justify-between px-6 shadow-sm border-b">
            <h1>Café Timer</h1>
            <div className="flex items-center gap-4">
                <ThemeToggleButton />
                {isLoggedIn && (
                    <button 
                        onClick={onMenuClick}
                        className="p-2 rounded-full"
                        aria-label="メニューを開く"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                )}
            </div>
        </header>
    );
}