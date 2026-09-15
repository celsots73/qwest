import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient, SessionMode } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createSession, getSessionByPin, getFullLeaderboard } from '../services/sessionService';

const router = Router();
const prisma = new PrismaClient();

const createSchema = z.object({
  quizId: z.string(),
  mode: z.nativeEnum(SessionMode).default('COMPETITIVE'),
});

// Create session (returns PIN)
router.post('/', requireAuth, validate(createSchema), async (req: AuthRequest, res) => {
  try {
    // check quiz belongs to user
    const quiz = await prisma.quiz.findFirst({ where: { id: req.body.quizId, authorId: req.userId } });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const session = await createSession(req.body.quizId, req.userId!, req.body.mode);
    res.status(201).json(session);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to create session' });
  }
});

// Get session by PIN (public — participant uses this)
router.get('/pin/:pin', async (req, res) => {
  const session = await getSessionByPin(req.params.pin);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (session.status === 'FINISHED') return res.status(410).json({ error: 'Session already ended' });
  res.json({ id: session.id, pin: session.pin, status: session.status, quiz: { title: session.quiz.title } });
});

// Get session results (host only)
router.get('/:id/results', requireAuth, async (req: AuthRequest, res) => {
  const session = await prisma.quizSession.findFirst({
    where: { id: req.params.id, hostId: req.userId },
    include: {
      quiz: { include: { questions: true } },
      participants: {
        include: { answers: true },
        orderBy: { score: 'desc' },
      },
    },
  });
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

// Delete session (host only)
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  const session = await prisma.quizSession.findFirst({ where: { id: req.params.id, hostId: req.userId } });
  if (!session) return res.status(404).json({ error: 'Session not found' });
  await prisma.quizSession.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// List host's sessions
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const sessions = await prisma.quizSession.findMany({
    where: { hostId: req.userId },
    include: {
      quiz: { select: { title: true } },
      _count: { select: { participants: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(sessions);
});

export default router;
