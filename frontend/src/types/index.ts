export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'OPEN_TEXT' | 'SLIDER' | 'PUZZLE';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean; // only visible to host
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  mediaUrl?: string | null;
  options: QuestionOption[];
  timeLimit: number;
  pointsBase: number;
  order: number;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  coverUrl?: string;
  isPublic: boolean;
  randomizeQ: boolean;
  randomizeA: boolean;
  theme?: Record<string, unknown>;
  questions: Question[];
  _count?: { questions: number; sessions: number };
  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  id: string;
  nickname: string;
  avatar: string;
  score: number;
  streak: number;
}

export interface Session {
  id: string;
  pin: string;
  status: 'WAITING' | 'ACTIVE' | 'BETWEEN_QUESTIONS' | 'FINISHED';
  mode: 'COMPETITIVE' | 'TEAM' | 'SELF_PACED';
  currentQ: number;
  quiz: Quiz;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// Game events payload types
export interface GameQuestion {
  index: number;
  total: number;
  question: Omit<Question, 'options'> & { options: Pick<QuestionOption, 'id' | 'text'>[] };
  timeLimit: number;
}

export interface AnswerResult {
  correct: boolean;
  pointsEarned: number;
  comboBonus: number;
  timeBonus: number;
  newStreak: number;
}
