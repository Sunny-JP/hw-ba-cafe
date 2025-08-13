"use client";

// ハンバーガーメニューアイコン
const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

interface HeaderProps {
    onMenuClick: () => void; // メニューボタンがクリックされたことを親に伝える
}

export default function Header({ onMenuClick }: HeaderProps) {
    return (
        <header className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-slate-100/80 backdrop-blur-sm shadow-sm">
            <h1 className="text-xl font-bold text-blue-600">カフェタイマー</h1>
            <button onClick={onMenuClick} className="p-2">
                <MenuIcon />
            </button>
        </header>
    );
}