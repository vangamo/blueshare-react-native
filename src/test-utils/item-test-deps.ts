import type { Clock, IdGenerator } from '@/items/domain/ports';

/** A clock that returns `start`, then `start + step`, and so on. */
export function fixedClock(start = 1_700_000_000_000, step = 0): Clock {
  let next = start;
  return {
    now: () => {
      const value = next;
      next += step;
      return value;
    },
  };
}

/** IDs `id-1`, `id-2`, … */
export function sequentialIds(prefix = 'id-'): IdGenerator {
  let count = 0;
  return { newId: () => `${prefix}${++count}` };
}
