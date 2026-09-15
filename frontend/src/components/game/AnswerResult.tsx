'use client';
import { motion } from 'framer-motion';
import { AnswerResult as AR } from '@/types';

interface Props { result: AR; streak: number; score: number; }

export default function AnswerResult({ result, streak, score }: Props) {
  const { correct, pointsEarned, comboBonus, timeBonus } = result;

  const isPoll = correct === null;

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center text-white text-center p-6 ${isPoll ? 'bg-blue-900/20' : correct ? 'bg-green-900/30' : 'bg-red-900/30'} bg-gray-950`}>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }} className="text-8xl mb-6">
        {isPoll ? '📊' : correct ? '✅' : '❌'}
      </motion.div>
      <h2 className={`text-3xl font-black mb-2 ${isPoll ? 'text-blue-400' : correct ? 'text-green-400' : 'text-red-400'}`}>
        {isPoll ? 'Registrado!' : correct ? 'Correto!' : 'Errado!'}
      </h2>

      {correct && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-3 mt-4">
          <div className="text-5xl font-black text-brand-400">+{pointsEarned}</div>
          <div className="flex gap-4 justify-center text-sm text-gray-400">
            {timeBonus > 0 && <span>⚡ Velocidade: +{timeBonus}</span>}
            {comboBonus > 0 && <span>🔥 Combo: +{comboBonus}</span>}
          </div>
          {streak > 1 && (
            <div className="text-lg font-bold text-accent-400">🔥 {streak}x Streak!</div>
          )}
        </motion.div>
      )}

      <div className="mt-8 text-gray-400 text-sm">
        Total: <span className="text-white font-bold">{score} pts</span>
      </div>
      <p className="text-gray-500 text-sm mt-4">Aguardando próxima pergunta…</p>
    </div>
  );
}
