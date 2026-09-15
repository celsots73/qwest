import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { roomManager } from './roomManager';
import { getSessionByPin, getLeaderboard, getFullLeaderboard } from '../services/sessionService';
import { calculateScore, isAnswerCorrect } from '../services/scoringService';

const prisma = new PrismaClient();

export function registerEvents(io: Server, socket: Socket) {
  // ── SPECTATOR: joins room read-only ────────────────────────────────────
  socket.on('spectator:join', async ({ pin }: { pin: string }) => {
    const room = roomManager.get(pin);
    if (!room) return socket.emit('error', { msg: 'Room not found' });
    socket.join(pin);
    socket.emit('spectator:joined', {
      status: room.status,
      currentQ: room.currentQ,
      totalParticipants: room.totalParticipants,
    });
  });

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

    const correctResult = isAnswerCorrect(question.type, value, question.options as any);
    const isPoll = correctResult === null;
    const correct = isPoll ? false : correctResult;

    const participant = await prisma.participant.findUnique({ where: { id: participantId } });
    if (!participant) return;

    const { pointsEarned, newStreak, comboBonus, timeBonus } = isPoll
      ? { pointsEarned: 0, newStreak: participant.streak, comboBonus: 0, timeBonus: 0 }
      : calculateScore(correct, responseTimeMs, question.timeLimit * 1000, participant.streak, question.pointsBase);

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

    socket.emit('player:answer_result', {
      correct: isPoll ? null : correct,
      pointsEarned, comboBonus, timeBonus, newStreak,
    });

    // broadcast answer count to whole room (spectators + host)
    io.to(pin).emit('room:answer_count', { count: newAnswerCount, total: room.totalParticipants });
    // keep legacy host-only event for backward compat
    io.to(room.hostSocketId).emit('host:answer_count', { count: newAnswerCount, total: room.totalParticipants });

    // broadcast live vote distribution for all visual question types
    const needsVoteUpdate = isPoll || question.type === 'TRUE_FALSE';
    if (needsVoteUpdate) {
      const sessionAnswers = await prisma.answer.findMany({
        where: { questionId: question.id, participant: { sessionId: room.sessionId } },
        select: { value: true },
      });

      const opts = (question.options as any[]);

      if (question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE') {
        const counts: Record<string, number> = {};
        for (const a of sessionAnswers) {
          const ids: string[] = Array.isArray(a.value) ? (a.value as string[]) : [String(a.value)];
          for (const id of ids) counts[id] = (counts[id] || 0) + 1;
        }
        io.to(pin).emit('room:vote_update', {
          type: question.type,
          distribution: opts.map((o: any) => ({ id: o.id, text: o.text, count: counts[o.id] || 0 })),
          totalAnswers: sessionAnswers.length,
        });
      } else if (question.type === 'OPEN_TEXT') {
        const freq: Record<string, number> = {};
        for (const a of sessionAnswers) {
          const word = String(a.value ?? '').toLowerCase().trim();
          if (word) freq[word] = (freq[word] || 0) + 1;
        }
        io.to(pin).emit('room:vote_update', { type: 'OPEN_TEXT', wordFrequency: freq, totalAnswers: sessionAnswers.length });
      } else if (question.type === 'SLIDER') {
        const vals = sessionAnswers.map(a => Number(a.value)).filter(v => !isNaN(v));
        const avg = vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
        const safeMin = vals.length ? Math.min(...vals) : 0;
        const safeMax = vals.length ? Math.max(...vals) : 0;
        io.to(pin).emit('room:vote_update', { type: 'SLIDER', avg, min: safeMin, max: safeMax, totalAnswers: vals.length });
      }
    }
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
