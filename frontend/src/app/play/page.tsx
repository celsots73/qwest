'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowRight } from 'lucide-react';
import { sessionApi } from '@/lib/api';

const AVATARS = ['🦊', '🐼', '🦋', '🐯', '🦄', '🐸', '🦁', '🐙', '🦉', '🐨', '🦖', '🐬'];

export default function PlayPage() {
  const router = useRouter();
  const [step, setStep] = useState<'pin' | 'avatar'>('pin');
  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [isLoading, setIsLoading] = useState(false);

  const checkPin = async () => {
    if (pin.length !== 6) return toast.error('PIN deve ter 6 dígitos');
    setIsLoading(true);
    try {
      await sessionApi.byPin(pin);
      setStep('avatar');
    } catch {
      toast.error('PIN inválido ou sessão não encontrada');
    } finally {
      setIsLoading(false);
    }
  };

  const enterGame = () => {
    if (!nickname.trim()) return toast.error('Escolha um apelido');
    sessionStorage.setItem('qwest_nickname', nickname);
    sessionStorage.setItem('qwest_avatar', avatar);
    router.push(`/play/${pin}`);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-white">
      {/* subtle brand glow */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(102,87,255,0.12) 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-10">
          <span className="font-display font-black text-3xl text-brand-400 tracking-tight block mb-1">Qwest</span>
          <p className="text-gray-500 text-sm">Entre na partida ao vivo</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'pin' && (
            <motion.div
              key="pin"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="space-y-4"
            >
              <input
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && checkPin()}
                placeholder="000000"
                inputMode="numeric"
                className="input-field text-center text-3xl font-display font-black tracking-[0.4em] h-16"
                autoFocus
              />
              <p className="text-center text-xs text-gray-600">Digite o PIN de 6 dígitos do quiz</p>
              <button onClick={checkPin} disabled={isLoading || pin.length !== 6} className="btn-primary w-full py-4 text-base inline-flex items-center justify-center gap-2">
                {isLoading ? 'Verificando…' : (<>Continuar <ArrowRight className="w-4 h-4" /></>)}
              </button>
            </motion.div>
          )}

          {step === 'avatar' && (
            <motion.div
              key="avatar"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="space-y-6"
            >
              <div className="card">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Escolha seu avatar</p>
                <div className="grid grid-cols-6 gap-2">
                  {AVATARS.map(a => (
                    <button
                      key={a}
                      onClick={() => setAvatar(a)}
                      className={`text-2xl rounded-xl p-2 transition-all duration-150 ${
                        a === avatar
                          ? 'scale-110 ring-2 ring-brand-500 bg-brand-950'
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Seu apelido</p>
                <input
                  value={nickname}
                  onChange={e => setNickname(e.target.value.slice(0, 20))}
                  onKeyDown={e => e.key === 'Enter' && enterGame()}
                  placeholder="Como quer ser chamado?"
                  className="input-field text-center text-lg font-display font-bold"
                  autoFocus
                />
              </div>

              <button onClick={enterGame} disabled={!nickname.trim()} className="btn-primary w-full py-4 text-base inline-flex items-center justify-center gap-2">
                <span>{avatar}</span> Entrar no jogo!
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
