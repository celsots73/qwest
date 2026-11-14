'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap, Users, BarChart3, Trophy, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const features = [
  { icon: Zap,       title: 'Tempo Real',      desc: 'WebSocket sincroniza perguntas e respostas para toda a sala ao mesmo instante.' },
  { icon: Users,     title: '1000+ jogadores',  desc: 'Do ensino básico a grandes eventos corporativos — escala sem configuração.' },
  { icon: Trophy,    title: 'Gamificação',      desc: 'Pontos, streaks, combos e pódio animado mantêm o engajamento do início ao fim.' },
  { icon: BarChart3, title: 'Analytics',        desc: 'Relatório por pergunta, taxa de acerto e exportação CSV com um clique.' },
];

function ProductMockup() {
  return (
    <div className="relative select-none">
      <div className="absolute inset-0 bg-brand-600/15 blur-3xl rounded-full scale-150 pointer-events-none" />
      <div className="relative card-glow max-w-xs mx-auto">
        <div className="flex items-center justify-between mb-4">
          <span className="font-display font-black text-brand-400 text-sm tracking-tight">Qwest</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">247 online</span>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
          </div>
        </div>

        <div className="h-1 bg-gray-800 rounded-full mb-3 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: '62%', background: 'linear-gradient(90deg,#7B6EFF,#6657FF)' }} />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mb-4">
          <span>Pergunta 3 / 8</span>
          <span className="text-brand-400 font-bold">18s</span>
        </div>

        <p className="font-display font-bold text-sm mb-4 leading-snug">
          Qual é a capital da Austrália?
        </p>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Sydney',    cls: 'opt-0' },
            { label: 'Melbourne', cls: 'opt-1' },
            { label: 'Canberra',  cls: 'opt-2' },
            { label: 'Brisbane',  cls: 'opt-3' },
          ].map(o => (
            <div key={o.label} className={`${o.cls} rounded-lg p-2.5 text-xs font-bold text-center`}>
              {o.label}
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
          <div className="flex -space-x-1">
            {['🦊','🐼','🦋','🐯','🦄'].map((a, i) => (
              <div key={a} className="w-6 h-6 rounded-full bg-gray-800 border border-white/10 flex items-center justify-center text-xs" style={{ zIndex: 5 - i }}>
                {a}
              </div>
            ))}
          </div>
          <span className="text-xs text-gray-500">189 responderam</span>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const user = useAuthStore(s => s.user);

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <span className="text-2xl font-display font-black text-brand-400 tracking-tight">Qwest</span>
        <div className="flex gap-3 items-center">
          {user ? (
            <Link href="/dashboard" className="btn-primary py-2 px-5 text-sm">Dashboard →</Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost py-2 px-4 text-sm">Entrar</Link>
              <Link href="/register" className="btn-primary py-2 px-5 text-sm">Começar grátis</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero — two column */}
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 md:gap-8 items-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 bg-brand-950 border border-brand-900 text-brand-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            Plataforma gamificada ao vivo
          </div>
          <h1 className="text-5xl md:text-[3.5rem] lg:text-6xl font-display font-black mb-6 leading-[1.08] tracking-tight">
            Engaje sua<br />
            audiência em<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-300">
              tempo real.
            </span>
          </h1>
          <p className="text-gray-400 text-lg mb-9 leading-relaxed max-w-md">
            Crie quizzes interativos, projete ao vivo com um PIN e veja o
            engajamento acontecer. Mobile-first, sem instalar nada.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link href="/register" className="btn-primary text-base px-7 py-3.5 inline-flex items-center gap-2">
              Criar quiz grátis <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/play" className="btn-ghost text-base px-7 py-3.5">
              Entrar com PIN
            </Link>
          </div>
          <p className="text-xs text-gray-700 mt-4">Sem cartão de crédito · Sempre grátis para começar</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="hidden md:block"
        >
          <ProductMockup />
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-black mb-3">Tudo que você precisa</h2>
          <p className="text-gray-500 text-base">Da criação à análise, em um único lugar.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
            >
              <div className="w-10 h-10 rounded-xl bg-brand-950 border border-brand-900/60 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-brand-400" />
              </div>
              <h3 className="font-display font-bold text-base mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 max-w-4xl mx-auto">
        <div className="card-glow text-center py-16 px-8">
          <h2 className="text-4xl font-display font-black mb-4">Pronto para jogar?</h2>
          <p className="text-gray-400 mb-8 text-base">Participar é instantâneo — PIN + apelido e você está dentro.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/register" className="btn-primary text-base px-8 py-3.5 inline-flex items-center gap-2">
              Criar conta grátis <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/play" className="btn-ghost text-base px-8 py-3.5">
              Entrar com PIN
            </Link>
          </div>
        </div>
      </section>

      <footer className="text-center py-8 text-gray-700 text-xs border-t border-white/5 max-w-6xl mx-auto">
        © 2026 Qwest · Plataforma de quizzes em tempo real
      </footer>
    </div>
  );
}
