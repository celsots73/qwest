'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, Play, Pencil, Trash2, Copy, LogOut, BarChart3 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { quizApi, sessionApi } from '@/lib/api';
import { Quiz } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const qc = useQueryClient();

  useEffect(() => { if (!user) router.replace('/login'); }, [user]);

  const { data: quizzes = [], isLoading } = useQuery<Quiz[]>({
    queryKey: ['quizzes'],
    queryFn: quizApi.list,
    enabled: !!user,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: sessionApi.list,
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: quizApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quizzes'] }); toast.success('Quiz excluído'); },
  });

  const duplicateMutation = useMutation({
    mutationFn: quizApi.duplicate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quizzes'] }); toast.success('Quiz duplicado'); },
  });

  const startMutation = useMutation({
    mutationFn: (quizId: string) => sessionApi.create(quizId),
    onSuccess: (session) => router.push(`/quiz/${session.quizId}/present?session=${session.id}&pin=${session.pin}`),
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/" className="text-2xl font-black text-brand-500">Qwest</Link>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm hidden sm:block">Olá, {user.name}</span>
          <button onClick={() => { logout(); router.push('/'); }} className="text-gray-400 hover:text-white transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black">Meus Quizzes</h1>
          <Link href="/quiz/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Novo Quiz
          </Link>
        </div>

        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card animate-pulse h-40 bg-gray-900" />
            ))}
          </div>
        )}

        {!isLoading && quizzes.length === 0 && (
          <div className="text-center py-20 card">
            <p className="text-4xl mb-4">🎮</p>
            <h2 className="text-xl font-bold mb-2">Nenhum quiz ainda</h2>
            <p className="text-gray-400 mb-6">Crie seu primeiro quiz interativo agora.</p>
            <Link href="/quiz/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Criar quiz
            </Link>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map((quiz, i) => (
            <motion.div
              key={quiz.id}
              className="card hover:border-brand-700 transition-colors group"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-lg leading-snug line-clamp-2">{quiz.title}</h3>
              </div>
              <p className="text-gray-500 text-sm mb-4">
                {quiz._count?.questions ?? 0} perguntas · {quiz._count?.sessions ?? 0} sessões
              </p>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => startMutation.mutate(quiz.id)}
                  disabled={startMutation.isPending}
                  className="flex-1 btn-primary py-2 text-sm flex items-center justify-center gap-1"
                >
                  <Play className="w-3.5 h-3.5" /> Jogar
                </button>
                <Link href={`/quiz/${quiz.id}/edit`} className="btn-ghost py-2 px-3 text-sm">
                  <Pencil className="w-4 h-4" />
                </Link>
                <button onClick={() => duplicateMutation.mutate(quiz.id)} className="btn-ghost py-2 px-3 text-sm">
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { if (confirm('Excluir quiz?')) deleteMutation.mutate(quiz.id); }}
                  className="btn-ghost py-2 px-3 text-sm text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
        {/* Recent sessions */}
        {sessions.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-4">Sessões recentes</h2>
            <div className="space-y-2">
              {sessions.slice(0, 5).map((s: any) => (
                <div key={s.id} className="card flex items-center justify-between py-3">
                  <div>
                    <span className="font-medium text-sm">{s.quiz?.title || 'Quiz'}</span>
                    <span className="text-xs text-gray-500 ml-3">PIN {s.pin} · {s.status}</span>
                  </div>
                  {s.status === 'FINISHED' && (
                    <Link href={`/dashboard/analytics?session=${s.id}`} className="btn-ghost py-1.5 px-3 text-xs flex items-center gap-1">
                      <BarChart3 className="w-3.5 h-3.5" /> Análises
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
