// Qwest scoring engine
// Points = base * time_factor + combo_bonus

const BASE_POINTS = 1000;
const MAX_TIME_BONUS = 500;
const COMBO_BONUSES = [0, 0, 200, 400, 600, 800, 1000]; // index = streak length

export interface ScoreResult {
  pointsEarned: number;
  newStreak: number;
  comboBonus: number;
  timeBonus: number;
}

export function calculateScore(
  isCorrect: boolean,
  responseTimeMs: number,
  timeLimitMs: number,
  currentStreak: number,
  pointsBase = BASE_POINTS,
): ScoreResult {
  if (!isCorrect) return { pointsEarned: 0, newStreak: 0, comboBonus: 0, timeBonus: 0 };

  // faster = more bonus (linear decay)
  const ratio = Math.max(0, 1 - responseTimeMs / timeLimitMs);
  const timeBonus = Math.round(MAX_TIME_BONUS * ratio);

  const newStreak = currentStreak + 1;
  const comboIdx = Math.min(newStreak, COMBO_BONUSES.length - 1);
  const comboBonus = COMBO_BONUSES[comboIdx];

  const pointsEarned = pointsBase + timeBonus + comboBonus;
  return { pointsEarned, newStreak, comboBonus, timeBonus };
}

// For OPEN_TEXT: simple case-insensitive exact match or keyword match
export function checkOpenAnswer(given: string, correct: string): boolean {
  return given.trim().toLowerCase() === correct.trim().toLowerCase();
}

// For SLIDER: within tolerance band
export function checkSliderAnswer(given: number, correct: number, tolerance = 5): boolean {
  return Math.abs(given - correct) <= tolerance;
}

// For PUZZLE: compare order arrays
export function checkPuzzleAnswer(given: string[], correct: string[]): boolean {
  return given.length === correct.length && given.every((v, i) => v === correct[i]);
}

// Validate any question type. Returns null for poll questions (MULTIPLE_CHOICE with no correct answer).
export function isAnswerCorrect(
  type: string,
  value: unknown,
  options: Array<{ id: string; isCorrect: boolean }>,
): boolean | null {
  switch (type) {
    case 'MULTIPLE_CHOICE': {
      const correct = options.filter(o => o.isCorrect).map(o => o.id);
      if (correct.length === 0) return null; // poll mode
      const selected = Array.isArray(value) ? value : [value];
      return selected.length === correct.length && selected.every(s => correct.includes(s as string));
    }
    case 'TRUE_FALSE': {
      const selected = Array.isArray(value) ? value : [value];
      const correct = options.filter(o => o.isCorrect).map(o => o.id);
      return (
        selected.length === correct.length &&
        selected.every(s => correct.includes(s as string))
      );
    }
    case 'OPEN_TEXT': {
      return null; // poll mode — records word, no correct/wrong
    }
    case 'SLIDER': {
      const correctOpt = options.find(o => o.isCorrect);
      if (!correctOpt) return false;
      return checkSliderAnswer(Number(value), Number((correctOpt as any).value));
    }
    case 'PUZZLE': {
      const correct = options.filter(o => o.isCorrect).map(o => o.id);
      return checkPuzzleAnswer(value as string[], correct);
    }
    default:
      return false;
  }
}
