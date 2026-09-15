'use client';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { quizApi } from '@/lib/api';
import QuizEditor from '@/components/editor/QuizEditor';

export default function EditQuizPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: quiz, isLoading } = useQuery({ queryKey: ['quiz', id], queryFn: () => quizApi.get(id) });

  const updateMutation = useMutation({
    mutationFn: (data: unknown) => quizApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quizzes'] }); toast.success('Salvo!'); },
    onError: () => toast.error('Erro ao salvar'),
  });

  if (isLoading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!quiz) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Quiz não encontrado</div>;

  return (
    <QuizEditor
      quizId={id}
      initialData={quiz}
      onSave={(data) => updateMutation.mutate(data)}
      isSaving={updateMutation.isPending}
      onRefresh={() => qc.invalidateQueries({ queryKey: ['quiz', id] })}
    />
  );
}
