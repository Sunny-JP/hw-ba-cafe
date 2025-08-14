"use client";

import ThemeToggleButton from './ThemeToggleButton';

// ハンバーガーメニューアイコン
const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

interface HeaderProps {
    onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
    return (
        <header className="fixed top-0 left-0 right-0 z-20 flex items-center h-12 justify-between p-4 backdrop-blur-md shadow-md">
            <h1 className="text-lg font-bold text-foreground">カフェタイマー</h1>
            <div className="flex items-center gap-2">
                <ThemeToggleButton />
                <button onClick={onMenuClick} className="p-2 rounded-md hover:bg-secondary">
                    <MenuIcon />
                </button>
            </div>
        </header>
    );
}