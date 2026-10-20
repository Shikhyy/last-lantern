import { describe, expect, it } from 'vitest';
import { CAST } from '../cast';
import { Rng } from '../rng';
import { assignRoles, countAssignments, roleBag } from '../roles';
import type { Role } from '../types';

const seats = [
  ...CAST.map((member, index) => ({ id: `c${index + 1}`, characterId: member.characterId })),
  { id: 'player', characterId: 'player' },
];

describe('role assignment', () => {
  it('deals exactly the authored bag', () => {
    expect(countAssignments(Object.fromEntries(roleBag().map((role, index) => [`s${index}`, role])))).toEqual({
      shadow: 3,
      keeper: 1,
      warden: 1,
      oathkeeper: 7,
    });
  });

  it('always seats three Shadowed, one Keeper, one Warden and seven Oathkeepers', () => {
    for (let seed = 1; seed <= 500; seed += 1) {
      const assignment = assignRoles(new Rng(seed), seats);
      expect(Object.keys(assignment)).toHaveLength(12);
      expect(countAssignments(assignment)).toEqual({ shadow: 3, keeper: 1, warden: 1, oathkeeper: 7 });
    }
  });

  it('includes the player seat in the draw', () => {
    const seen = new Set<Role>();
    for (let seed = 1; seed <= 800; seed += 1) {
      seen.add(assignRoles(new Rng(seed), seats).player);
    }
    expect(seen).toEqual(new Set(['shadow', 'keeper', 'warden', 'oathkeeper']));
  });

  it('is statistically independent of character identity', () => {
    const counts: Record<string, Record<Role, number>> = {};
    for (const seat of seats) {
      counts[seat.id] = { shadow: 0, keeper: 0, warden: 0, oathkeeper: 0 };
    }
    const seeds = 2400;
    for (let seed = 1; seed <= seeds; seed += 1) {
      const assignment = assignRoles(new Rng(seed), seats);
      for (const seat of seats) counts[seat.id][assignment[seat.id]] += 1;
    }
    const expected: Record<Role, number> = {
      shadow: 3 / 12,
      keeper: 1 / 12,
      warden: 1 / 12,
      oathkeeper: 7 / 12,
    };
    for (const seat of seats) {
      for (const role of Object.keys(expected) as Role[]) {
        expect(Math.abs(counts[seat.id][role] / seeds - expected[role])).toBeLessThan(0.05);
      }
    }
  });

  it('honours the soft anti-repeat down to the structural minimum', () => {
    // If k characters held role R and only c_R seats exist, at least
    // max(0, k - (12 - c_R)) of them must repeat R. A soft constraint cannot
    // beat the pigeonhole, so we assert the engine reaches that floor.
    const counts: Record<Role, number> = { shadow: 3, keeper: 1, warden: 1, oathkeeper: 7 };
    for (let seed = 1; seed <= 40; seed += 1) {
      const first = assignRoles(new Rng(seed), seats);
      const previous = Object.fromEntries(
        seats.map((seat) => [seat.characterId, first[seat.id]]),
      ) as Record<string, Role>;
      const second = assignRoles(new Rng(seed + 1000), seats, previous);
      expect(countAssignments(second)).toEqual(counts);

      let minimum = 0;
      for (const role of Object.keys(counts) as Role[]) {
        const held = Object.values(previous).filter((entry) => entry === role).length;
        minimum += Math.max(0, held - (seats.length - counts[role]));
      }
      let repeats = 0;
      for (const seat of seats) {
        if (second[seat.id] === previous[seat.characterId]) repeats += 1;
      }
      expect(repeats).toBe(minimum);
    }
  });
});
