"use client";

import { useEffect, useState } from 'react';
import { auth, db, requestNotificationPermission, unregisterNotification } from "@/hooks/firebase"; 
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { doc, deleteDoc, onSnapshot } from "firebase/firestore";

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
    const [user, setUser] = useState<User | null>(null);
    const [isFcmRegistered, setIsFcmRegistered] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        let unsubDb: () => void;
        const unsubAuth = onAuthStateChanged(auth, (u) => {
            setUser(u);
            if (u) {
                unsubDb = onSnapshot(doc(db, "users", u.uid), (doc) => {
                    const data = doc.data();
                    setIsFcmRegistered(!!data?.fcmToken);
                });
            } else {
                setIsFcmRegistered(false);
            }
        });

        if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
        }

        return () => {
            unsubAuth();
            if (unsubDb) unsubDb();
        };
    }, []);

    const isLoggedIn = !!user;
    const displayName = (user as any)?.displayName || (user as any)?.email || "No Name";
    const avatar = (user as any)?.photoURL || null;
    
    const menuItems = ['About', '利用規約', 'プライバシーポリシー', '運営者情報'];

    const [isDeleting, setIsDeleting] = useState(false);
    const [isProcessingNotif, setIsProcessingNotif] = useState(false);

    const handleNotificationClick = async () => {
        if (!('Notification' in window)) {
            alert('このブラウザは通知をサポートしていません。');
            return;
        }
        const uid = auth.currentUser?.uid;
        if (!uid) {
            alert("ログインが必要です");
            return;
        }

        setIsProcessingNotif(true);

        try {
            if (notificationPermission === 'denied') {
                alert("通知がブロックされています。\nブラウザの設定から通知許可をリセットしてください。");
                return;
            }

            if (isFcmRegistered) {
                await unregisterNotification(uid);
                alert("通知設定をOFFにしました。");
            } else {
                const perm = await Notification.requestPermission();
                if (perm !== 'granted') {
                    alert("通知が許可されませんでした。");
                    return;
                }

                await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                    scope: '/',
                    updateViaCache: 'none' 
                });

                const tokenPromise = requestNotificationPermission(uid);
                const timeoutPromise = new Promise<boolean>((_, reject) => 
                    setTimeout(() => reject(new Error("タイムアウト: 応答がありません。ネットワーク環境を確認してください。")), 15000)
                );

                const success = await Promise.race([tokenPromise, timeoutPromise]);
                
                if (success) {
                    alert("通知設定をONにしました！");
                } else {
                    alert("設定に失敗しました。もう一度お試しください。");
                }
                
                setNotificationPermission(Notification.permission);
            }
        } catch (error: any) {
            console.error(error);
            alert(`エラーが発生しました: ${error.message}`);
        } finally {
            setIsProcessingNotif(false);
        }
    };

    const getNotificationButtonText = () => {
        if (notificationPermission === 'denied') return '通知: ブロック中';
        if (isFcmRegistered) return '通知OFF';
        return '通知ON';
    };
    
    const getNotificationButtonClass = () => {
        return "cal-nav flex items-center justify-center p-2 rounded w-full ";
    };

    const handleLogoutClick = async () => {
        if (window.confirm("本当にログアウトしますか？\n（ログアウトしてもデータは削除されません）")) {
            await signOut(auth);
            window.location.href = '/';
        }
    };

    const handleDeleteData = async () => {
        if (!window.confirm("本当に全データを削除しますか？")) return;
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, "users", uid));
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    await registration.unregister();
                }
            }
            await signOut(auth);
            alert("データを削除しました。\nログアウトします。");
            window.location.href = "/";
        } catch (err: any) {
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
                    <li key={item}>
                        <a href="#" className="btn-setting flex items-center p-2 rounded">
                            <MenuItemIcon />
                            <span>{item}</span>
                        </a>
                    </li>
                ))}
            </ul>

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
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <button 
                                onClick={handleNotificationClick}
                                disabled={isProcessingNotif}
                                className={getNotificationButtonClass()}
                            >
                                <BellIcon />
                                <span>{isProcessingNotif ? '処理中...' : getNotificationButtonText()}</span>
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