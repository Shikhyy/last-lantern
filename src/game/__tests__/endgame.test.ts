import { describe, expect, it } from 'vitest';
import { applyAction } from '../engine';
import { allEndings, chooseEndingId } from '../endings';
import { factionOutcome, living, player } from '../state';
import { judgmentNext } from '../judgment';
import { createMatch } from '../match';
import type { MatchState } from '../types';
import { advance, detail, forcePreferences, makeOptions } from './helpers';

function setAlive(state: MatchState, keep: string[]): void {
  for (const contestant of state.contestants) {
    if (keep.includes(contestant.id)) {
      contestant.alive = true;
      continue;
    }
    contestant.alive = false;
    contestant.eliminatedOn = 4;
    contestant.eliminatedBy = 'council';
  }
  state.round = 4;
  state.phase = 'judgment';
  state.lantern = 50;
  state.outcome = null;
}

function startFinale(state: MatchState): MatchState {
  const next = advance(state);
  expect(next.phase).toBe('finale');
  return next;
}

function testimony(state: MatchState): MatchState {
  return detail(
    applyAction(state, {
      type: 'FINAL_TESTIMONY',
      text: 'I have kept one promise and broken another. Weigh both.',
    }),
  );
}

function answer(state: MatchState): MatchState {
  return detail(
    applyAction(state, {
      type: 'FINAL_ANSWER',
      text: 'I protected the person the room had already decided to lose.',
    }),
  );
}

function forceAll(state: MatchState, targetId: string): void {
  const prefs: Record<string, string> = {};
  for (const contestant of state.contestants) {
    if (!contestant.isPlayer && contestant.alive) prefs[contestant.id] = targetId;
  }
  forcePreferences(state, prefs);
}

function keepFour(state: MatchState) {
  const me = player(state);
  const faithful = state.contestants.filter((entry) => entry.role !== 'shadow' && entry.id !== me.id);
  const shadow = state.contestants.filter((entry) => entry.role === 'shadow' && entry.id !== me.id);
  const keep =
    me.role === 'shadow'
      ? [me.id, ...faithful.slice(0, 3).map((entry) => entry.id)]
      : [me.id, ...faithful.slice(0, 2).map((entry) => entry.id), shadow[0].id];
  setAlive(state, keep);
  return {
    me,
    a: faithful[0].id,
    b: faithful[1].id,
    c: keep[keep.length - 1],
    shadow: shadow[0].id,
    keep,
  };
}

