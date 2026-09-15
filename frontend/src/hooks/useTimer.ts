'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

export function useTimer(seconds: number, onEnd?: () => void) {
  const [remaining, setRemaining] = useState(seconds);
  const endCbRef = useRef(onEnd);
  endCbRef.current = onEnd;

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      endCbRef.current?.();
      return;
    }
    const id = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining]);

  const reset = useCallback(() => setRemaining(seconds), [seconds]);
  const pct = Math.round((remaining / seconds) * 100);

  return { remaining, pct, reset };
}
