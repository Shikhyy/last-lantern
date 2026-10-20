import { describe, expect, it } from 'vitest';
import { CAST } from '../cast';
import { createMatch } from '../match';
import type { MatchOptions } from '../types';

export function makeOptions(overrides: Partial<MatchOptions> = {}): MatchOptions {
  return {
    seed: 20261020,
    playerName: 'The Stranger',
    pronouns: 'they/them',
    oath: 'keep_promise',
    difficulty: 'normal',
    ...overrides,
  };
}

describe('match creation', () => {
  it('seats exactly twelve contestants with no duplicate character', () => {
    const state = createMatch(makeOptions());
    expect(state.contestants).toHaveLength(12);
    expect(state.contestants.filter((entry) => entry.isPlayer)).toHaveLength(1);
    const characters = state.contestants.map((entry) => entry.characterId);
    expect(new Set(characters).size).toBe(12);
    for (const member of CAST) expect(characters).toContain(member.characterId);
  });

  it('deals the authored role counts and keeps every role secret', () => {
    const state = createMatch(makeOptions());
    const counts = state.contestants.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.role] = (acc[entry.role] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({ shadow: 3, keeper: 1, warden: 1, oathkeeper: 7 });
    for (const contestant of state.contestants) {
      expect(contestant.revealedRole).toBeNull();
    }
  });

  it('starts at Dawn 1 with a full lantern and an empty ledger of deltas', () => {
    const state = createMatch(makeOptions());
    expect(state.phase).toBe('dawn');
    expect(state.round).toBe(1);
    expect(state.lantern).toBe(100);
    expect(state.ledger.every((entry) => entry.delta === 0)).toBe(true);
  });

  it('places a clue pool with one Shadow-pointing clue each night and one planted herring', () => {
    const state = createMatch(makeOptions());
    expect(state.clues.length).toBeGreaterThanOrEqual(10);
    const shadows = new Set(state.contestants.filter((entry) => entry.role === 'shadow').map((entry) => entry.id));
    for (let round = 1; round <= 5; round += 1) {
      const clues = state.clues.filter((clue) => clue.roundPlaced === round);
      expect(clues.length).toBeGreaterThanOrEqual(2);
      expect(clues.some((clue) => clue.truth === 'true' && clue.pointsTo && shadows.has(clue.pointsTo))).toBe(true);
    }
    const planted = state.clues.filter((clue) => clue.truth === 'planted');
    expect(planted).toHaveLength(1);
    expect(planted[0].tell).toBeTruthy();
  });

  it('gives every Shadowed knowledge of their allies and nobody else', () => {
    const state = createMatch(makeOptions());
    for (const contestant of state.contestants) {
      if (contestant.isPlayer) continue;
      const knowledge = state.knowledge[contestant.id];
      if (contestant.role === 'shadow') {
        expect(knowledge.shadowAllies).toHaveLength(2);
        expect(knowledge.shadowAllies).not.toContain(contestant.id);
      } else {
        expect(knowledge.shadowAllies).toEqual([]);
        expect(knowledge.channel).toEqual([]);
      }
    }
  });

  it('records the role draw for the next save-level anti-repeat', () => {
    const state = createMatch(makeOptions());
    expect(Object.keys(state.antiRepeat)).toHaveLength(12);
    expect(state.antiRepeat.player).toBe(state.contestants.find((entry) => entry.isPlayer)?.role);
  });
});
