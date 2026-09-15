import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { roomManager } from './roomManager';
import { getSessionByPin, getLeaderboard, getFullLeaderboard } from '../services/sessionService';
import { calculateScore, isAnswerCorrect } from '../services/scoringService';

const prisma = new PrismaClient();

export function registerEvents(io: Server, socket: Socket) {
  // ── HOST: creates room after PIN is issued ──────────────────────────────
  socket.on('host:join', async ({ pin }: { pin: string }) => {
    const session = await getSessionByPin(pin);
    if (!session) return socket.emit('error', { msg: 'Session not found' });

    socket.join(pin);
    roomManager.create(pin, session.id, socket.id);
    socket.emit('host:joined', { session });
  });

  // ── PARTICIPANT: enters with PIN + avatar ───────────────────────────────
  socket.on('player:join', async ({ pin, nickname, avatar }: { pin: string; nickname: string; avatar: string }) => {
    const room = roomManager.get(pin);
    if (!room) return socket.emit('error', { msg: 'Room not found' });
    if (room.status !== 'waiting') return socket.emit('error', { msg: 'Game already started' });

    const participant = await prisma.participant.create({
      data: { sessionId: room.sessionId, nickname, avatar },
    });

    socket.join(pin);
    socket.data.participantId = participant.id;
    socket.data.pin = pin;

    roomManager.update(pin, { totalParticipants: room.totalParticipants + 1 });

    socket.emit('player:joined', { participant });
    io.to(pin).emit('room:player_joined', {
      participant: { id: participant.id, nickname, avatar },
      total: room.totalParticipants + 1,
    });
  });

  // ── HOST: starts the quiz ───────────────────────────────────────────────
  socket.on('host:start', async ({ pin }: { pin: string }) => {
    const room = roomManager.get(pin);
    if (!room || room.hostSocketId !== socket.id) return;

    const session = await getSessionByPin(pin);
    if (!session) return;

    await prisma.quizSession.update({ where: { id: room.sessionId }, data: { status: 'ACTIVE', startedAt: new Date() } });

    const question = session.quiz.questions[0];
    roomManager.update(pin, { status: 'active', currentQ: 0, questionStartedAt: Date.now(), answerCount: 0 });

    io.to(pin).emit('game:start');
    io.to(pin).emit('game:question', {
      index: 0,
      total: session.quiz.questions.length,
      question: stripCorrectAnswers(question),
      timeLimit: question.timeLimit,
    });
  });

  // ── PARTICIPANT: submits answer ─────────────────────────────────────────
  socket.on('player:answer', async ({ value }: { value: unknown }) => {
    const { participantId, pin } = socket.data;
    if (!participantId || !pin) return;

    const room = roomManager.get(pin);
    if (!room || room.status !== 'active') return;

    const session = await getSessionByPin(pin);
    if (!session) return;

    const question = session.quiz.questions[room.currentQ];
    const responseTimeMs = Date.now() - room.questionStartedAt;

    const correct = isAnswerCorrect(question.type, value, question.options as any);

    const participant = await prisma.participant.findUnique({ where: { id: participantId } });
    if (!participant) return;

    const { pointsEarned, newStreak, comboBonus, timeBonus } = calculateScore(
      correct,
      responseTimeMs,
      question.timeLimit * 1000,
      participant.streak,
      question.pointsBase,
    );

    await prisma.$transaction([
      prisma.answer.create({
        data: {
          participantId,
          questionId: question.id,
          value: value as any,
          isCorrect: correct,
          pointsEarned,
          responseTimeMs,
        },
      }),
      prisma.participant.update({
        where: { id: participantId },
        data: { score: { increment: pointsEarned }, streak: newStreak },
      }),
    ]);

    const newAnswerCount = room.answerCount + 1;
    roomManager.update(pin, { answerCount: newAnswerCount });

    socket.emit('player:answer_result', { correct, pointsEarned, comboBonus, timeBonus, newStreak });

    // notify host of live answer count
    io.to(room.hostSocketId).emit('host:answer_count', {
      count: newAnswerCount,
      total: room.totalParticipants,
    });
  });

  // ── HOST: moves to next question ────────────────────────────────────────
  socket.on('host:next', async ({ pin }: { pin: string }) => {
    const room = roomManager.get(pin);
    if (!room || room.hostSocketId !== socket.id) return;

    const session = await getSessionByPin(pin);
    if (!session) return;

    const leaderboard = await getLeaderboard(room.sessionId);
    io.to(pin).emit('game:leaderboard', { leaderboard });

    const nextIndex = room.currentQ + 1;

    if (nextIndex >= session.quiz.questions.length) {
      // end of quiz
      await prisma.quizSession.update({ where: { id: room.sessionId }, data: { status: 'FINISHED', endedAt: new Date() } });
      roomManager.update(pin, { status: 'finished' });
      const finalLeaderboard = await getFullLeaderboard(room.sessionId);
      io.to(pin).emit('game:end', { leaderboard: finalLeaderboard });
      return;
    }

    const question = session.quiz.questions[nextIndex];
    roomManager.update(pin, { currentQ: nextIndex, questionStartedAt: Date.now(), answerCount: 0, status: 'active' });

    await prisma.quizSession.update({ where: { id: room.sessionId }, data: { currentQ: nextIndex, status: 'ACTIVE' } });

    io.to(pin).emit('game:question', {
      index: nextIndex,
      total: session.quiz.questions.length,
      question: stripCorrectAnswers(question),
      timeLimit: question.timeLimit,
    });
  });

  // ── HOST: ends session early ────────────────────────────────────────────
  socket.on('host:end', async ({ pin }: { pin: string }) => {
    const room = roomManager.get(pin);
    if (!room || room.hostSocketId !== socket.id) return;
    await prisma.quizSession.update({ where: { id: room.sessionId }, data: { status: 'FINISHED', endedAt: new Date() } });
    const finalLeaderboard = await getFullLeaderboard(room.sessionId);
    io.to(pin).emit('game:end', { leaderboard: finalLeaderboard });
    roomManager.update(pin, { status: 'finished' });
  });

  // ── DISCONNECT ──────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const room = roomManager.findBySocketId(socket.id);
    if (room) {
      io.to(room.pin).emit('host:disconnected');
      // room stays in memory so host can reconnect
    }
  });
}

// never send isCorrect to participants during active question
function stripCorrectAnswers(question: any) {
  const { options, ...rest } = question;
  return {
    ...rest,
    options: (options as any[]).map(({ id, text }: any) => ({ id, text })),
  };
}
