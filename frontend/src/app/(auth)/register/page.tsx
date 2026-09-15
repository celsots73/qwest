'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';

const schema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-950">
      <div className="w-full max-w-sm card space-y-6">
        <div className="text-center">
          <Link href="/" className="text-3xl font-black text-brand-500">Qwest</Link>
          <p className="text-gray-400 mt-2 text-sm">Crie sua conta gratuita</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input {...register('name')} placeholder="Seu nome" className="input-field" />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <input {...register('email')} type="email" placeholder="E-mail" className="input-field" />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <input {...register('password')} type="password" placeholder="Senha (mín. 6 caracteres)" className="input-field" />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={isLoading} className="btn-primary w-full">
            {isLoading ? 'Criando conta…' : 'Criar conta grátis'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm">
          Já tem conta?{' '}
          <Link href="/login" className="text-brand-400 hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
