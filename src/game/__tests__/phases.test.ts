import { describe, expect, it } from 'vitest';
import { applyAction } from '../engine';
import { createMatch } from '../match';
import { advance, forcePreferences, makeOptions, toCouncil, toVote, detail } from './helpers';
import { living } from '../state';

describe('phase clock', () => {
  it('opens at Dawn 1 with the full lantern', () => {
    const state = createMatch(makeOptions());
    expect(state.phase).toBe('dawn');
    expect(state.round).toBe(1);
    expect(state.lantern).toBe(100);
  });

  it('walks Dawn to Day to Dusk to Council', () => {
    let state = createMatch(makeOptions());
    state = advance(state);
    expect(state.phase).toBe('day');
    expect(state.missions.filter((mission) => mission.round === 1)).toHaveLength(2);
    state = advance(state);
    expect(state.phase).toBe('dusk');
    state = advance(state);
    expect(state.phase).toBe('council');
    expect(state.council).not.toBeNull();
  });

  it('refuses to advance out of Council before the vote resolves', () => {
    const state = toCouncil(createMatch(makeOptions()));
    const before = JSON.stringify(state);
    const result = applyAction(state, { type: 'ADVANCE' });
    expect(result.error).toBeTruthy();
    expect(JSON.stringify(result.state)).toBe(before);
  });

  it('applies the dawn tick exactly once per new dawn', () => {
    let state = toVote(createMatch(makeOptions({ seed: 7 })));
    const target = living(state).find((entry) => !entry.isPlayer)!.id;
    const prefs: Record<string, string> = {};
    for (const entry of state.contestants) {
      if (!entry.isPlayer && entry.alive) prefs[entry.id] = target;
    }
    forcePreferences(state, prefs);
    state = detail(applyAction(state, { type: 'VOTE', targetId: target }));
    state = advance(state);
    expect(state.phase).toBe('night');
    state = detail(applyAction(state, { type: 'NIGHT_ACTION' }));
    expect(state.phase).toBe('judgment');
    state = advance(state);
    expect(state.phase).toBe('dawn');
    expect(state.round).toBe(2);
    expect(state.lantern).toBe(90);
    const ticks = state.ledger.filter((entry) => entry.reason === 'The night burns down');
    expect(ticks).toHaveLength(1);
    state = advance(state);
    expect(state.phase).toBe('day');
    expect(state.lantern).toBe(90);
  });

  it('does not mutate the input state on an illegal action', () => {
    const state = createMatch(makeOptions());
    const before = JSON.stringify(state);
    const result = applyAction(state, { type: 'EXPLORE', room: 'gallery' });
    expect(result.error).toBeTruthy();
    expect(JSON.stringify(state)).toBe(before);
  });
});
