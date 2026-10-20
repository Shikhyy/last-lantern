import { describe, expect, it } from 'vitest';
import { applyAction } from '../engine';
import { createMatch } from '../match';
import { publicView } from '../views';
import { tallyVotes } from '../council';
import { living } from '../state';
import { detail, findSeedForPlayerRole, forcePreferences, makeOptions, toVote } from './helpers';

function faithfulTargets(state: ReturnType<typeof createMatch>): string[] {
  return living(state)
    .filter((entry) => entry.role !== 'shadow' && !entry.isPlayer)
    .map((entry) => entry.id);
}

function aiIds(state: ReturnType<typeof createMatch>): string[] {
  return living(state)
    .filter((entry) => !entry.isPlayer)
    .map((entry) => entry.id);
}

describe('council and private voting', () => {
  it('keeps every vote private until the lock', () => {
    const state = toVote(createMatch(makeOptions({ seed: 31 })));
    expect(state.council!.step).toBe('vote');
    expect(state.council!.votes).toBeNull();
    const view = publicView(state);
    expect(view.council!.votes).toBeNull();
    expect(view.council!.tally).toBeNull();
  });

  it('resolves a deterministic ballot and banishes the named contestant', () => {
    let state = toVote(findSeedForPlayerRole('oathkeeper').state);
    const [a, b] = faithfulTargets(state);
    const prefs: Record<string, string> = {};
    for (const id of aiIds(state)) prefs[id] = a;
    forcePreferences(state, prefs);
    state = detail(applyAction(state, { type: 'VOTE', targetId: b }));
    expect(state.council!.step).toBe('reveal');
    expect(state.council!.eliminatedId).toBe(a);
    const banished = state.contestants.find((entry) => entry.id === a)!;
    expect(banished.alive).toBe(false);
    expect(banished.eliminatedBy).toBe('council');
    expect(banished.revealedRole).toBeNull();
    state = detail(applyAction(state, { type: 'ADVANCE' }));
    expect(state.phase).toBe('night');
    state = detail(applyAction(state, { type: 'NIGHT_ACTION' }));
    expect(state.phase).toBe('judgment');
    expect(state.contestants.find((entry) => entry.id === a)!.revealedRole).not.toBeNull();
  });

  it('never lets an AI vote be changed by the player’s locked vote', () => {
    const state = toVote(createMatch(makeOptions({ seed: 33 })));
    const [a, b, c] = faithfulTargets(state);
    const prefs: Record<string, string> = {};
    for (const id of aiIds(state)) prefs[id] = a;
    forcePreferences(state, prefs);
    const first = detail(applyAction(structuredClone(state), { type: 'VOTE', targetId: b }));
    const second = detail(applyAction(structuredClone(state), { type: 'VOTE', targetId: c }));
    expect(first.council!.aiVotes).toEqual(second.council!.aiVotes);
    expect(first.council!.playerVote).toBe(b);
    expect(second.council!.playerVote).toBe(c);
    expect(Object.keys(first.council!.aiVotes)).not.toContain(state.playerId);
  });

  it('runs one Lantern’s Riddle on a tie and can banish on the second ballot', () => {
    let state = toVote(createMatch(makeOptions({ seed: 35 })));
    const [a, b] = faithfulTargets(state);
    const others = aiIds(state).filter((id) => id !== a && id !== b);
    const prefs: Record<string, string> = {};
    others.forEach((id, index) => {
      prefs[id] = index < 4 ? a : b;
    });
    prefs[a] = b;
    prefs[b] = a;
    forcePreferences(state, prefs);
    state = detail(applyAction(state, { type: 'VOTE', targetId: a }));
    expect(state.council!.round).toBe(2);
    expect(state.council!.step).toBe('vote');
    expect(state.council!.votes).toBeNull();
    expect(new Set(state.council!.tiedIds)).toEqual(new Set([a, b]));

    const second: Record<string, string> = {};
    others.forEach((id, index) => {
      second[id] = index < 5 ? a : b;
    });
    second[a] = b;
    second[b] = a;
    forcePreferences(state, second);
    state = detail(applyAction(state, { type: 'RIDDLE_VOTE', targetId: a }));
    expect(state.council!.step).toBe('reveal');
    expect(state.council!.eliminatedId).toBe(a);
    expect(state.contestants.find((entry) => entry.id === a)!.alive).toBe(false);
  });

  it('banishes nobody after a second tie and charges the Lantern fifteen', () => {
    let state = toVote(createMatch(makeOptions({ seed: 35 })));
    const [a, b] = faithfulTargets(state);
    const others = aiIds(state).filter((id) => id !== a && id !== b);
    const tie: Record<string, string> = {};
    others.forEach((id, index) => {
      tie[id] = index < 4 ? a : b;
    });
    tie[a] = b;
    tie[b] = a;
    forcePreferences(state, tie);
    state = detail(applyAction(state, { type: 'VOTE', targetId: a }));
    forcePreferences(state, tie);
    const before = state.lantern;
    state = detail(applyAction(state, { type: 'RIDDLE_VOTE', targetId: a }));
    expect(state.council!.noElimination).toBe('tie');
    expect(state.council!.eliminatedId).toBeNull();
    expect(state.lantern).toBe(before - 15);
    expect(living(state)).toHaveLength(12);
  });

  it('only allows a Riddle vote among the tied', () => {
    let state = toVote(createMatch(makeOptions({ seed: 35 })));
    const [a, b, c] = faithfulTargets(state);
    const others = aiIds(state).filter((id) => id !== a && id !== b);
    const prefs: Record<string, string> = {};
    others.forEach((id, index) => {
      prefs[id] = index < 4 ? a : b;
    });
    prefs[a] = b;
    prefs[b] = a;
    forcePreferences(state, prefs);
    state = detail(applyAction(state, { type: 'VOTE', targetId: a }));
    const result = applyAction(state, { type: 'RIDDLE_VOTE', targetId: c });
    expect(result.error).toBeTruthy();
  });

  it('cancels every tally to zero and charges the Lantern ten', () => {
    const state = toVote(createMatch(makeOptions({ seed: 36 })));
    const ids = living(state).map((entry) => entry.id).slice(0, 3);
    const votes = { [ids[0]]: ids[1], [ids[1]]: ids[2], [ids[2]]: ids[0] };
    const shields = { [ids[0]]: 1, [ids[1]]: 1, [ids[2]]: 1 };
    const count = tallyVotes(state, votes, shields);
    expect(count[ids[0]]).toBe(0);
    expect(count[ids[1]]).toBe(0);
    expect(count[ids[2]]).toBe(0);
  });

  it('lets the player spend a shield before the count and reduces the tally', () => {
    let state = toVote(createMatch(makeOptions({ seed: 37 })));
    const me = state.contestants.find((entry) => entry.isPlayer)!;
    me.shields = 1;
    const [target] = faithfulTargets(state);
    const prefs: Record<string, string> = {};
    for (const id of aiIds(state)) prefs[id] = me.id;
    forcePreferences(state, prefs);
    state = detail(applyAction(state, { type: 'SPEND_SHIELD' }));
    expect(state.council!.playerShieldPending).toBe(true);
    state = detail(applyAction(state, { type: 'VOTE', targetId: target }));
    expect(state.council!.shieldsSpent[me.id]).toBe(1);
    expect(state.council!.tally![me.id]).toBe(aiIds(state).length - 1);
    expect(state.contestants.find((entry) => entry.id === me.id)!.shields).toBe(0);
  });

  it('shows the speeches and the full table before the vote', () => {
    const state = toVote(createMatch(makeOptions({ seed: 38 })));
    expect(state.council!.speeches.length).toBeGreaterThan(0);
    const view = publicView(state);
    expect(view.council!.speeches.length).toBe(state.council!.speeches.length);
    for (const speech of view.council!.speeches) {
      expect(speech.text.length).toBeGreaterThan(0);
    }
  });
});
