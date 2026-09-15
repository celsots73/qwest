import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient, QuestionType, Prisma } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();
const prisma = new PrismaClient();

const questionSchema = z.object({
  type: z.nativeEnum(QuestionType),
  text: z.string().min(1),
  mediaUrl: z.string().url().optional().nullable(),
  options: z.array(z.object({
    id: z.string(),
    text: z.string(),
    isCorrect: z.boolean(),
  })).min(1),
  timeLimit: z.number().int().min(10).max(240).default(30),
  pointsBase: z.number().int().default(1000),
  order: z.number().int(),
});

const quizSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  coverUrl: z.string().url().optional().nullable(),
  isPublic: z.boolean().default(false),
  randomizeQ: z.boolean().default(false),
  randomizeA: z.boolean().default(false),
  theme: z.record(z.unknown()).optional(),
  questions: z.array(questionSchema).optional(),
});

// List user's quizzes
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const quizzes = await prisma.quiz.findMany({
    where: { authorId: req.userId },
    include: { _count: { select: { questions: true, sessions: true } } },
    orderBy: { updatedAt: 'desc' },
  });
  res.json(quizzes);
});

// Get single quiz (with questions)
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  const quiz = await prisma.quiz.findFirst({
    where: { id: req.params.id, authorId: req.userId },
    include: { questions: { orderBy: { order: 'asc' } } },
  });
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
  res.json(quiz);
});

// Create quiz
router.post('/', requireAuth, validate(quizSchema), async (req: AuthRequest, res) => {
  const { questions, ...data } = req.body;
  try {
    const quiz = await prisma.quiz.create({
      data: {
        ...data,
        authorId: req.userId!,
        questions: questions
          ? { create: questions }
          : undefined,
      },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    res.status(201).json(quiz);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

// Update quiz
router.put('/:id', requireAuth, validate(quizSchema.partial()), async (req: AuthRequest, res) => {
  const quiz = await prisma.quiz.findFirst({ where: { id: req.params.id, authorId: req.userId } });
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

  const { questions, ...data } = req.body;

  const updated = await prisma.quiz.update({
    where: { id: req.params.id },
    data: {
      ...data,
      ...(questions && {
        questions: {
          deleteMany: {},
          create: questions,
        },
      }),
    },
    include: { questions: { orderBy: { order: 'asc' } } },
  });
  res.json(updated);
});

// Delete quiz
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  const quiz = await prisma.quiz.findFirst({ where: { id: req.params.id, authorId: req.userId } });
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

  await prisma.quiz.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// Duplicate quiz
router.post('/:id/duplicate', requireAuth, async (req: AuthRequest, res) => {
  const original = await prisma.quiz.findFirst({
    where: { id: req.params.id, authorId: req.userId },
    include: { questions: { orderBy: { order: 'asc' } } },
  });
  if (!original) return res.status(404).json({ error: 'Quiz not found' });

  const { id, createdAt, updatedAt, questions, ...data } = original;
  const copy = await prisma.quiz.create({
    data: {
      ...data,
      title: `${data.title} (cópia)`,
      questions: { create: questions.map(({ id: _id, quizId: _qid, ...q }) => ({ ...q, options: q.options as Prisma.InputJsonValue })) },
    },
    include: { questions: true },
  });
  res.status(201).json(copy);
});

export default router;
