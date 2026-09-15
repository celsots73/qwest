'use client';
import { useEffect, useState } from 'react';

const COLORS = ['#9333ea', '#f59e0b', '#ec4899', '#22d3ee', '#4ade80', '#f97316'];

interface Piece { id: number; color: string; left: string; delay: string; size: number; }

export default function Confetti() {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    setPieces(Array.from({ length: 60 }, (_, i) => ({
      id: i,
      color: COLORS[i % COLORS.length],
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`,
      size: 8 + Math.random() * 8,
    })));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {pieces.map(p => (
        <div
          key={p.id}
          className="absolute animate-confetti-fall rounded-sm"
          style={{ left: p.left, top: '-10px', background: p.color, width: p.size, height: p.size, animationDelay: p.delay }}
        />
      ))}
    </div>
  );
}
