"use client";

import React, { useEffect, useState, useCallback } from 'react';

interface EffectInstance {
  id: number;
  x: number;
  y: number;
}

export default function BlueArchiveTouchEffect() {
  const [effects, setEffects] = useState<EffectInstance[]>([]);

  const handlePointerDown = useCallback((e: PointerEvent) => {
    const id = Date.now();
    setEffects(prev => [...prev, { id, x: e.clientX, y: e.clientY }]);

    setTimeout(() => {
      setEffects(prev => prev.filter(effect => effect.id !== id));
    }, 800);
  }, []);

  useEffect(() => {
    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [handlePointerDown]);

  return (
    <div className="fixed inset-0 pointer-events-none z-9999 overflow-hidden">
      {effects.map(effect => (
        <div
          key={effect.id}
          className="absolute"
          style={{ 
            left: `${effect.x}px`, 
            top: `${effect.y}px`, 
            transform: 'translate(-50%, -50%)',
            width: '1px', 
            height: '1px' 
          }}
        >

          <svg className="ba-ring-container" width="100" height="100" viewBox="0 0 100 100" style={{ position: 'absolute', left: '-50px', top: '-50px' }}>
            <circle
              cx="50"
              cy="50"
              r="40"
              className="ba-glow-ring"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}