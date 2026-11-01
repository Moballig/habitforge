'use client';

import { useMemo } from 'react';

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#F97316'];
const PIECE_COUNT = 40;

// Deterministic pseudo-random (pure — safe during render, unlike Math.random)
function rand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

interface Piece {
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotate: number;
}

export default function Confetti() {
  const pieces = useMemo<Piece[]>(() => {
    const out: Piece[] = [];
    for (let i = 0; i < PIECE_COUNT; i++) {
      out.push({
        left: rand(i + 1) * 100,
        delay: rand(i + 41) * 0.6,
        duration: 1.8 + rand(i + 97) * 1.4,
        color: COLORS[Math.floor(rand(i + 13) * COLORS.length)],
        size: 7 + rand(i + 71) * 7,
        rotate: rand(i + 29) * 360,
      });
    }
    return out;
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[90] pointer-events-none overflow-hidden"
    >
      {pieces.map((p, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size * 1.3}px`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
