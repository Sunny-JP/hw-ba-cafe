"use client";

import { useState, useEffect, useMemo } from 'react';
import { addHours, differenceInMilliseconds } from 'date-fns';
import CountdownDisplay from './CountdownDisplay';
import { getNextBoundary, getSessionEndTime } from '@/lib/timeUtils';

interface TimerDashboardProps {
    tapHistory: number[];
    lastTapTime: Date | null;
    ticket1Time: Date | null;
    ticket2Time: Date | null;
    onTap: () => void;
    onInvite: (ticketNumber: 1 | 2) => void;
    isSyncing: boolean;
    isDataLoaded: boolean;
}

export default function TimerDashboard({
    tapHistory,
    lastTapTime,
    ticket1Time,
    ticket2Time,
    onTap,
    onInvite,
    isSyncing,
    isDataLoaded,
}: TimerDashboardProps) {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        setNow(new Date());
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const nextBoundary = useMemo(() => {
        return getNextBoundary(now);
    }, [now]);

    const studentsChangeRemaining = useMemo(() => {
        return Math.max(0, differenceInMilliseconds(nextBoundary, now));
    }, [now, nextBoundary]);

    const nextVisitLabel = useMemo(() => {
        const h = nextBoundary.getHours();
        const hourStr = h.toString().padStart(2, '0');
        return `${hourStr}:00 JST`;
    }, [nextBoundary]);

    const cafeTapRemaining = useMemo(() => {
        if (!lastTapTime) return 0;
        const endTime = getSessionEndTime(lastTapTime);
        if (!endTime) return 0;
        return Math.max(0, differenceInMilliseconds(endTime, now));
    }, [now, lastTapTime]);

    const canTapCafe = useMemo(() => {
        if (!isDataLoaded) return false;
        if (!lastTapTime) return true;
        return cafeTapRemaining <= 600000;
    }, [isDataLoaded, lastTapTime, cafeTapRemaining]);

    const ticket1Remaining = useMemo(() => {
        if (!ticket1Time) return 0;
        return differenceInMilliseconds(addHours(ticket1Time, 20), now);
    }, [now, ticket1Time]);
    const ticket2Remaining = useMemo(() => {
        if (!ticket2Time) return 0;
        return differenceInMilliseconds(addHours(ticket2Time, 20), now);
    }, [now, ticket2Time]);

    const windowStarts = useMemo(() => {
        let cycleStart = new Date(nextBoundary);
        if (nextBoundary.getHours() === 4) {
            cycleStart = addHours(cycleStart, -24);
        } else {
            cycleStart = addHours(cycleStart, -12);
        }
        return Array.from({ length: 8 }, (_, i) => addHours(cycleStart, i * 3));
    }, [nextBoundary]);

    const completedMarkers = useMemo(() => {
        return windowStarts.map((start) => {
            return (tapHistory || []).some((entry) => {
                const t = new Date(entry);
                return t >= start && t < addHours(start, 3);
            });
        });
    }, [windowStarts, tapHistory]);

    return (
        <div className="dashboard-container">
            <div className="timer-card">
                <div className="flex items-center justify-between">
                    <h2 className="timer-card-title compact">Next Visit</h2>
                    <div className="timer-sub-info">
                        <span>▶</span>
                        <span>{nextVisitLabel}</span>
                    </div>
                </div>
                <div className="countdown-text-l"><CountdownDisplay milliseconds={studentsChangeRemaining} /></div>
            </div>

            <div className="timer-card">
                <div className="flex items-center justify-between">
                    <h2 className="timer-card-title">Next Tap</h2>
                    <div className="tap-markers" role="list">
                        {windowStarts.map((_start, i) => {
                            const completed = completedMarkers[i];
                            return (
                                <div
                                    key={i}
                                    className={`tap-marker ${completed ? 'completed' : ''}`}
                                />
                            );
                        })}
                    </div>
                </div>
                <div className="countdown-text-l"><CountdownDisplay milliseconds={cafeTapRemaining} /></div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                    <button 
                        onClick={() => onTap()} 
                        disabled={!canTapCafe || isSyncing}
                        className="btn-timer btn-timer-tap"
                    >
                        { !isDataLoaded ? 'Wait...' : isSyncing ? 'Wait...' : 'Tap' }
                    </button>
                    <div className="flex flex-col items-center justify-center text-center">
                        <span className="history-title text-muted-foreground">Last Tap</span>
                        <span className="history-text">
                            {lastTapTime 
                                ? lastTapTime.toLocaleString("ja-JP", { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                                : 'None'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="timer-card">
                <h2 className="timer-card-title">Next Call</h2>
                <div className="grid grid-cols-2 gap-3">
                    <div className="countdown-text-s"><CountdownDisplay milliseconds={ticket1Remaining} /></div>
                    <div className="countdown-text-s"><CountdownDisplay milliseconds={ticket2Remaining} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                    <button 
                        onClick={() => onInvite(1)}
                        disabled={!isDataLoaded || ticket1Remaining > 0 || isSyncing}
                        className="btn-timer btn-timer-tap"
                    >{ isSyncing ? 'Wait' : 'Ticket 1' }</button>
                    <button 
                        onClick={() => onInvite(2)}
                        disabled={!isDataLoaded || ticket2Remaining > 0 || isSyncing}
                        className="btn-timer btn-timer-tap"
                    >{ isSyncing ? 'Wait' : 'Ticket 2' }</button>
                </div>
            </div>
        </div>
    );
}