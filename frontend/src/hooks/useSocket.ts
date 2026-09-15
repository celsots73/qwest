'use client';
import { useEffect } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { useGameStore } from '@/stores/gameStore';

export function useHostSocket(pin: string, maxParticipants = 0) {
  const store = useGameStore();
  const socket = connectSocket();

  useEffect(() => {
    store.reset();
    socket.emit('host:join', { pin, maxParticipants });

    socket.on('game:question', (data) => store.setQuestion(data));
    socket.on('game:leaderboard', ({ leaderboard }) => store.setLeaderboard(leaderboard));
    socket.on('game:end', ({ leaderboard }) => { store.setLeaderboard(leaderboard); store.setPhase('podium'); });
    socket.on('host:answer_count', ({ count, total }) => store.setAnswerCount(count, total));
    socket.on('room:player_joined', ({ total }) => store.setTotalParticipants(total));

    return () => {
      socket.off('game:question');
      socket.off('game:leaderboard');
      socket.off('game:end');
      socket.off('host:answer_count');
      socket.off('room:player_joined');
    };
  }, [pin]);

  const startQuiz = () => socket.emit('host:start', { pin });
  const nextQuestion = () => socket.emit('host:next', { pin });
  const endQuiz = () => socket.emit('host:end', { pin });

  return { startQuiz, nextQuestion, endQuiz };
}

export function usePlayerSocket(pin: string, nickname: string, avatar: string, onError?: (msg: string) => void) {
  const store = useGameStore();
  const socket = connectSocket();

  useEffect(() => {
    store.reset();
    socket.emit('player:join', { pin, nickname, avatar });

    socket.on('player:joined', ({ participant }) => store.setMyParticipant(participant));
    socket.on('game:start', () => store.setPhase('waiting'));
    socket.on('game:question', (data) => store.setQuestion(data));
    socket.on('player:answer_result', (r) => store.setAnswerResult(r));
    socket.on('game:leaderboard', ({ leaderboard }) => store.setLeaderboard(leaderboard));
    socket.on('game:end', ({ leaderboard }) => { store.setLeaderboard(leaderboard); store.setPhase('podium'); });
    socket.on('error', ({ msg }: { msg: string }) => onError?.(msg));

    return () => {
      ['player:joined', 'game:start', 'game:question', 'player:answer_result', 'game:leaderboard', 'game:end', 'error']
        .forEach(e => socket.off(e));
    };
  }, [pin]);

  const submitAnswer = (value: unknown) => socket.emit('player:answer', { value });

  return { submitAnswer };
}
