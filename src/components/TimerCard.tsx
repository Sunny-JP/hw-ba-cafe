"use client";

import { ReactNode } from "react";

interface TimerCardProps {
    title: string;
    children: ReactNode;
}

export default function TimerCard({ title, children }: TimerCardProps) {
    return (
        <div className="timer-card">
            <h2 className="timer-card-title">{title}</h2>
            <div>{children}</div>
        </div>
    );
}