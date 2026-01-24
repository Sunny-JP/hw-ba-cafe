"use client";

import { useState, useEffect, useMemo } from 'react';
import { addHours, differenceInMilliseconds } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import CountdownDisplay from './CountdownDisplay';
import { getSessionEndTime } from '@/lib/timeUtils';

const JST_TZ = 'Asia/Tokyo';

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
    
    const userTimeZone = useMemo(() => {
        if (typeof window !== 'undefined') {
            try {
                return Intl.DateTimeFormat().resolvedOptions().timeZone;
            } catch (e) {
                return JST_TZ;
            }
        }
        return JST_TZ;
    }, []);

    const isJst = userTimeZone === JST_TZ;

    useEffect(() => {
        setNow(new Date());
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const cafeTapRemaining = useMemo(() => {
        if (!lastTapTime) return 0;
        const endTime = getSessionEndTime(lastTapTime);
        if (!endTime) return 0;
        return Math.max(0, differenceInMilliseconds(endTime, now));
    }, [now, lastTapTime]);

    const canTapCafe = useMemo(() => {
        if (!isDataLoaded) return false;
        if (!lastTapTime) return true;
        return cafeTapRemaining <= 0;
    }, [isDataLoaded, lastTapTime, cafeTapRemaining]);

    const ticket1Remaining = useMemo(() => {
        if (!ticket1Time) return 0;
        return differenceInMilliseconds(addHours(ticket1Time, 20), now);
    }, [now, ticket1Time]);
    const ticket2Remaining = useMemo(() => {
        if (!ticket2Time) return 0;
        return differenceInMilliseconds(addHours(ticket2Time, 20), now);
    }, [now, ticket2Time]);

    const dailySlots = useMemo(() => {
        let cycleStart = new Date(now);
        const currentHourJst = parseInt(formatInTimeZone(now, JST_TZ, 'H'), 10);
        if (currentHourJst < 4) {
            cycleStart = addHours(cycleStart, -24);
        }
        const cycleStartStr = formatInTimeZone(cycleStart, JST_TZ, "yyyy-MM-dd'T'04:00:00");
        cycleStart = new Date(cycleStartStr);

        return Array.from({ length: 8 }, (_, i) => {
            const start = addHours(cycleStart, i * 3);
            const end = addHours(start, 3);
            
            const timeJst = formatInTimeZone(start, JST_TZ, 'HH:mm');
            const timeLocal = formatInTimeZone(start, userTimeZone, 'HH:mm');
            
            let mainLabel = timeJst;
            let subLabel = null;

            if (!isJst) {
                mainLabel = timeLocal;
                subLabel = `${timeJst} JST`;
            }
            const tapEntry = (tapHistory || []).find((t) => {
                return t >= start.getTime() && t < end.getTime();
            });
            const tapTimeLocal = tapEntry ? formatInTimeZone(tapEntry, userTimeZone, 'HH:mm') : null;
            const tapTimeJst = tapEntry ? formatInTimeZone(tapEntry, JST_TZ, 'HH:mm') : null;
            return {
                mainLabel,
                subLabel,
                tapTimeLocal,
                tapTimeJst,
                isCurrent: now >= start && now < end,
                hasTapped: !!tapEntry
            };
        });
    }, [tapHistory, now, userTimeZone, isJst]);

    return (
        <div className="dashboard-container">
            <div className="timer-card">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="timer-card-title">Next Tap</h2>
                </div>

                <div className="countdown-text-l mb-6">
                    <CountdownDisplay milliseconds={cafeTapRemaining} />
                </div>

                <div className="slot-grid">
                    {dailySlots.map((slot, i) => (
                        <div 
                            key={i}
                            className={`slot-item ${
                                slot.hasTapped 
                                    ? 'slot-tapped' 
                                    : slot.isCurrent
                                        ? 'slot-current'
                                        : 'slot-default'
                            }`}
                        >
                            {slot.hasTapped ? (
                                <div className="flex flex-col items-center leading-tight">
                                    <span className="slot-text-main">{slot.tapTimeLocal}</span>
                                    {!isJst && (
                                        <span className="slot-text-sub whitespace-nowrap">
                                            ({slot.tapTimeJst} JST)
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center leading-tight">
                                    <span className="slot-text-main">{slot.mainLabel}</span>
                                    {slot.subLabel && (
                                        <span className="slot-text-sub whitespace-nowrap">
                                            ({slot.subLabel})
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <button 
                    onClick={() => onTap()} 
                    disabled={!canTapCafe || isSyncing}
                    className="btn-timer btn-timer-tap"
                >
                    { !isDataLoaded ? 'Wait...' : isSyncing ? 'Wait...' : 'Tap' }
                </button>
            </div>

            <div className="timer-card">
                <h2 className="timer-card-title mb-4">Next Call</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <div className="countdown-text-s bg-background/50 p-2 rounded">
                            <CountdownDisplay milliseconds={ticket1Remaining} />
                        </div>
                        <button 
                            onClick={() => onInvite(1)}
                            disabled={!isDataLoaded || ticket1Remaining > 0 || isSyncing}
                            className="btn-timer btn-timer-tap"
                        >{ isSyncing ? 'Wait...' : 'Ticket 1' }</button>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="countdown-text-s bg-background/50 p-2 rounded">
                            <CountdownDisplay milliseconds={ticket2Remaining} />
                        </div>
                        <button 
                            onClick={() => onInvite(2)}
                            disabled={!isDataLoaded || ticket2Remaining > 0 || isSyncing}
                            className="btn-timer btn-timer-tap"
                        >{ isSyncing ? 'Wait...' : 'Ticket 2' }</button>
                    </div>
                </div>
            </div>
        </div>
    );
}