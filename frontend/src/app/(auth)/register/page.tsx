'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';

const schema = z.object({
  name:     z.string().min(2, 'Nome muito curto'),
  email:    z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});
type F = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<F>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: F) => {
    try {
      await registerUser(data.name, data.email, data.password);
      router.push('/dashboard');
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Erro ao cadastrar');
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-950">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-10"
        style={{ background: 'linear-gradient(160deg, #1E1870 0%, #0D0B3A 60%, #0A0912 100%)' }}>
        <Link href="/" className="font-display font-black text-2xl text-brand-400 tracking-tight">Qwest</Link>
        <div>
          <p className="text-3xl font-display font-black leading-snug mb-4">
            Sua próxima aula<br />começa aqui.<br />
            <span className="text-brand-400">É grátis.</span>
          </p>
          <p className="text-gray-500 text-sm leading-relaxed">
            Crie quizzes em minutos, engaje sua audiência ao vivo e analise os resultados.
          </p>
        </div>
        <p className="text-gray-700 text-xs">© 2026 Qwest</p>
      </div>

      {/* Form side */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-7">
          <div>
            <Link href="/" className="font-display font-black text-2xl text-brand-400 tracking-tight lg:hidden block mb-8">Qwest</Link>
            <h1 className="text-2xl font-display font-bold mb-1">Criar sua conta</h1>
            <p className="text-gray-500 text-sm">Gratuito para sempre. Sem cartão de crédito.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <input {...register('name')} placeholder="Seu nome" className="input-field" />
              {errors.name && <p className="text-red-400 text-xs mt-1.5">{errors.name.message}</p>}
            </div>
            <div>
              <input {...register('email')} type="email" placeholder="E-mail" className="input-field" />
              {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
            </div>
            <div>
              <input {...register('password')} type="password" placeholder="Senha (mín. 6 caracteres)" className="input-field" />
              {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5">
              {isLoading ? 'Criando conta…' : 'Criar conta grátis'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm">
            Já tem conta?{' '}
            <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
