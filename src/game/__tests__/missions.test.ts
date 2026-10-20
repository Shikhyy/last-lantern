import { describe, expect, it } from 'vitest';
import { applyAction } from '../engine';
import { createMatch } from '../match';
import { detail, makeOptions, toDay } from './helpers';
import { getContestant, living } from '../state';

function fill(state: ReturnType<typeof createMatch>, missionId: string, amount: number): void {
  const mission = state.missions.find((entry) => entry.id === missionId)!;
  for (const participant of mission.participants) mission.contributions[participant] = amount;
}

describe('missions and prize pools', () => {
  it('lets the player contribute at most twice', () => {
    let state = toDay(createMatch(makeOptions()));
    const mission = state.missions[0];
    state = detail(applyAction(state, { type: 'CONTRIBUTE', missionId: mission.id }));
    state = detail(applyAction(state, { type: 'CONTRIBUTE', missionId: mission.id }));
    expect(state.missions[0].contributions[state.playerId]).toBe(2);
    const third = applyAction(state, { type: 'CONTRIBUTE', missionId: mission.id });
    expect(third.error).toBeTruthy();
    expect(third.state.missions[0].contributions[state.playerId]).toBe(2);
  });

  it('resolves a successful mission into Lantern, Embers and a lead shield', () => {
    let state = toDay(createMatch(makeOptions({ seed: 3 })));
    const mission = state.missions.find((entry) => entry.family === 'cistern-locks') ?? state.missions[0];
    mission.sabotagedBy = null;
    fill(state, mission.id, 2);
    const before = state.lantern;
    const leaders = Object.entries(mission.contributions)
      .filter(([, amount]) => amount > 0)
      .map(([id]) => id);
    state = detail(applyAction(state, { type: 'RESOLVE_MISSION', missionId: mission.id }));
    const resolved = state.missions.find((entry) => entry.id === mission.id)!;
    expect(resolved.status).toBe('resolved');
    expect(resolved.success).toBe(true);
    expect(state.lantern).toBe(before + mission.reward.lantern);
    for (const id of leaders) {
      expect(getContestant(state, id).embers).toBeGreaterThanOrEqual(mission.reward.embers);
    }
    if (mission.reward.leadShield) {
      const leader = leaders
        .map((id) => ({ id, amount: resolved.contributions[id] }))
        .sort((a, b) => b.amount - a.amount)[0];
      expect(getContestant(state, leader.id).shields).toBeGreaterThan(0);
    }
  });

  it('fails the cistern and costs the Lantern when the locks are not held', () => {
    let state = toDay(createMatch(makeOptions({ seed: 3 })));
    const mission = state.missions.find((entry) => entry.family === 'cistern-locks');
    if (!mission) return;
    mission.sabotagedBy = null;
    fill(state, mission.id, 0);
    const before = state.lantern;
    state = detail(applyAction(state, { type: 'RESOLVE_MISSION', missionId: mission.id }));
    expect(state.missions.find((entry) => entry.id === mission.id)!.success).toBe(false);
    expect(state.lantern).toBe(before - 10);
  });

  it('makes sabotage a Shadowed-only move that spoils the reward', () => {
    let state: ReturnType<typeof createMatch> | null = null;
    for (let seed = 1; seed < 400; seed += 1) {
      const candidate = toDay(createMatch(makeOptions({ seed })));
      if (candidate.contestants.find((entry) => entry.isPlayer)?.role === 'shadow') {
        state = candidate;
        break;
      }
    }
    expect(state).not.toBeNull();
    const mission = state!.missions[0];
    mission.sabotagedBy = null;
    fill(state!, mission.id, 2);
    const before = state!.lantern;
    const sabotaged = detail(applyAction(state!, { type: 'SABOTAGE', missionId: mission.id }));
    expect(sabotaged.missions[0].sabotagedBy).toBe(sabotaged.playerId);
    const resolved = detail(applyAction(sabotaged, { type: 'RESOLVE_MISSION', missionId: mission.id }));
    expect(resolved.missions[0].success).toBe(false);
    expect(resolved.lantern).toBe(before + mission.failure.lantern);
    expect(resolved.missions[0].tellClueId).toBeTruthy();
  });

  it('prevents a faithful player from sabotaging', () => {
    let state: ReturnType<typeof createMatch> | null = null;
    for (let seed = 1; seed < 400; seed += 1) {
      const candidate = toDay(createMatch(makeOptions({ seed })));
      const me = candidate.contestants.find((entry) => entry.isPlayer);
      if (me && me.role !== 'shadow') {
        state = candidate;
        break;
      }
    }
    const result = applyAction(state!, { type: 'SABOTAGE', missionId: state!.missions[0].id });
    expect(result.error).toBeTruthy();
  });

  it('seals a mission only once', () => {
    let state = toDay(createMatch(makeOptions()));
    const mission = state.missions[0];
    fill(state, mission.id, 2);
    mission.sabotagedBy = null;
    state = detail(applyAction(state, { type: 'RESOLVE_MISSION', missionId: mission.id }));
    const second = applyAction(state, { type: 'RESOLVE_MISSION', missionId: mission.id });
    expect(second.error).toBeTruthy();
  });

  it('does not change state when a mission is not on the board', () => {
    const state = toDay(createMatch(makeOptions()));
    const before = JSON.stringify(state);
    const result = applyAction(state, { type: 'RESOLVE_MISSION', missionId: 'nope' });
    expect(result.error).toBeTruthy();
    expect(JSON.stringify(result.state)).toBe(before);
    expect(living(result.state)).toHaveLength(12);
  });
});
