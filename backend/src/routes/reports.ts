import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { buildCsvData, getAnalytics } from '../services/exportService';

const router = Router();
const prisma = new PrismaClient();

// Analytics for a session
router.get('/sessions/:id', requireAuth, async (req: AuthRequest, res) => {
  const session = await prisma.quizSession.findFirst({ where: { id: req.params.id, hostId: req.userId } });
  if (!session) return res.status(404).json({ error: 'Not found' });

  try {
    const analytics = await getAnalytics(req.params.id);
    res.json(analytics);
  } catch {
    res.status(500).json({ error: 'Failed to generate analytics' });
  }
});

// CSV export
router.get('/sessions/:id/csv', requireAuth, async (req: AuthRequest, res) => {
  const session = await prisma.quizSession.findFirst({ where: { id: req.params.id, hostId: req.userId } });
  if (!session) return res.status(404).json({ error: 'Not found' });

  try {
    const csv = await buildCsvData(req.params.id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="qwest-session-${req.params.id}.csv"`);
    res.send(csv);
  } catch {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Dashboard overview (all sessions for this host)
router.get('/dashboard', requireAuth, async (req: AuthRequest, res) => {
  const sessions = await prisma.quizSession.findMany({
    where: { hostId: req.userId, status: 'FINISHED' },
    include: {
      quiz: { select: { title: true } },
      _count: { select: { participants: true } },
    },
    orderBy: { endedAt: 'desc' },
    take: 20,
  });
  res.json(sessions);
});

export default router;
