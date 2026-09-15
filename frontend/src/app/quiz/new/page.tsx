'use client';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { quizApi } from '@/lib/api';
import QuizEditor from '@/components/editor/QuizEditor';

export default function NewQuizPage() {
  const router = useRouter();

  const createMutation = useMutation({
    mutationFn: quizApi.create,
    onSuccess: (quiz) => {
      toast.success('Quiz criado!');
      router.push(`/quiz/${quiz.id}/edit`);
    },
    onError: () => toast.error('Erro ao criar quiz'),
  });

  return (
    <QuizEditor
      initialData={{ title: '', description: '', isPublic: false, randomizeQ: false, randomizeA: false, questions: [] }}
      onSave={(data) => createMutation.mutate(data)}
      isSaving={createMutation.isPending}
    />
  );
}
