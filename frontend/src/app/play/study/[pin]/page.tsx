'use client';
// Self-paced mode — participant answers all questions at own pace, no live sync
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import clsx from 'clsx';

const OPT_CLASSES = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'];

interface Question { id: string; type: string; text: string; options: { id: string; text: string }[]; timeLimit: number; }
interface Result { questionId: string; correct: boolean; correctOptions?: { id: string; text: string }[]; }

export default function SelfPacedPage() {
  const { pin } = useParams<{ pin: string }>();
  const [quiz, setQuiz] = useState<{ title: string; questions: Question[] } | null>(null);
  const [nickname] = useState(() => typeof window !== 'undefined' ? (sessionStorage.getItem('qwest_nickname') || 'Jogador') : 'Jogador');
  const [avatar] = useState(() => typeof window !== 'undefined' ? (sessionStorage.getItem('qwest_avatar') || '🦊') : '🦊');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { value: unknown; time: number }>>({});
  const [results, setResults] = useState<Result[] | null>(null);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.get(`/selfpaced/quiz/${pin}`).then(r => { setQuiz(r.data.quiz); setStartTime(Date.now()); }).catch(() => toast.error('Quiz não encontrado'));
  }, [pin]);

  const handleAnswer = (qId: string, value: unknown) => {
    setAnswers(a => ({ ...a, [qId]: { value, time: Date.now() - startTime } }));
  };

  const submitAll = async () => {
    if (!quiz) return;
    setSubmitted(true);
    try {
      const payload = {
        nickname, avatar,
        answers: quiz.questions.map(q => ({
          questionId: q.id,
          value: answers[q.id]?.value ?? null,
          responseTimeMs: answers[q.id]?.time ?? 30000,
        })),
      };
      const { data } = await api.post(`/selfpaced/quiz/${pin}/submit`, payload);
      setResults(data.results);
      setScore(data.score);
    } catch {
      toast.error('Erro ao enviar respostas');
      setSubmitted(false);
    }
  };

  if (!quiz) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (results) return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="text-6xl mb-3">{avatar}</div>
        <h2 className="text-3xl font-black">Resultado</h2>
        <div className="text-5xl font-black text-brand-400 mt-2">{score} pts</div>
        <p className="text-gray-400 mt-1">{results.filter(r => r.correct).length}/{results.length} corretas</p>
      </div>
      <div className="space-y-3">
        {quiz.questions.map((q, i) => {
          const r = results.find(x => x.questionId === q.id);
          return (
            <div key={q.id} className={clsx('card', r?.correct ? 'border-green-700' : 'border-red-800')}>
              <div className="flex items-start gap-3">
                <span>{r?.correct ? '✅' : '❌'}</span>
                <div>
                  <p className="font-medium text-sm">{q.text}</p>
                  {!r?.correct && r?.correctOptions && (
                    <p className="text-xs text-green-400 mt-1">Correto: {r.correctOptions.map(o => o.text).join(', ')}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const q = quiz.questions[current];
  const answered = answers[q.id] !== undefined;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col max-w-xl mx-auto">
      {/* Progress */}
      <div className="h-1.5 bg-gray-800">
        <div className="h-full bg-brand-500 transition-all" style={{ width: `${((current + 1) / quiz.questions.length) * 100}%` }} />
      </div>

      <div className="px-6 py-4 text-sm text-gray-400 flex justify-between">
        <span>Modo Estudo</span>
        <span>{current + 1}/{quiz.questions.length}</span>
      </div>

      <div className="flex-1 p-6 space-y-4">
        <h2 className="text-xl font-bold">{q.text}</h2>

        {(q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE') && (
          <div className="grid grid-cols-2 gap-3">
            {q.options.map((opt, i) => (
              <button
                key={opt.id}
                onClick={() => handleAnswer(q.id, [opt.id])}
                className={clsx(
                  OPT_CLASSES[i], 'rounded-2xl p-4 text-white font-bold text-center min-h-[80px] transition-all',
                  (answers[q.id]?.value as string[])?.includes(opt.id) ? 'ring-4 ring-white scale-95' : '',
                )}
              >
                {opt.text}
              </button>
            ))}
          </div>
        )}

        {q.type === 'OPEN_TEXT' && (
          <input
            placeholder="Sua resposta…"
            className="input-field"
            onChange={e => handleAnswer(q.id, e.target.value)}
          />
        )}
      </div>

      <div className="px-6 pb-8 flex gap-3">
        {current < quiz.questions.length - 1 ? (
          <button onClick={() => setCurrent(c => c + 1)} className="btn-primary flex-1 py-4">
            Próxima →
          </button>
        ) : (
          <button onClick={submitAll} disabled={submitted} className="btn-primary flex-1 py-4">
            {submitted ? 'Enviando…' : '✅ Finalizar'}
          </button>
        )}
      </div>
    </div>
  );
}
