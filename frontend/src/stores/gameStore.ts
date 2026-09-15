import { create } from 'zustand';
import { GameQuestion, AnswerResult, Participant } from '@/types';

type GamePhase = 'idle' | 'waiting' | 'question' | 'answer-result' | 'leaderboard' | 'podium';

interface GameState {
  phase: GamePhase;
  currentQuestion: GameQuestion | null;
  answerResult: AnswerResult | null;
  leaderboard: Participant[];
  myParticipant: Participant | null;
  totalParticipants: number;
  answerCount: number; // for host

  setPhase: (p: GamePhase) => void;
  setQuestion: (q: GameQuestion) => void;
  setAnswerResult: (r: AnswerResult) => void;
  setLeaderboard: (l: Participant[]) => void;
  setMyParticipant: (p: Participant) => void;
  setTotalParticipants: (n: number) => void;
  setAnswerCount: (n: number, total: number) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  phase: 'idle',
  currentQuestion: null,
  answerResult: null,
  leaderboard: [],
  myParticipant: null,
  totalParticipants: 0,
  answerCount: 0,

  setPhase: (phase) => set({ phase }),
  setQuestion: (q) => set({ currentQuestion: q, phase: 'question', answerResult: null }),
  setAnswerResult: (r) => set({ answerResult: r, phase: 'answer-result' }),
  setLeaderboard: (l) => set({ leaderboard: l, phase: 'leaderboard' }),
  setMyParticipant: (p) => set({ myParticipant: p }),
  setTotalParticipants: (n) => set({ totalParticipants: n }),
  setAnswerCount: (n, total) => set({ answerCount: n, totalParticipants: total }),
  reset: () => set({ phase: 'idle', currentQuestion: null, answerResult: null, leaderboard: [], myParticipant: null, answerCount: 0 }),
}));
