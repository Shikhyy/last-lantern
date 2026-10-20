import { applyAction } from '../engine';
import { createMatch } from '../match';
import type { ActionResult, MatchOptions, MatchState, Role } from '../types';

export function makeOptions(overrides: Partial<MatchOptions> = {}): MatchOptions {
  return {
    seed: 20261020,
    playerName: 'The Stranger',
    pronouns: 'they/them',
    oath: 'keep_promise',
    difficulty: 'hard',
    ...overrides,
  };
}

export function ok(result: ActionResult, context: string): MatchState {
  if (result.error) throw new Error(`${context}: ${result.error}`);
  return result.state;
}

export function detail(result: ActionResult): MatchState {
  return ok(result, 'action');
}

export function advance(state: MatchState): MatchState {
  return ok(applyAction(state, { type: 'ADVANCE' }), 'advance');
}

export function toDay(initial: MatchState): MatchState {
  return advance(initial);
}

export function toCouncil(initial: MatchState): MatchState {
  let state = advance(initial);
  state = advance(state);
  state = advance(state);
  return state;
}

/** Player takes the floor silently, so no speech effects disturb a fixture. */
export function toVote(initial: MatchState): MatchState {
  const state = toCouncil(initial);
  return ok(applyAction(state, { type: 'SPEECH', intent: 'silent' }), 'silent speech');
}

/**
 * White-box fixture: points every living AI at a chosen target. Used to test
 * the ballot rules, not the AI's judgement.
 */
export function forcePreferences(state: MatchState, prefs: Record<string, string>): void {
  for (const [voterId, targetId] of Object.entries(prefs)) {
    const knowledge = state.knowledge[voterId];
    if (!knowledge) continue;
    for (const id of Object.keys(knowledge.suspicion)) knowledge.suspicion[id] = 0.1;
    for (const relationship of Object.values(knowledge.relationships)) relationship.trust = 0;
    knowledge.suspicion[targetId] = 0.99;
  }
}

export function findSeedForPlayerRole(role: Role, max = 4000, overrides: Partial<MatchOptions> = {}): {
  seed: number;
  state: MatchState;
} {
  for (let seed = 1; seed <= max; seed += 1) {
    const state = createMatch(makeOptions({ seed, ...overrides }));
    const me = state.contestants.find((entry) => entry.isPlayer);
    if (me?.role === role) return { seed, state };
  }
  throw new Error(`No seed found for player role ${role}`);
}

export function livingIds(state: MatchState): string[] {
  return state.contestants.filter((entry) => entry.alive).map((entry) => entry.id);
}

export function shadows(state: MatchState): string[] {
  return state.contestants.filter((entry) => entry.role === 'shadow').map((entry) => entry.id);
}

export function faithful(state: MatchState): string[] {
  return state.contestants.filter((entry) => entry.role !== 'shadow').map((entry) => entry.id);
}

/** Remove every living Shadowed, without using the council. */
export function killShadows(state: MatchState): void {
  for (const contestant of state.contestants) {
    if (contestant.role === 'shadow') {
      contestant.alive = false;
      contestant.eliminatedOn = state.round;
      contestant.eliminatedBy = 'council';
    }
  }
}

/** Removes faithful until the Shadowed reach parity. */
export function killToParity(state: MatchState): void {
  for (const contestant of state.contestants) {
    if (contestant.role !== 'shadow' && contestant.alive) {
      contestant.alive = false;
      contestant.eliminatedOn = state.round;
      contestant.eliminatedBy = 'council';
    }
  }
}
