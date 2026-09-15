import { describe, it, expect } from 'vitest';
import { calculateScore, isAnswerCorrect, checkPuzzleAnswer, checkSliderAnswer } from './scoringService';

describe('calculateScore', () => {
  it('returns 0 for wrong answer', () => {
    const r = calculateScore(false, 5000, 30000, 0);
    expect(r.pointsEarned).toBe(0);
    expect(r.newStreak).toBe(0);
  });

  it('awards max points for instant correct answer', () => {
    const r = calculateScore(true, 0, 30000, 0);
    expect(r.pointsEarned).toBe(1000 + 500); // base + max time bonus
    expect(r.newStreak).toBe(1);
  });

  it('applies combo bonus at streak 2+', () => {
    const r = calculateScore(true, 0, 30000, 2); // streak 2 → next is 3 → +400
    expect(r.comboBonus).toBe(400);
  });

  it('resets streak on wrong answer', () => {
    const r = calculateScore(false, 5000, 30000, 5);
    expect(r.newStreak).toBe(0);
  });
});

describe('isAnswerCorrect', () => {
  const mcOptions = [
    { id: 'a', text: 'Paris', isCorrect: true },
    { id: 'b', text: 'Rome', isCorrect: false },
  ];

  it('validates MULTIPLE_CHOICE correctly', () => {
    expect(isAnswerCorrect('MULTIPLE_CHOICE', ['a'], mcOptions)).toBe(true);
    expect(isAnswerCorrect('MULTIPLE_CHOICE', ['b'], mcOptions)).toBe(false);
  });

  it('validates TRUE_FALSE', () => {
    const opts = [
      { id: 'true', text: 'Verdadeiro', isCorrect: true },
      { id: 'false', text: 'Falso', isCorrect: false },
    ];
    expect(isAnswerCorrect('TRUE_FALSE', ['true'], opts)).toBe(true);
  });
});

describe('checkSliderAnswer', () => {
  it('accepts values within tolerance', () => {
    expect(checkSliderAnswer(50, 52, 5)).toBe(true);
    expect(checkSliderAnswer(50, 60, 5)).toBe(false);
  });
});

describe('checkPuzzleAnswer', () => {
  it('checks order exactly', () => {
    expect(checkPuzzleAnswer(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(true);
    expect(checkPuzzleAnswer(['b', 'a', 'c'], ['a', 'b', 'c'])).toBe(false);
  });
});
