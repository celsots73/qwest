import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function buildCsvData(sessionId: string): Promise<string> {
  const session = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: {
      quiz: { include: { questions: { orderBy: { order: 'asc' } } } },
      participants: {
        include: { answers: { include: { question: true } } },
        orderBy: { score: 'desc' },
      },
    },
  });
  if (!session) throw new Error('Session not found');

  const questions = session.quiz.questions;
  const headers = ['Posição', 'Nickname', 'Pontuação', 'Streak', ...questions.map(q => `P${q.order + 1}`)];

  const rows = session.participants.map((p, idx) => {
    const answersByQ = Object.fromEntries(p.answers.map(a => [a.questionId, a]));
    return [
      idx + 1,
      p.nickname,
      p.score,
      p.streak,
      ...questions.map(q => {
        const a = answersByQ[q.id];
        if (!a) return 'Sem resposta';
        return a.isCorrect ? `Correto (${a.pointsEarned}pts)` : 'Errado';
      }),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export async function getAnalytics(sessionId: string) {
  const session = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: {
      quiz: { include: { questions: true } },
      participants: { include: { answers: true } },
    },
  });
  if (!session) throw new Error('Session not found');

  const totalParticipants = session.participants.length;
  const questionStats = session.quiz.questions.map(q => {
    const answers = session.participants.flatMap(p => p.answers.filter(a => a.questionId === q.id));
    const correct = answers.filter(a => a.isCorrect).length;
    const avgTime = answers.length ? answers.reduce((s, a) => s + a.responseTimeMs, 0) / answers.length : 0;
    return {
      questionId: q.id,
      text: q.text,
      order: q.order,
      totalAnswers: answers.length,
      correctCount: correct,
      accuracy: answers.length ? (correct / answers.length) * 100 : 0,
      avgResponseMs: Math.round(avgTime),
    };
  });

  const scores = session.participants.map(p => p.score);
  const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  return { totalParticipants, avgScore: Math.round(avgScore), questionStats };
}
