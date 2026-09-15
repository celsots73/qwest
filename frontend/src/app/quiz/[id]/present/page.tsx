'use client';
import { useSearchParams } from 'next/navigation';
import { useGameStore } from '@/stores/gameStore';
import { useHostSocket } from '@/hooks/useSocket';
import { useTimer } from '@/hooks/useTimer';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ChevronRight, StopCircle, QrCode } from 'lucide-react';
import Leaderboard from '@/components/game/Leaderboard';
import Podium from '@/components/game/Podium';
import { useEffect } from 'react';
import Link from 'next/link';
import { connectSocket } from '@/lib/socket';

export default function PresentPage() {
  const sp = useSearchParams();
  const pin = sp.get('pin') || '';
  const store = useGameStore();
  const { startQuiz, nextQuestion, endQuiz } = useHostSocket(pin);

  const { remaining, pct } = useTimer(
    store.currentQuestion?.timeLimit ?? 30,
    () => {},
  );

  if (store.phase === 'podium') return <Podium leaderboard={store.leaderboard} isHost />;
  if (store.phase === 'leaderboard') return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 gap-8">
      <h2 className="text-3xl font-black text-white">Ranking</h2>
      <Leaderboard entries={store.leaderboard} />
      <button onClick={nextQuestion} className="btn-primary flex items-center gap-2 text-lg px-10">
        Próxima <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );

  // Waiting lobby
  if (store.phase === 'idle' || store.phase === 'waiting') return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-gray-950 to-pink-950 flex flex-col items-center justify-center text-white text-center p-6">
      <div className="text-7xl font-black tracking-widest mb-4 text-white drop-shadow-xl">{pin}</div>
      <p className="text-gray-300 mb-2 text-lg">Compartilhe este PIN com os participantes</p>
      <p className="text-gray-500 mb-8 text-sm">ou acesse: <strong>qwest.app/play</strong></p>

      <div className="flex items-center gap-3 bg-white/10 rounded-2xl px-6 py-3 mb-10">
        <Users className="w-5 h-5 text-brand-400" />
        <span className="font-semibold">{store.totalParticipants} participante{store.totalParticipants !== 1 ? 's' : ''}</span>
      </div>

      <button onClick={startQuiz} className="btn-primary text-xl px-12 py-5">
        🚀 Iniciar Quiz
      </button>

      <Link
        href={`/live/${pin}`}
        target="_blank"
        className="mt-6 text-gray-400 hover:text-white text-sm underline underline-offset-2 transition-colors"
      >
        📺 Abrir dashboard ao vivo (para projetor)
      </Link>
    </div>
  );

  // Active question
  if (store.phase === 'question' && store.currentQuestion) {
    const q = store.currentQuestion;
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        {/* Progress bar */}
        <div className="h-2 bg-gray-800 w-full">
          <motion.div
            className={`h-full ${remaining > q.timeLimit * 0.3 ? 'bg-green-500' : 'bg-red-500'} transition-colors`}
            initial={{ width: '100%' }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <span className="text-gray-400 text-sm">Pergunta {q.index + 1}/{q.total}</span>
          <div className="text-4xl font-black text-brand-400">{remaining}s</div>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Users className="w-4 h-4" />
            {store.answerCount}/{store.totalParticipants}
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <h2 className="text-3xl md:text-4xl font-black text-center max-w-3xl mb-12">
            {q.question.text}
          </h2>

          {/* Options grid */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-3xl">
            {q.question.options.map((opt, i) => (
              <div key={opt.id} className={`opt-${i} rounded-2xl p-5 text-center font-bold text-lg text-white shadow-lg`}>
                {opt.text}
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-white/10">
          <button onClick={() => endQuiz()} className="flex items-center gap-2 text-gray-500 hover:text-red-400 transition-colors text-sm">
            <StopCircle className="w-4 h-4" /> Encerrar
          </button>
          <button onClick={nextQuestion} className="btn-primary flex items-center gap-2">
            Avançar <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
