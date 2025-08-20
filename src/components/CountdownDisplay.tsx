"use client";

import { useMemo } from 'react';

interface CountdownDisplayProps {
    milliseconds: number;
}

export default function CountdownDisplay({ milliseconds }: CountdownDisplayProps) {
    const { hours, minutes, seconds } = useMemo(() => {
        const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
        const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        return { hours, minutes, seconds };
    }, [milliseconds]);

    return (
        <div className="countdown-text">
            <span>{hours}</span>:
            <span>{minutes}</span>:
            <span>{seconds}</span>
        </div>
    );
}