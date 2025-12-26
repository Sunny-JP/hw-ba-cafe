"use client";

export const runtime = "edge";

import { useState, useEffect, useMemo } from 'react';
import { addHours, differenceInMilliseconds } from 'date-fns';
import CountdownDisplay from './CountdownDisplay';


interface TapEntry {
    timestamp: string;
}
interface TimerDashboardProps {
    tapHistory: TapEntry[];
    lastTapTime: Date | null;
    ticket1Time: Date | null;
    ticket2Time: Date | null;
    onTap: () => void;
    onInvite: (ticketNumber: 1 | 2) => void;
    isSyncing: boolean;
}

export default function TimerDashboard({
    tapHistory,
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

    const studentsChangeRemaining = useMemo(() => {
        const hour = now.getHours();
        const nextChange = new Date(now);
        if (hour < 4) {
            nextChange.setHours(4, 0, 0, 0);
        } else if (hour < 16) {
            nextChange.setHours(16, 0, 0, 0);
        } else {
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


    const baseStart = useMemo(() => {
        const d = new Date(now);
        d.setHours(4, 0, 0, 0);
        if (now < d) {
            d.setDate(d.getDate() - 1);
        }
        return d;
    }, [now]);

    const windowStarts = useMemo(() => {
        return Array.from({ length: 8 }, (_, i) => addHours(new Date(baseStart), i * 3));
    }, [baseStart]);

    const completedMarkers = useMemo(() => {
        return windowStarts.map((start) => {
            return (tapHistory || []).some((entry) => {
                const t = new Date(entry.timestamp);
                return t >= start && t < addHours(start, 3);
            });
        });
    }, [windowStarts, tapHistory]);

    return (
        <div className="p-4 space-y-6">
            <div className="timer-card">
                <div className="flex items-center justify-between">
                    <h2 className="timer-card-title compact">Next Students Change</h2>
                    <div className="timer-sub-info compact">
                        <span>▶</span>
                        <span>{now.getHours() < 4 || now.getHours() >= 16 ? "04:00" : "16:00"}</span>
                    </div>
                </div>
                <div className="countdown-text-l"><CountdownDisplay milliseconds={studentsChangeRemaining} /></div>
            </div>

            <div className="timer-card">
                <div className="flex items-center justify-between">
                    <h2 className="timer-card-title">Next Cafe Tap</h2>
                    <div className="tap-markers" role="list" aria-label="時間帯マーカー">
                        {windowStarts.map((start, i) => {
                            const completed = completedMarkers[i];
                            return (
                                <div
                                    key={i}
                                    aria-label={`window-${i}`}
                                    title={`${start.getHours()}:00 - ${addHours(start,3).getHours()-1}:59`}
                                    className={`tap-marker ${completed ? 'completed' : ''}`}
                                />
                            );
                        })}
                    </div>
                </div>
                <div className="countdown-text-l"><CountdownDisplay milliseconds={cafeTapRemaining} /></div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <button 
                        onClick={() => onTap()} 
                        disabled={cafeTapRemaining > 0 || isSyncing}
                        className="btn-timer btn-timer-tap"
                    >{ isSyncing ? '保存中…' : 'Tap' }</button>
                    <div className="flex flex-col items-center justify-center text-center">
                        <span className="history-title text-muted-foreground">Last Tap</span>
                        <span className="history-text">
                            {lastTapTime 
                                ? lastTapTime.toLocaleString("ja-JP", { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                                : 'なし'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="timer-card">
                <h2 className="timer-card-title">Next Invitation</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="countdown-text-s"><CountdownDisplay milliseconds={ticket1Remaining} /></div>
                    <div className="countdown-text-s"><CountdownDisplay milliseconds={ticket2Remaining} /></div>
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