'use client';
import { motion } from 'framer-motion';
import { Participant } from '@/types';
import clsx from 'clsx';

interface Props { entries: Participant[]; highlightId?: string; }

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard({ entries, highlightId }: Props) {
  return (
    <div className="w-full max-w-md space-y-2">
      {entries.slice(0, 5).map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.07 }}
          className={clsx(
            'flex items-center gap-3 rounded-2xl px-4 py-3',
            p.id === highlightId ? 'bg-brand-700/50 border border-brand-500' : 'bg-gray-800/60',
          )}
        >
          <span className="text-2xl w-8 text-center">{MEDALS[i] ?? `${i + 1}.`}</span>
          <span className="text-2xl">{p.avatar}</span>
          <span className="flex-1 font-bold truncate">{p.nickname}</span>
          {p.streak > 1 && <span className="text-orange-400 text-sm">🔥{p.streak}</span>}
          <span className="font-black text-brand-400">{p.score.toLocaleString()}</span>
        </motion.div>
      ))}
    </div>
  );
}
