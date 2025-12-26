"use client";

import React, { useEffect, useState } from 'react';
import { auth, db } from "@/hooks/firebase";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const LogoutIcon = ({ className = 'h-5 w-5 mr-2' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

const MenuItemIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 1 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
);

const TrashIcon = ({ className = 'h-5 w-5 mr-2' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M7 7h10" />
    </svg>
);

const Settings = () => {
    const [user, setUser] = useState<User | null>(null);
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, u => setUser(u));
        return () => unsub();
    }, []);
    const isLoggedIn = !!user;
    const displayName = (user as any)?.displayName || (user as any)?.email || "No Name";
    const avatar = (user as any)?.photoURL || null;
    
    const menuItems = ['About', '利用規約', 'プライバシーポリシー', '運営者情報'];

    const [isDeleting, setIsDeleting] = useState(false);

    const handleLogoutClick = async () => {
        if (window.confirm("本当にログアウトしますか？")) {
            try {
                await signOut(auth);
                window.location.href = '/';
            } catch (err) {
                console.error("ログアウトに失敗しました", err);
                alert("ログアウトに失敗しました");
            }
        }
    };

    const handleDeleteData = async () => {
        if (!window.confirm("本当にすべてのデータを削除しますか？ この操作は取り消せません。")) return;
        const uid = auth.currentUser?.uid;
        if (!uid) {
            alert("ユーザーが見つかりません。ログインし直してください。");
            return;
        }
        setIsDeleting(true);
        try {
            await setDoc(doc(db, "users", uid), { tapHistory: [], ticket1Time: null, ticket2Time: null }, { merge: true });
            alert("データを削除しました。");
            window.location.reload();
        } catch (err) {
            console.error("データ削除に失敗しました", err);
            alert("データ削除に失敗しました。");
        } finally {
            setIsDeleting(false);
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
            {/* Mobile View (Tabs) 
            <div className="mt-8">
                <p className="text-sm" style={{ color: "var(--secondary-foreground)" }}>Language</p>
                <div className="flex space-x-3 px-2 mt-2">
                    <span className="cursor-pointer text-xl">🇯🇵</span>
                    <span className="cursor-pointer text-xl">🇺🇸</span>
                    <span className="cursor-pointer text-xl">🇨🇳</span>
                    <span className="cursor-pointer text-xl">🇰🇷</span>
                </div>
            </div>
            */}
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
                        <div className="flex items-center justify-center gap-4">
                            <button 
                                onClick={handleDeleteData}
                                disabled={isDeleting}
                                className="cal-nav flex items-center justify-center p-2 rounded"
                                aria-label="すべてのデータを削除"
                            >
                                {isDeleting ? (
                                    <>
                                        <TrashIcon className="h-5 w-5 mr-2 opacity-50" />
                                        <span>削除中…</span>
                                    </>
                                ) : (
                                    <>
                                        <TrashIcon />
                                        <span>データ削除</span>
                                    </>
                                )}
                            </button>

                            <button 
                                onClick={handleLogoutClick} 
                                className="cal-nav flex items-center justify-center p-2 rounded"
                            >
                                <LogoutIcon />
                                <span>ログアウト</span>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    </div>
    );
};

export default Settings;