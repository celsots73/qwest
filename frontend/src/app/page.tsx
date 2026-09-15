'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap, Users, BarChart3, Trophy } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const features = [
  { icon: Zap, title: 'Tempo Real', desc: 'Perguntas e respostas sincronizadas via WebSocket para todos os participantes.' },
  { icon: Users, title: 'Até 1000+ jogadores', desc: 'Escale do ensino básico a grandes eventos corporativos.' },
  { icon: Trophy, title: 'Gamificação', desc: 'Pontos, streaks, combos e pódio animado para engajar a turma.' },
  { icon: BarChart3, title: 'Analytics', desc: 'Relatórios por pergunta, taxa de acerto e exportação em CSV.' },
];

export default function LandingPage() {
  const user = useAuthStore(s => s.user);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="text-2xl font-black text-brand-500 tracking-tight">Qwest</span>
        <div className="flex gap-3">
          {user ? (
            <Link href="/dashboard" className="btn-primary py-2 px-4 text-sm">Meu Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost py-2 px-4 text-sm">Entrar</Link>
              <Link href="/register" className="btn-primary py-2 px-4 text-sm">Começar grátis</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center py-24 px-6">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-block bg-brand-900/60 text-brand-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            🎮 Quizzes gamificados ao vivo
          </span>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Transforme aulas<br />em{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-pink-400">
              experiências
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Crie quizzes interativos, lance ao vivo com um PIN e veja o ranking em tempo real.
            Mobile-first. Sem instalar nada.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/register" className="btn-primary text-lg px-8 py-4">Criar quiz grátis →</Link>
            <Link href="/play" className="btn-ghost text-lg px-8 py-4">Entrar com PIN</Link>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <f.icon className="w-8 h-8 text-brand-500 mb-4" />
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center px-6">
        <div className="max-w-2xl mx-auto card bg-gradient-to-br from-brand-900/50 to-pink-900/30 border-brand-800">
          <h2 className="text-3xl font-black mb-4">Pronto para jogar?</h2>
          <p className="text-gray-400 mb-8">Participar é instantâneo — só o PIN e um apelido.</p>
          <Link href="/play" className="btn-primary inline-block">Entrar com PIN agora</Link>
        </div>
      </section>

      <footer className="text-center py-8 text-gray-600 text-sm">
        © 2026 Qwest · Plataforma de quizzes em tempo real
      </footer>
    </div>
  );
}
