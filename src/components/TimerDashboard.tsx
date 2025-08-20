"use client";

export const runtime = "edge";

import { useState, useEffect, useMemo } from 'react';
import { addHours, differenceInMilliseconds } from 'date-fns';
import CountdownDisplay from './CountdownDisplay';

// propsの型定義
interface TimerDashboardProps {
    lastTapTime: Date | null;
    ticket1Time: Date | null;
    ticket2Time: Date | null;
    onTap: (isFave: boolean) => void;
    onInvite: (ticketNumber: 1 | 2) => void;
    isSyncing: boolean;
}

export default function TimerDashboard({
    lastTapTime,
    ticket1Time,
    ticket2Time,
    onTap,
    onInvite,
    isSyncing,
}: TimerDashboardProps) {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // --- 計算ロジックはpropsで受け取った値を使う ---
    const studentsChangeRemaining = useMemo(() => {
        // 04:00または16:00までの残り時間を計算
        const hour = now.getHours();
        const nextChange = new Date(now);
        if (hour < 4) {
            nextChange.setHours(4, 0, 0, 0);
        } else if (hour < 16) {
            nextChange.setHours(16, 0, 0, 0);
        } else {
            // 翌日の4時
            nextChange.setDate(nextChange.getDate() + 1);
            nextChange.setHours(4, 0, 0, 0);
        }
        return differenceInMilliseconds(nextChange, now);
    }, [now]);
    const cafeTapRemaining = useMemo(() => {
        if (!lastTapTime) return 0;
        return differenceInMilliseconds(addHours(lastTapTime, 3), now);
    }, [now, lastTapTime]);
    const ticket1Remaining = useMemo(() => {
        if (!ticket1Time) return 0;
        return differenceInMilliseconds(addHours(ticket1Time, 20), now);
    }, [now, ticket1Time]);
    const ticket2Remaining = useMemo(() => {
        if (!ticket2Time) return 0;
        return differenceInMilliseconds(addHours(ticket2Time, 20), now);
    }, [now, ticket2Time]);


    return (
        <div className="p-4 sm:p-8 space-y-6 max-w-md mx-auto timer-dashboard-bg">
            <div className="timer-card">
                <h2 className="timer-card-title">Next Students Change</h2>
                <div className="countdown-text"><CountdownDisplay milliseconds={studentsChangeRemaining} /></div>
                <div className="timer-sub-info">
                    <span>▶</span>
                    <span>{now.getHours() < 4 || now.getHours() >= 16 ? "04:00" : "16:00"}</span>
                </div>
            </div>

            <div className="timer-card">
                <h2 className="timer-card-title">Next Cafe Tap</h2>
                <div className="countdown-text"><CountdownDisplay milliseconds={cafeTapRemaining} /></div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <button 
                        onClick={() => onTap(false)} 
                        disabled={cafeTapRemaining > 0 || isSyncing}
                        className="btn-timer btn-timer-tap"
                    >{ isSyncing ? '保存中…' : 'Tap' }</button>
                    <button 
                        onClick={() => onTap(true)} 
                        disabled={cafeTapRemaining > 0 || isSyncing}
                        className="btn-timer btn-timer-fave"
                    >{ isSyncing ? '保存中…' : 'Fave Tap' }</button>
                </div>
            </div>

            <div className="timer-card">
                <h2 className="timer-card-title">Next Invitation</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="countdown-text"><CountdownDisplay milliseconds={ticket1Remaining} /></div>
                    <div className="countdown-text"><CountdownDisplay milliseconds={ticket2Remaining} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <button 
                        onClick={() => onInvite(1)}
                        disabled={ticket1Remaining > 0 || isSyncing}
                        className="btn-timer btn-timer-inv"
                    >{ isSyncing ? '保存中…' : 'Ticket 1' }</button>
                    <button 
                        onClick={() => onInvite(2)}
                        disabled={ticket2Remaining > 0 || isSyncing}
                        className="btn-timer btn-timer-inv"
                    >{ isSyncing ? '保存中…' : 'Ticket 2' }</button>
                </div>
            </div>
        </div>
    );
}