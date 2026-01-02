"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, supabase } from "@/hooks/useAuth"; 
import OneSignal from 'react-onesignal';

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
const BellIcon = ({ className = 'h-5 w-5 mr-2' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);

interface SettingsProps {}

const Settings = ({}: SettingsProps) => {
    const { isLoggedIn, logout, avatarUrl, displayName } = useAuth();
    const [isDeleting, setIsDeleting] = useState(false);

    const menuItems = [
        { label: 'About', path: '/about' },
        { label: '利用規約', path: '/terms' },
        { label: 'プライバシーポリシー', path: '/privacy' },
        { label: '運営者情報', path: '/operator' },
    ];

    const handleNotificationClick = async () => {
        try {
            if (!OneSignal.User) {
                alert("通知システムを読み込み中です。少々お待ちください。");
                return;
            }

            const isOptedIn = OneSignal.User.PushSubscription.optedIn;

            if (isOptedIn) {
                await OneSignal.User.PushSubscription.optOut();
                alert("通知をOFFにしました。");
            } else {
                await OneSignal.User.PushSubscription.optIn();
                await OneSignal.Slidedown.promptPush();
                
                alert("通知をONにしました！");
            }
        } catch (e) {
            console.error(e);
            alert("設定の変更に失敗しました。\nブラウザの通知許可設定をご確認ください。");
        }
    };

    const handleLogoutClick = async () => {
        if (window.confirm("ログアウトしますか？\n（データは削除されません）")) {
            await logout();
            window.location.href = '/';
        }
    };

    const handleDeleteData = async () => {
        if (!window.confirm("本当に全データを削除しますか？\n（この操作は取り消せません）")) return;
        
        setIsDeleting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('profiles').delete().eq('id', user.id);
                await logout();
                alert("データを削除しました。");
                window.location.href = "/";
            }
        } catch (err: any) {
            console.error(err);
            alert("削除に失敗しました: " + err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
    <div className="p-4">
        <div className="space-y-4">
            <ul className="space-y-1">
                {menuItems.map(item => (
                    <li key={item.label}>
                        <Link href={item.path} className="btn-setting flex items-center p-2 rounded">
                            <MenuItemIcon />
                            <span>{item.label}</span>
                        </Link>
                    </li>
                ))}
            </ul>

            <div className="mt-8 border-t pt-4">
                {isLoggedIn && (
                    <>
                        <div className="flex items-center gap-4 mb-4 p-2">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="user avatar" className="w-10 h-10 rounded-full" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                                    <span className="text-xl">?</span>
                                </div>
                            )}
                            <div className="flex flex-col">
                                <span className="font-semibold">{displayName}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <button 
                                onClick={handleNotificationClick}
                                className="cal-nav flex items-center justify-center p-2 rounded w-full"
                            >
                                <BellIcon />
                                <span>通知設定</span>
                            </button>

                            <button 
                                onClick={handleDeleteData}
                                disabled={isDeleting}
                                className="cal-nav flex items-center justify-center p-2 rounded"
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