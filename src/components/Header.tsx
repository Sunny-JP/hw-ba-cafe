"use client";

export const runtime = "edge";

import ThemeToggleButton from './ThemeToggleButton';

export default function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-20 flex items-center h-12 justify-between p-6 backdrop-blur-md shadow-md bg-background">
            <h1 className="header" style={{ color: "var(--foreground)" }}>Café Timer</h1>
            <div className="flex items-center gap-2">
                <ThemeToggleButton />
            </div>
        </header>
    );
}