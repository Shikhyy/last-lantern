import type { Rng } from './rng';
import { ROLE_COUNTS, type Role } from './types';

export interface Seat {
  id: string;
  characterId: string;
}

/** Builds the authored role bag: 3 Shadowed, 1 Keeper, 1 Warden, 7 Oathkeepers. */
export function roleBag(): Role[] {
  const bag: Role[] = [];
  (Object.keys(ROLE_COUNTS) as Role[]).forEach((role) => {
    for (let i = 0; i < ROLE_COUNTS[role]; i += 1) bag.push(role);
  });
  return bag;
}

/**
 * Assigns roles with the seeded shuffle. The only character-specific input is
 * the documented soft anti-repeat: no character repeats last match's role on
 * the same save unless Fully Random is enabled (F-02).
 */
export function assignRoles(
  rng: Rng,
  seats: readonly Seat[],
  antiRepeat: Record<string, Role> = {},
  fullyRandom = false,
): Record<string, Role> {
  const bag = rng.shuffle(roleBag());
  const assignment: Record<string, Role> = {};
  seats.forEach((seat, index) => {
    assignment[seat.id] = bag[index];
  });

  if (!fullyRandom) {
    // A soft constraint: one swap pass, then accept whatever is left so the
    // role counts can never be disturbed.
    for (const seat of seats) {
      const previous = antiRepeat[seat.characterId];
      if (!previous || assignment[seat.id] !== previous) continue;
      const partner = seats.find((candidate) => {
        if (candidate.id === seat.id) return false;
        const candidateRole = assignment[candidate.id];
        if (candidateRole === assignment[seat.id]) return false;
        if (antiRepeat[seat.characterId] === candidateRole) return false;
        if (antiRepeat[candidate.characterId] === assignment[seat.id]) return false;
        return true;
      });
      if (partner) {
        const swap = assignment[partner.id];
        assignment[partner.id] = assignment[seat.id];
        assignment[seat.id] = swap;
      }
    }
  }

  return assignment;
}

export function countAssignments(assignment: Record<string, Role>): Record<Role, number> {
  const counts: Record<Role, number> = { shadow: 0, keeper: 0, warden: 0, oathkeeper: 0 };
  for (const role of Object.values(assignment)) counts[role] += 1;
  return counts;
}
