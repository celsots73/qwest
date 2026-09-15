'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
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
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-gray-950 to-pink-950 flex items-center justify-center p-4 text-white">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-4xl font-black text-brand-400 mb-2">Qwest</h1>
        <p className="text-gray-400 mb-8 text-sm">Entre na partida</p>

        {step === 'pin' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <input
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && checkPin()}
              placeholder="PIN de 6 dígitos"
              inputMode="numeric"
              className="input-field text-center text-3xl font-black tracking-[0.3em] h-16"
            />
            <button onClick={checkPin} disabled={isLoading} className="btn-primary w-full text-lg py-4">
              {isLoading ? 'Verificando…' : 'Entrar →'}
            </button>
          </motion.div>
        )}

        {step === 'avatar' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div>
              <p className="text-sm text-gray-400 mb-3">Escolha seu avatar</p>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map(a => (
                  <button
                    key={a}
                    onClick={() => setAvatar(a)}
                    className={`text-3xl rounded-xl p-2 transition-all ${a === avatar ? 'bg-brand-600 scale-110' : 'bg-gray-800 hover:bg-gray-700'}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2">Seu apelido</p>
              <input
                value={nickname}
                onChange={e => setNickname(e.target.value.slice(0, 20))}
                onKeyDown={e => e.key === 'Enter' && enterGame()}
                placeholder="Como quer ser chamado?"
                className="input-field text-center text-xl font-bold"
                autoFocus
              />
            </div>
            <button onClick={enterGame} className="btn-primary w-full text-lg py-4">
              {avatar} Entrar no jogo!
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
