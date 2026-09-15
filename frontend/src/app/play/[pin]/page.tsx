'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { usePlayerSocket } from '@/hooks/useSocket';
import { useTimer } from '@/hooks/useTimer';
import Leaderboard from '@/components/game/Leaderboard';
import Podium from '@/components/game/Podium';
import AnswerResult from '@/components/game/AnswerResult';
import clsx from 'clsx';

const OPT_CLASSES = ['opt-0', 'opt-1', 'opt-2', 'opt-3', 'opt-4', 'opt-5'];
const OPT_SHAPES = ['◆', '●', '▲', '■', '★', '♥'];

export default function PlayerGamePage() {
  const { pin } = useParams<{ pin: string }>();
  const router = useRouter();
  const store = useGameStore();
  const [answered, setAnswered] = useState(false);
  const [selectedValue, setSelectedValue] = useState<unknown>(null);
  const [sliderVal, setSliderVal] = useState(50);
  const [openText, setOpenText] = useState('');
  const [puzzleOrder, setPuzzleOrder] = useState<string[]>([]);

  const nickname = typeof window !== 'undefined' ? (sessionStorage.getItem('qwest_nickname') || 'Jogador') : 'Jogador';
  const avatar = typeof window !== 'undefined' ? (sessionStorage.getItem('qwest_avatar') || '🦊') : '🦊';

  const { submitAnswer } = usePlayerSocket(pin, nickname, avatar);

  const { remaining, pct } = useTimer(
    store.currentQuestion?.timeLimit ?? 30,
    () => { if (!answered && store.phase === 'question') handleSubmit(null); },
  );

  useEffect(() => {
    if (store.phase === 'question') {
      setAnswered(false);
      setSelectedValue(null);
      setOpenText('');
      if (store.currentQuestion?.question.options) {
        setPuzzleOrder(store.currentQuestion.question.options.map(o => o.id));
      }
    }
  }, [store.currentQuestion?.index]);

  const handleSubmit = (value: unknown) => {
    if (answered) return;
    setAnswered(true);
    const finalValue = value ?? selectedValue;
    submitAnswer(finalValue);
  };

  const handleChoice = (optId: string) => {
    const q = store.currentQuestion?.question;
    if (!q || answered) return;
    if (q.type === 'MULTIPLE_CHOICE') {
      setSelectedValue(optId);
      handleSubmit([optId]);
    } else {
      handleSubmit([optId]);
    }
  };

  if (store.phase === 'podium') return <Podium leaderboard={store.leaderboard} me={store.myParticipant} />;

  if (store.phase === 'leaderboard') return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 gap-6">
      <h2 className="text-2xl font-black text-white">Ranking</h2>
      <Leaderboard entries={store.leaderboard} highlightId={store.myParticipant?.id} />
      <p className="text-gray-400 text-sm">Aguardando próxima pergunta…</p>
    </div>
  );

  if (store.phase === 'answer-result' && store.answerResult) {
    return <AnswerResult result={store.answerResult} streak={store.myParticipant?.streak ?? 0} score={store.myParticipant?.score ?? 0} />;
  }

  // Waiting for host to start
  if (store.phase === 'idle' || store.phase === 'waiting') return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-gray-950 to-pink-950 flex flex-col items-center justify-center text-white text-center p-6">
      <div className="text-7xl mb-4">{avatar}</div>
      <h2 className="text-2xl font-bold mb-2">{nickname}</h2>
      <p className="text-gray-300 mb-8">Aguardando o apresentador iniciar…</p>
      <div className="w-10 h-10 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (store.phase === 'question' && store.currentQuestion) {
    const q = store.currentQuestion;
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        {/* Timer bar */}
        <div className="h-2 bg-gray-800">
          <motion.div
            className={clsx('h-full transition-colors', remaining > q.timeLimit * 0.3 ? 'bg-green-500' : 'bg-red-500')}
            initial={{ width: '100%' }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 text-sm">
          <span className="text-gray-400">{q.index + 1}/{q.total}</span>
          <span className="font-bold text-xl text-brand-400">{remaining}s</span>
          <span className="text-gray-400">{store.myParticipant?.score ?? 0} pts</span>
        </div>

        <div className="flex-1 flex flex-col p-4 gap-4 max-w-lg mx-auto w-full">
          {/* Question text */}
          <div className="text-center py-4">
            <p className="text-lg md:text-xl font-bold">{q.question.text}</p>
          </div>

          {answered ? (
            <div className="flex-1 flex items-center justify-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
                <div className="text-6xl mb-4">⏳</div>
                <p className="text-gray-400">Aguardando outros jogadores…</p>
              </motion.div>
            </div>
          ) : (
            <>
              {/* Multiple choice / True-False */}
              {(q.question.type === 'MULTIPLE_CHOICE' || q.question.type === 'TRUE_FALSE') && (
                <div className="grid grid-cols-2 gap-3 flex-1">
                  {q.question.options.map((opt, i) => (
                    <motion.button
                      key={opt.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleChoice(opt.id)}
                      className={clsx(
                        OPT_CLASSES[i],
                        'rounded-2xl p-4 text-white font-bold text-center flex flex-col items-center justify-center gap-2 min-h-[90px] shadow-lg',
                      )}
                    >
                      <span className="text-2xl">{OPT_SHAPES[i]}</span>
                      <span className="text-sm leading-tight">{opt.text}</span>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Open text — single word poll */}
              {q.question.type === 'OPEN_TEXT' && (
                <div className="flex flex-col gap-3 flex-1">
                  <p className="text-gray-400 text-sm text-center">Digite uma palavra</p>
                  <input
                    value={openText}
                    onChange={e => setOpenText(e.target.value.replace(/\s/g, ''))}
                    placeholder="sua palavra…"
                    className="input-field text-lg text-center"
                    maxLength={40}
                    autoFocus
                  />
                  <button
                    onClick={() => handleSubmit(openText.trim())}
                    disabled={!openText.trim()}
                    className="btn-primary py-4 text-lg disabled:opacity-40"
                  >
                    Confirmar
                  </button>
                </div>
              )}

              {/* Slider */}
              {q.question.type === 'SLIDER' && (
                <div className="flex flex-col gap-4 flex-1 justify-center">
                  <div className="text-center text-4xl font-black text-brand-400">{sliderVal}</div>
                  <input
                    type="range" min={0} max={100} value={sliderVal}
                    onChange={e => setSliderVal(Number(e.target.value))}
                    className="w-full accent-brand-500"
                  />
                  <button onClick={() => handleSubmit(sliderVal)} className="btn-primary py-4 text-lg">
                    Confirmar: {sliderVal}
                  </button>
                </div>
              )}

              {/* Puzzle */}
              {q.question.type === 'PUZZLE' && (
                <div className="flex flex-col gap-2 flex-1">
                  <p className="text-gray-400 text-sm text-center mb-2">Arranje na ordem correta</p>
                  {puzzleOrder.map((id, i) => {
                    const opt = q.question.options.find(o => o.id === id);
                    return (
                      <div key={id} className="flex items-center gap-2">
                        <span className="text-gray-500 w-6 text-center">{i + 1}.</span>
                        <div className="flex-1 bg-gray-800 rounded-xl px-4 py-3 font-medium">{opt?.text}</div>
                        <div className="flex flex-col gap-1">
                          <button disabled={i === 0} onClick={() => setPuzzleOrder(o => { const a = [...o]; [a[i-1], a[i]] = [a[i], a[i-1]]; return a; })} className="text-gray-500 hover:text-white disabled:opacity-30">▲</button>
                          <button disabled={i === puzzleOrder.length - 1} onClick={() => setPuzzleOrder(o => { const a = [...o]; [a[i], a[i+1]] = [a[i+1], a[i]]; return a; })} className="text-gray-500 hover:text-white disabled:opacity-30">▼</button>
                        </div>
                      </div>
                    );
                  })}
                  <button onClick={() => handleSubmit(puzzleOrder)} className="btn-primary py-4 text-lg mt-4">
                    Confirmar ordem
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}
