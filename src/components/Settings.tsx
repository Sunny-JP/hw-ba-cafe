"use client";

import React, { useEffect, useState } from 'react';
// useAuth は使用しない（プロジェクトの Firebase 認証を直接使う）
import { auth } from "@/hooks/firebase";
import { signOut, onAuthStateChanged, User } from "firebase/auth";

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
    // Firebase Auth を直接監視してユーザー情報を取得
    const [user, setUser] = useState<User | null>(null);
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, u => setUser(u));
        return () => unsub();
    }, []);
    const isLoggedIn = !!user;
    const displayName = (user as any)?.displayName || (user as any)?.email || "No Name";
    const avatar = (user as any)?.photoURL || null;
    
    const menuItems = ['About', '利用規約', 'プライバシーポリシー', '運営者情報'];

    const handleLogoutClick = async () => {
        if (window.confirm("本当にログアウトしますか？")) {
            try {
                await signOut(auth);
                // ログアウト完了後はルートへ戻す
                window.location.href = '/';
            } catch (err) {
                console.error("ログアウトに失敗しました", err);
                alert("ログアウトに失敗しました");
            }
        }
    };

    return (
    <div className="p-4">
        <div className="space-y-4">
            <ul className="space-y-1">
                {menuItems.map(item => (
                    <li key={item}>
                        <a href="#" className="btn-setting flex items-center p-2 rounded">
                            <MenuItemIcon />
                            <span>{item}</span>
                        </a>
                    </li>
                ))}
            </ul>
            <div className="mt-8">
                <p className="text-sm" style={{ color: "var(--secondary-foreground)" }}>Language</p>
                <div className="flex space-x-3 px-2 mt-2">
                    <span className="cursor-pointer text-xl">🇯🇵</span>
                    <span className="cursor-pointer text-xl">🇺🇸</span>
                    <span className="cursor-pointer text-xl">🇨🇳</span>
                    <span className="cursor-pointer text-xl">🇰🇷</span>
                </div>
            </div>
            <div className="mt-8 border-t pt-4">
                {isLoggedIn && (
                    <>
                        <div className="flex items-center gap-4 mb-4 p-2">
                            {avatar ? (
                                <img src={avatar} alt="user avatar" className="w-10 h-10 rounded-full" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                                    <span className="text-xl">?</span>
                                </div>
                            )}
                            <div className="flex flex-col">
                                <span className="font-semibold">{displayName}</span>
                            </div>
                        </div>
                        <button 
                            onClick={handleLogoutClick} 
                            className="cal-nav w-full flex items-center justify-center p-2 rounded"
                        >
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