describe('win conditions and endings', () => {
  it('decides the faction from the living table', () => {
    const state = createMatch(makeOptions({ seed: 71 }));
    expect(factionOutcome(state)).toBeNull();
    for (const contestant of state.contestants) {
      if (contestant.role === 'shadow') contestant.alive = false;
    }
    expect(factionOutcome(state)).toBe('oathkeeper');

    const parity = createMatch(makeOptions({ seed: 72 }));
    for (const contestant of parity.contestants) {
      if (contestant.role !== 'shadow' && contestant.alive) contestant.alive = false;
    }
    expect(factionOutcome(parity)).toBe('shadow');
  });

  it('ends on the faction, opens the finale at four, and opens it on night five', () => {
    const state = createMatch(makeOptions({ seed: 73 }));
    expect(judgmentNext(state)).toBe('dawn');
    state.outcome = 'shadow';
    expect(judgmentNext(state)).toBe('ending');
    state.outcome = null;
    state.round = 5;
    expect(judgmentNext(state)).toBe('finale');
    state.round = 1;
    for (const contestant of state.contestants.slice(4)) contestant.alive = false;
    expect(judgmentNext(state)).toBe('finale');
  });

  it('hands the flame to the Oathkeepers when the final name is Shadowed', () => {
    const state = createMatch(makeOptions({ seed: 74 }));
    const { shadow } = keepFour(state);
    let current = startFinale(state);
    current = testimony(current);
    expect(current.finaleState!.step).toBe('question');
    current = answer(current);
    expect(current.finaleState!.step).toBe('vote');
    forceAll(current, shadow);
    current = detail(applyAction(current, { type: 'FINAL_VOTE', targetId: shadow }));
    expect(current.finaleState!.step).toBe('reveal');
    expect(current.outcome).toBe('oathkeeper');
    expect(current.contestants.find((entry) => entry.id === shadow)!.revealedRole).toBe('shadow');
    current = advance(current);
    expect(current.phase).toBe('ending');
    expect(current.ending!.faction).toBe('oathkeeper');
    expect(current.ending!.id).toBe('keeper_of_the_flame');
    expect(current.ending!.unmasking.roles).toHaveLength(12);
    expect(current.ending!.unmasking.roles.every((entry) => entry.role)).toBe(true);
  });

  it('hands the flame to the Shadowed when the final name is faithful, and names the betrayal', () => {
    const state = createMatch(makeOptions({ seed: 75 }));
    const me = player(state);
    const faithful = state.contestants.filter(
      (entry) => entry.role !== 'shadow' && entry.id !== me.id,
    );
    const shadow = state.contestants.find((entry) => entry.role === 'shadow' && entry.id !== me.id)!;
    const keep = [me.id, faithful[0].id, faithful[1].id, shadow.id];
    setAlive(state, keep);
    let current = startFinale(state);
    current = testimony(current);
    current = answer(current);
    forceAll(current, faithful[0].id);
    current = detail(applyAction(current, { type: 'FINAL_VOTE', targetId: faithful[0].id }));
    expect(current.outcome).toBe('shadow');
    current = advance(current);
    expect(current.phase).toBe('ending');
    expect(current.ending!.faction).toBe('shadow');
    expect(['gilded_betrayal', 'shadows_lantern']).toContain(current.ending!.id);
    if (me.role === 'shadow') expect(current.ending!.id).toBe('shadows_lantern');
    else expect(current.ending!.id).toBe('gilded_betrayal');
  });

  it('leaves the oath unlit when the final vote ties twice', () => {
    const state = createMatch(makeOptions({ seed: 76 }));
    const { a, b, c } = keepFour(state);
    let current = startFinale(state);
    current = testimony(current);
    current = answer(current);
    forcePreferences(current, { [a]: b, [b]: a, [c]: a });
    current = detail(applyAction(current, { type: 'FINAL_VOTE', targetId: b }));
    expect(current.finaleState!.round).toBe(2);
    expect(current.finaleState!.step).toBe('vote');
    forcePreferences(current, { [a]: b, [b]: a, [c]: a });
    current = detail(applyAction(current, { type: 'FINAL_VOTE', targetId: b }));
    expect(current.finaleState!.step).toBe('reveal');
    expect(current.finaleState!.noElimination).toBe('tie');
    expect(current.outcome).toBe('shadow');
    current = advance(current);
    expect(current.phase).toBe('ending');
    expect(current.ending!.id).toBe('unlit_oath');
    expect(living(current)).toHaveLength(4);
  });

  it('ends in the Long Dark when the Lantern is empty', () => {
    const state = createMatch(makeOptions({ seed: 77 }));
    state.phase = 'dawn';
    state.lantern = 0;
    const ended = advance(state);
    expect(ended.phase).toBe('ending');
    expect(ended.ending!.id).toBe('long_dark');
    expect(ended.ending!.faction).toBe('shadow');
  });

  it('lets a dead player’s finale resolve without them', () => {
    const state = createMatch(makeOptions({ seed: 78 }));
    const { keep } = keepFour(state);
    const me = player(state);
    setAlive(state, keep);
    me.alive = false;
    me.eliminatedOn = 4;
    me.eliminatedBy = 'veil';
    let current = state;
    for (let i = 0; i < 8 && current.phase !== 'ending'; i += 1) current = advance(current);
    expect(current.phase).toBe('ending');
    expect(current.ending!.playerSurvived).toBe(false);
  });

  it('maps every ending trigger and exposes all six endings', () => {
    expect(allEndings()).toHaveLength(6);
    const state = createMatch(makeOptions({ seed: 79 }));
    state.outcome = 'oathkeeper';
    expect(chooseEndingId(state, 'faction')).toBe('keeper_of_the_flame');
    state.outcome = 'shadow';
    const me = player(state);
    me.role = 'shadow';
    expect(chooseEndingId(state, 'faction')).toBe('shadows_lantern');
    me.role = 'oathkeeper';
    expect(chooseEndingId(state, 'faction')).toBe('gilded_betrayal');
    expect(chooseEndingId(state, 'long_dark')).toBe('long_dark');
    expect(chooseEndingId(state, 'unlit')).toBe('unlit_oath');
  });
});
