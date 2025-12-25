import React from 'react';
import { useAuth } from '@/hooks/useAuth';

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-11.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

const MenuItemIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 1 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
);

const Settings = () => {
    const { user, logout } = useAuth();
    const menuItems = ['About', '利用規約', 'プライバシーポリシー', '運営者情報'];

    const handleLogoutClick = () => {
        if (window.confirm("本当にログアウトしますか？")) {
            logout();
        }
    };

    return (
    <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Settings</h1>
        <div className="space-y-4">
            <ul className="space-y-1">
                {menuItems.map(item => (
                    <li key={item}>
                        <a href="#" className="btn-sidepane">
                            <MenuItemIcon />
                            <span>{item}</span>
                        </a>
                    </li>
                ))}
            </ul>
            <div className="mt-8">
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Language</p>
                <div className="flex space-x-3 px-2">
                    <span>🇯🇵</span><span>🇺🇸</span><span>🇨🇳</span><span>🇰🇷</span>
                </div>
            </div>
            <div className="mt-auto">
                {user && (
                    <>
                        <div className="flex items-center gap-4 mb-2 p-2">
                            <img src={user.picture} alt="user avatar" className="w-10 h-10 rounded-full" />
                            <span className="font-semibold">{user.name}</span>
                        </div>
                        <button onClick={handleLogoutClick} className="btn-sidepane">
                            <LogoutIcon />
                            <span>ログアウト</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    </div>
    );
};

export default Settings;
