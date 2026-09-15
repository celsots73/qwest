'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Obrigatório'),
});
type F = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<F>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: F) => {
    try {
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch {
      toast.error('E-mail ou senha incorretos');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-950">
      <div className="w-full max-w-sm card space-y-6">
        <div className="text-center">
          <Link href="/" className="text-3xl font-black text-brand-500">Qwest</Link>
          <p className="text-gray-400 mt-2 text-sm">Entre na sua conta</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input {...register('email')} type="email" placeholder="E-mail" className="input-field" />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <input {...register('password')} type="password" placeholder="Senha" className="input-field" />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={isLoading} className="btn-primary w-full">
            {isLoading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm">
          Não tem conta?{' '}
          <Link href="/register" className="text-brand-400 hover:underline">Cadastre-se grátis</Link>
        </p>
      </div>
    </div>
  );
}
