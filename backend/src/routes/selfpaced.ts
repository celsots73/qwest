// Self-paced mode: participant gets all questions at once, answers without live sync
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { isAnswerCorrect } from '../services/scoringService';

const router = Router();
const prisma = new PrismaClient();

// Get quiz for self-paced play (public or by PIN)
router.get('/quiz/:pin', async (req, res) => {
  const session = await prisma.quizSession.findUnique({
    where: { pin: req.params.pin },
    include: { quiz: { include: { questions: { orderBy: { order: 'asc' } } } } },
  });
  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (session.mode !== 'SELF_PACED') return res.status(400).json({ error: 'Not a self-paced session' });

  // strip correct answers from options
  const questions = session.quiz.questions.map(q => ({
    ...q,
    options: (q.options as any[]).map(({ id, text }: any) => ({ id, text })),
  }));
  res.json({ session: { id: session.id, pin: session.pin }, quiz: { ...session.quiz, questions } });
});

const submitSchema = z.object({
  nickname: z.string().min(1),
  avatar: z.string(),
  answers: z.array(z.object({ questionId: z.string(), value: z.unknown(), responseTimeMs: z.number() })),
});

// Submit all answers at once (self-paced)
router.post('/quiz/:pin/submit', validate(submitSchema), async (req, res) => {
  const session = await prisma.quizSession.findUnique({
    where: { pin: req.params.pin },
    include: { quiz: { include: { questions: true } } },
  });
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const { nickname, avatar, answers } = req.body;

  const participant = await prisma.participant.create({
    data: { sessionId: session.id, nickname, avatar },
  });

  const questionMap = Object.fromEntries(session.quiz.questions.map(q => [q.id, q]));
  let totalScore = 0;

  const answerRecords = answers.map(({ questionId, value, responseTimeMs }: any) => {
    const q = questionMap[questionId];
    if (!q) return null;
    const correct = isAnswerCorrect(q.type, value, q.options as any);
    const points = correct ? q.pointsBase : 0;
    totalScore += points;
    return { participantId: participant.id, questionId, value, isCorrect: correct, pointsEarned: points, responseTimeMs };
  }).filter(Boolean);

  await prisma.$transaction([
    prisma.answer.createMany({ data: answerRecords as any }),
    prisma.participant.update({ where: { id: participant.id }, data: { score: totalScore } }),
  ]);

  // full results with correct answers revealed
  const results = answers.map(({ questionId, value }: any) => {
    const q = questionMap[questionId];
    const correct = q ? isAnswerCorrect(q.type, value, q.options as any) : false;
    return { questionId, correct, correctOptions: correct ? undefined : (q?.options as any[])?.filter((o: any) => o.isCorrect) };
  });

  res.json({ score: totalScore, results });
});

export default router;
