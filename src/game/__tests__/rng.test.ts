import { describe, expect, it } from 'vitest';
import { Rng } from '../rng';

describe('seeded RNG', () => {
  it('replays the same sequence from the same seed', () => {
    const a = new Rng(123456);
    const b = new Rng(123456);
    const left = Array.from({ length: 20 }, () => a.next());
    const right = Array.from({ length: 20 }, () => b.next());
    expect(left).toEqual(right);
  });

  it('restores from a saved cursor', () => {
    const rng = new Rng(99);
    for (let i = 0; i < 7; i += 1) rng.next();
    const cursor = rng.state;
    const expected = [rng.next(), rng.next(), rng.next()];
    rng.restore(cursor);
    expect([rng.next(), rng.next(), rng.next()]).toEqual(expected);
  });

  it('stays inside [0, 1)', () => {
    const rng = new Rng(4);
    for (let i = 0; i < 5000; i += 1) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('shuffles without losing or duplicating items', () => {
    const rng = new Rng(8);
    const shuffled = rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8]);
    expect([...shuffled].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('bounds gaussian noise at four sigma', () => {
    const rng = new Rng(17);
    for (let i = 0; i < 2000; i += 1) {
      expect(Math.abs(rng.gauss(0, 0.3))).toBeLessThanOrEqual(1.2);
    }
  });
});
