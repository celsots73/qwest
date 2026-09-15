'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { connectSocket } from '@/lib/socket';

type Phase = 'lobby' | 'question' | 'leaderboard' | 'podium';

interface VoteUpdate {
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'OPEN_TEXT' | 'SLIDER';
  distribution?: Array<{ id: string; text: string; count: number }>;
  wordFrequency?: Record<string, number>;
  avg?: number; min?: number; max?: number;
  totalAnswers: number;
}

const OPT_COLORS = ['#ef4444', '#3b82f6', '#eab308', '#22c55e', '#ec4899', '#06b6d4'];

function WordCloud({ freq }: { freq: Record<string, number> }) {
  const entries = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 30);
  if (!entries.length) return <p className="text-gray-500 text-center">Aguardando respostas…</p>;
  const max = entries[0][1];
  return (
    <div className="flex flex-wrap gap-3 justify-center py-4 max-w-3xl mx-auto">
      {entries.map(([word, count]) => {
        const size = 1.2 + (count / max) * 2.5;
        const opacity = 0.5 + (count / max) * 0.5;
        return (
          <span key={word} style={{ fontSize: `${size}rem`, opacity }} className="font-black text-brand-400">
            {word}
          </span>
        );
      })}
    </div>
  );
}

export default function LivePage() {
  const { pin } = useParams<{ pin: string }>();
  const [phase, setPhase] = useState<Phase>('lobby');
  const [question, setQuestion] = useState<any>(null);
  const [answerCount, setAnswerCount] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [voteUpdate, setVoteUpdate] = useState<VoteUpdate | null>(null);

  useEffect(() => {
    const socket = connectSocket();
    socket.emit('spectator:join', { pin });

    socket.on('spectator:joined', ({ totalParticipants: tp }: any) => {
      setTotalParticipants(tp);
    });
    socket.on('room:player_joined', ({ total }: any) => setTotalParticipants(total));
    socket.on('game:start', () => { setPhase('question'); });
    socket.on('game:question', (data: any) => {
      setQuestion(data);
      setPhase('question');
      setAnswerCount(0);
      setVoteUpdate(null);
    });
    socket.on('room:answer_count', ({ count, total }: any) => {
      setAnswerCount(count);
      setTotalParticipants(total);
    });
    socket.on('room:vote_update', (data: VoteUpdate) => setVoteUpdate(data));
    socket.on('game:leaderboard', ({ leaderboard: lb }: any) => {
      setLeaderboard(lb);
      setPhase('leaderboard');
    });
    socket.on('game:end', ({ leaderboard: lb }: any) => {
      setLeaderboard(lb);
      setPhase('podium');
    });

    return () => {
      ['spectator:joined', 'room:player_joined', 'game:start', 'game:question',
        'room:answer_count', 'room:vote_update', 'game:leaderboard', 'game:end']
        .forEach(e => socket.off(e));
    };
  }, [pin]);

  // ── LOBBY ──────────────────────────────────────────────────────────────
  if (phase === 'lobby') return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-gray-950 to-pink-950 flex flex-col items-center justify-center text-white text-center p-6">
      <div className="text-8xl font-black tracking-widest mb-4 drop-shadow-xl">{pin}</div>
      <p className="text-gray-300 text-xl mb-8">Aguardando o quiz começar…</p>
      <div className="text-brand-400 text-2xl font-bold">{totalParticipants} participante{totalParticipants !== 1 ? 's' : ''}</div>
      <div className="w-10 h-10 border-4 border-brand-400 border-t-transparent rounded-full animate-spin mt-8" />
    </div>
  );

  // ── LEADERBOARD ─────────────────────────────────────────────────────────
  if (phase === 'leaderboard') return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 gap-6">
      <h2 className="text-4xl font-black">🏆 Ranking</h2>
      <div className="w-full max-w-lg space-y-3">
        {leaderboard.slice(0, 5).map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-4 bg-gray-900 rounded-2xl px-5 py-4"
          >
            <span className="text-2xl font-black text-gray-500 w-8">#{i + 1}</span>
            <span className="text-3xl">{p.avatar}</span>
            <span className="flex-1 font-bold text-lg">{p.nickname}</span>
            <span className="text-brand-400 font-black text-xl">{p.score.toLocaleString()}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // ── PODIUM ──────────────────────────────────────────────────────────────
  if (phase === 'podium') {
    const top3 = leaderboard.slice(0, 3);
    const order = [1, 0, 2]; // silver, gold, bronze display order
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
        <h2 className="text-5xl font-black mb-12">🎉 Resultado Final</h2>
        <div className="flex items-end gap-4 justify-center">
          {order.map(idx => {
            const p = top3[idx];
            if (!p) return <div key={idx} className="w-32" />;
            const heights = ['h-36', 'h-48', 'h-28'];
            const medals = ['🥈', '🥇', '🥉'];
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.2 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="text-4xl">{p.avatar}</div>
                <div className="font-bold text-center text-sm">{p.nickname}</div>
                <div className="text-brand-400 font-black">{p.score.toLocaleString()}</div>
                <div className={`${heights[idx]} w-28 bg-gray-800 rounded-t-xl flex items-center justify-center text-4xl`}>
                  {medals[idx]}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── QUESTION ─────────────────────────────────────────────────────────────
  if (phase === 'question' && question) {
    const q = question.question;
    const isPollType = q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE' || q.type === 'OPEN_TEXT' || q.type === 'SLIDER';

    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        {/* answer count bar */}
        <div className="h-2 bg-gray-800">
          <motion.div
            className="h-full bg-brand-500 transition-all duration-300"
            style={{ width: totalParticipants ? `${(answerCount / totalParticipants) * 100}%` : '0%' }}
          />
        </div>

        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 text-sm text-gray-400">
          <span>Pergunta {question.index + 1}/{question.total}</span>
          <span className="font-bold text-white">{answerCount}/{totalParticipants} responderam</span>
        </div>

        <div className="flex-1 flex flex-col items-center p-8 gap-8 max-w-4xl mx-auto w-full">
          <h2 className="text-3xl md:text-5xl font-black text-center">{q.text}</h2>

          <AnimatePresence mode="wait">
            {/* MULTIPLE_CHOICE & TRUE_FALSE bars */}
            {(q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE') && (
              <motion.div key="mc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full space-y-3">
                {q.options.map((opt: any, i: number) => {
                  const count = voteUpdate?.distribution?.find((d: any) => d.id === opt.id)?.count ?? 0;
                  const pct = voteUpdate ? (count / Math.max(voteUpdate.totalAnswers, 1)) * 100 : 0;
                  return (
                    <div key={opt.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-bold">{opt.text}</span>
                        <span className="text-gray-400">{count} voto{count !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="h-10 bg-gray-800 rounded-xl overflow-hidden">
                        <motion.div
                          className="h-full rounded-xl"
                          style={{ backgroundColor: OPT_COLORS[i], width: `${pct}%` }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.4 }}
                        />
                      </div>
                    </div>
                  );
                })}
                <p className="text-gray-500 text-sm text-right">{voteUpdate?.totalAnswers ?? 0} resposta{(voteUpdate?.totalAnswers ?? 0) !== 1 ? 's' : ''}</p>
              </motion.div>
            )}

            {/* OPEN_TEXT word cloud */}
            {q.type === 'OPEN_TEXT' && (
              <motion.div key="ot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
                {voteUpdate?.wordFrequency
                  ? <WordCloud freq={voteUpdate.wordFrequency} />
                  : <p className="text-gray-500 text-center text-xl">Aguardando palavras…</p>
                }
              </motion.div>
            )}

            {/* SLIDER — visual gauge + stats */}
            {q.type === 'SLIDER' && (
              <motion.div key="sl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full space-y-6">
                <div className="text-center">
                  <div className="text-8xl font-black text-brand-400">{voteUpdate?.avg ?? '—'}</div>
                  <p className="text-gray-400 mt-1">média atual</p>
                </div>
                {voteUpdate && (
                  <>
                    <div className="relative h-6 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        className="absolute top-0 left-0 h-full bg-brand-500 rounded-full"
                        animate={{ width: `${voteUpdate.avg ?? 0}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>0 · mín {voteUpdate.min}</span>
                      <span>{voteUpdate.totalAnswers} respostas</span>
                      <span>máx {voteUpdate.max} · 100</span>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* PUZZLE — just show options */}
            {!isPollType && (
              <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-4 w-full">
                {q.options.map((opt: any, i: number) => (
                  <div
                    key={opt.id}
                    className="rounded-2xl p-5 text-center font-bold text-xl text-white shadow-lg"
                    style={{ backgroundColor: OPT_COLORS[i] }}
                  >
                    {opt.text}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return null;
}
