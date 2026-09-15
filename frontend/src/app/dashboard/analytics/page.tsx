'use client';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Download, Users, CheckCircle, Clock } from 'lucide-react';
import { reportApi } from '@/lib/api';

function WordCloud({ freq }: { freq: Record<string, number> }) {
  const entries = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return <p className="text-gray-500 text-sm">Sem respostas ainda.</p>;
  const max = entries[0][1];
  return (
    <div className="flex flex-wrap gap-2 py-2">
      {entries.map(([word, count]) => {
        const size = 0.75 + (count / max) * 1.5; // 0.75rem to 2.25rem
        const opacity = 0.5 + (count / max) * 0.5;
        return (
          <span
            key={word}
            title={`${count} voto${count > 1 ? 's' : ''}`}
            style={{ fontSize: `${size}rem`, opacity }}
            className="font-bold text-brand-400 cursor-default"
          >
            {word}
          </span>
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const sp = useSearchParams();
  const sessionId = sp.get('session') || '';

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', sessionId],
    queryFn: () => reportApi.analytics(sessionId),
    enabled: !!sessionId,
  });

  if (isLoading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-white/10 px-6 py-4 flex items-center gap-4 max-w-5xl mx-auto">
        <Link href="/dashboard" className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold">Analytics da sessão</h1>
        <a
          href={reportApi.csvUrl(sessionId)}
          download
          className="ml-auto btn-ghost text-sm flex items-center gap-2 py-2"
        >
          <Download className="w-4 h-4" /> Exportar CSV
        </a>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center">
            <Users className="w-6 h-6 text-brand-400 mx-auto mb-2" />
            <div className="text-3xl font-black">{data.totalParticipants}</div>
            <div className="text-gray-400 text-sm">Participantes</div>
          </div>
          <div className="card text-center">
            <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-3xl font-black">{Math.round(data.questionStats.reduce((s: number, q: any) => s + q.accuracy, 0) / (data.questionStats.length || 1))}%</div>
            <div className="text-gray-400 text-sm">Taxa de acerto</div>
          </div>
          <div className="card text-center">
            <Clock className="w-6 h-6 text-accent-400 mx-auto mb-2" />
            <div className="text-3xl font-black">{Math.round(data.avgScore).toLocaleString()}</div>
            <div className="text-gray-400 text-sm">Pontuação média</div>
          </div>
        </div>

        {/* Per-question stats */}
        <div>
          <h2 className="text-lg font-bold mb-4">Desempenho por pergunta</h2>
          <div className="space-y-3">
            {data.questionStats.map((q: any, i: number) => (
              <div key={q.questionId} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <span className="text-xs text-gray-500 mr-2">#{i + 1}</span>
                    <span className="text-sm font-medium">{q.text}</span>
                  </div>
                  {q.type !== 'OPEN_TEXT' && q.type !== 'MULTIPLE_CHOICE' && (
                    <div className="text-right ml-4 flex-shrink-0">
                      <div className="text-lg font-black text-brand-400">{Math.round(q.accuracy)}%</div>
                      <div className="text-xs text-gray-500">{q.correctCount}/{q.totalAnswers}</div>
                    </div>
                  )}
                </div>

                {/* Word cloud for OPEN_TEXT */}
                {q.type === 'OPEN_TEXT' && q.wordFrequency && (
                  <WordCloud freq={q.wordFrequency} />
                )}

                {/* Option bars for MULTIPLE_CHOICE */}
                {q.type === 'MULTIPLE_CHOICE' && q.optionFrequency && (
                  <div className="space-y-2">
                    {q.optionFrequency.map((opt: any) => (
                      <div key={opt.id}>
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>{opt.text}</span><span>{opt.count}</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-brand-500 transition-all"
                            style={{ width: q.totalAnswers ? `${(opt.count / q.totalAnswers) * 100}%` : '0%' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Accuracy bar for quiz questions */}
                {q.type !== 'OPEN_TEXT' && q.type !== 'MULTIPLE_CHOICE' && (
                  <>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${q.accuracy}%`, background: q.accuracy > 60 ? '#10b981' : q.accuracy > 30 ? '#f59e0b' : '#ef4444' }}
                      />
                    </div>
                  </>
                )}

                <div className="text-xs text-gray-500 mt-2">
                  {q.totalAnswers} respostas · Tempo médio: {(q.avgResponseMs / 1000).toFixed(1)}s
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
