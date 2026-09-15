'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Participant } from '@/types';
import Link from 'next/link';
import Confetti from './Confetti';

interface Props { leaderboard: Participant[]; me?: Participant | null; isHost?: boolean; }

export default function Podium({ leaderboard, me, isHost }: Props) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 500); return () => clearTimeout(t); }, []);

  const top3 = [leaderboard[1], leaderboard[0], leaderboard[2]].filter(Boolean);
  const podiumHeights = ['h-28', 'h-40', 'h-20'];
  const podiumColors = ['bg-gray-400', 'bg-yellow-400', 'bg-amber-700'];
  const myPosition = me ? leaderboard.findIndex(p => p.id === me.id) + 1 : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-900 via-gray-950 to-black flex flex-col items-center justify-center text-white p-6">
      <Confetti />
      <motion.h1 initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-black mb-2 text-center">
        🏆 Resultado Final
      </motion.h1>

      {myPosition && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-gray-300 mb-8">
          Você ficou em <strong className="text-brand-400">#{myPosition}º lugar</strong> com <strong>{me?.score.toLocaleString()} pts</strong>
        </motion.p>
      )}

      {/* Podium */}
      {show && (
        <div className="flex items-end gap-3 mb-10 w-full max-w-xs justify-center">
          {top3.map((p, i) => (
            <motion.div
              key={p?.id ?? i}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2, type: 'spring', bounce: 0.4 }}
              className="flex flex-col items-center"
            >
              <div className="text-3xl mb-1">{p?.avatar}</div>
              <div className="text-xs font-bold mb-1 truncate max-w-[70px] text-center">{p?.nickname}</div>
              <div className="text-xs text-gray-400 mb-1">{p?.score.toLocaleString()} pts</div>
              <div className={`w-20 ${podiumHeights[i]} ${podiumColors[i]} rounded-t-xl flex items-start justify-center pt-2 text-xl font-black text-gray-900`}>
                {i === 1 ? '1' : i === 0 ? '2' : '3'}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Full leaderboard */}
      <div className="w-full max-w-sm space-y-2 mb-8">
        {leaderboard.slice(3).map((p, i) => (
          <div key={p.id} className="flex items-center gap-3 bg-gray-800/50 rounded-xl px-4 py-2">
            <span className="text-gray-400 text-sm w-6">#{i + 4}</span>
            <span className="text-xl">{p.avatar}</span>
            <span className="flex-1 text-sm font-medium truncate">{p.nickname}</span>
            <span className="text-brand-400 font-bold text-sm">{p.score.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {isHost ? (
        <Link href="/dashboard" className="btn-primary">Voltar ao Dashboard</Link>
      ) : (
        <Link href="/play" className="btn-primary">Jogar novamente</Link>
      )}
    </div>
  );
}
