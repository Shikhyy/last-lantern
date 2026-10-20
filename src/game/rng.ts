/**
 * Seeded, serialisable randomness. The engine never calls `Math.random`.
 *
 * xorshift32 is enough for a turn-based deduction game and gives us a single
 * 32-bit cursor that can be saved and restored exactly (F-28 / AC-07).
 */

export class Rng {
  private cursor: number;

  constructor(seed: number) {
    this.cursor = ((seed >>> 0) ^ 0x9e3779b9) >>> 0;
  }

  get state(): number {
    return this.cursor >>> 0;
  }

  restore(state: number): void {
    this.cursor = state >>> 0;
  }

  /** Uniform in [0, 1). mulberry32: one 32-bit cursor, well mixed from the first draw. */
  next(): number {
    this.cursor = (this.cursor + 0x6d2b79f5) >>> 0;
    let t = this.cursor;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(maxExclusive: number): number {
    if (maxExclusive <= 0) return 0;
    return Math.floor(this.next() * maxExclusive);
  }

  between(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick called with an empty list');
    return items[this.int(items.length)];
  }

  shuffle<T>(items: readonly T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = this.int(i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /** Box–Muller, clamped to four standard deviations. */
  gauss(mean = 0, sigma = 1): number {
    const u = Math.max(this.next(), 1e-9);
    const v = this.next();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return mean + Math.max(-4, Math.min(4, z)) * sigma;
  }

  weighted<T>(entries: readonly { item: T; weight: number }[]): T {
    const total = entries.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);
    if (total <= 0) return this.pick(entries).item;
    let ticket = this.next() * total;
    for (const entry of entries) {
      ticket -= Math.max(0, entry.weight);
      if (ticket <= 0) return entry.item;
    }
    return entries[entries.length - 1].item;
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
