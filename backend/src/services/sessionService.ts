import { PrismaClient, SessionMode } from '@prisma/client';

const prisma = new PrismaClient();

function generatePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function createSession(quizId: string, hostId: string, mode: SessionMode = 'COMPETITIVE') {
  // ensure unique PIN
  let pin: string;
  let attempts = 0;
  do {
    pin = generatePin();
    attempts++;
    if (attempts > 20) throw new Error('Could not generate unique PIN');
  } while (await prisma.quizSession.findUnique({ where: { pin } }));

  return prisma.quizSession.create({
    data: { pin, quizId, hostId, mode },
    include: { quiz: { include: { questions: { orderBy: { order: 'asc' } } } } },
  });
}

export async function getSessionByPin(pin: string) {
  return prisma.quizSession.findUnique({
    where: { pin },
    include: {
      quiz: { include: { questions: { orderBy: { order: 'asc' } } } },
      participants: true,
    },
  });
}

export async function getLeaderboard(sessionId: string, limit = 5) {
  return prisma.participant.findMany({
    where: { sessionId },
    orderBy: { score: 'desc' },
    take: limit,
    select: { id: true, nickname: true, avatar: true, score: true, streak: true },
  });
}

export async function getFullLeaderboard(sessionId: string) {
  return prisma.participant.findMany({
    where: { sessionId },
    orderBy: { score: 'desc' },
    select: { id: true, nickname: true, avatar: true, score: true, streak: true },
  });
}
