import { describe, expect, it } from 'vitest';
import { applyAction } from '../engine';
import { createMatch } from '../match';
import { lastEliminated, revealJudgment, roleName } from '../judgment';
import { knowledgeOf } from '../state';
import { living } from '../state';
import { detail, findSeedForPlayerRole, forcePreferences, makeOptions, toVote } from './helpers';

describe('elimination and delayed role reveal', () => {
  it('keeps a banished role hidden until the Judgment reads it', () => {
    let state = toVote(findSeedForPlayerRole('oathkeeper').state);
    const target = living(state).find((entry) => entry.role !== 'shadow' && !entry.isPlayer)!;
    const prefs: Record<string, string> = {};
    for (const entry of state.contestants) {
      if (!entry.isPlayer && entry.alive) prefs[entry.id] = target.id;
    }
    forcePreferences(state, prefs);
    state = detail(applyAction(state, { type: 'VOTE', targetId: target.id }));
    const banished = state.contestants.find((entry) => entry.id === target.id)!;
    expect(banished.alive).toBe(false);
    expect(banished.revealedRole).toBeNull();
    expect(state.events.some((event) => event.text.includes('not yet read'))).toBe(true);
    state = detail(applyAction(state, { type: 'ADVANCE' }));
    expect(state.phase).toBe('night');
    expect(banished.revealedRole).toBeNull();
    state = detail(applyAction(state, { type: 'NIGHT_ACTION' }));
    expect(state.phase).toBe('judgment');
    expect(state.contestants.find((entry) => entry.id === target.id)!.revealedRole).toBe(
      target.role,
    );
    expect(state.journal.some((entry) => entry.title === `The Judgment: ${target.name}`)).toBe(true);
  });

  it('reads a night’s Veil victim and that day’s banishment in the same Judgment', () => {
    const state = toVote(findSeedForPlayerRole('oathkeeper').state);
    const target = living(state).find((entry) => !entry.isPlayer)!;
    const prefs: Record<string, string> = {};
    for (const entry of state.contestants) {
      if (!entry.isPlayer && entry.alive) prefs[entry.id] = target.id;
    }
    forcePreferences(state, prefs);
    let current = detail(applyAction(state, { type: 'VOTE', targetId: target.id }));
    current = detail(applyAction(current, { type: 'ADVANCE' }));
    expect(current.phase).toBe('night');
    current = detail(applyAction(current, { type: 'NIGHT_ACTION' }));
    expect(current.phase).toBe('judgment');
    const dead = current.contestants.filter((entry) => !entry.alive);
    expect(dead.length).toBeGreaterThanOrEqual(2);
    for (const entry of dead) expect(entry.revealedRole).toBe(entry.role);
    expect(current.journal.filter((entry) => entry.title.startsWith('The Judgment')).length).toBeGreaterThanOrEqual(2);
  });

  it('reports the last elimination of the night and its role name', () => {
    const state = createMatch(makeOptions({ seed: 81 }));
    const victim = state.contestants.find((entry) => !entry.isPlayer)!;
    victim.alive = false;
    victim.eliminatedOn = state.round;
    victim.eliminatedBy = 'council';
    expect(lastEliminated(state)).toBe(victim.id);
    expect(roleName('shadow')).toBe('Shadowed');
    expect(roleName('keeper')).toBe('the Lantern Keeper');
    expect(roleName('warden')).toBe('the Warden');
    expect(roleName('oathkeeper')).toBe('an Oathkeeper');
  });

  it('raises suspicion of the people who pushed an innocent banishment once the role is read', () => {
    let state = toVote(findSeedForPlayerRole('oathkeeper').state);
    const target = living(state).find((entry) => entry.role !== 'shadow' && !entry.isPlayer)!;
    const prefs: Record<string, string> = {};
    for (const entry of state.contestants) {
      if (!entry.isPlayer && entry.alive) prefs[entry.id] = target.id;
    }
    forcePreferences(state, prefs);
    state = detail(applyAction(state, { type: 'VOTE', targetId: target.id }));
    const observers = state.contestants.filter((entry) => !entry.isPlayer && entry.alive);
    const observer = observers[0];
    const voter = observers[1];
    const before = knowledgeOf(state, observer.id).suspicion[voter.id];
    state = detail(applyAction(state, { type: 'ADVANCE' }));
    state = detail(applyAction(state, { type: 'NIGHT_ACTION' }));
    expect(state.phase).toBe('judgment');
    expect(knowledgeOf(state, observer.id).suspicion[voter.id]).toBeGreaterThan(before);
  });

  it('ends the match when the last Shadowed is banished', () => {
    const state = toVote(findSeedForPlayerRole('oathkeeper').state);
    const shadows = state.contestants.filter((entry) => entry.role === 'shadow');
    const target = shadows[0];
    for (const shadow of shadows.slice(1)) {
      shadow.alive = false;
      shadow.eliminatedOn = 0;
      shadow.eliminatedBy = 'council';
    }
    const prefs: Record<string, string> = {};
    for (const entry of state.contestants) {
      if (!entry.isPlayer && entry.alive) prefs[entry.id] = target.id;
    }
    forcePreferences(state, prefs);
    let current = detail(applyAction(state, { type: 'VOTE', targetId: target.id }));
    expect(current.outcome).toBe('oathkeeper');
    current = detail(applyAction(current, { type: 'ADVANCE' }));
    expect(current.phase).toBe('judgment');
    const events = revealJudgment(current);
    expect(events).toHaveLength(0);
    current = detail(applyAction(current, { type: 'ADVANCE' }));
    expect(current.phase).toBe('ending');
    expect(current.ending!.faction).toBe('oathkeeper');
  });
});
