import { describe, expect, it } from 'vitest';
import { applyAction } from '../engine';
import { aiVotesForCouncil, chooseVote, rngFor } from '../ai';
import { beginNight, performNightAction } from '../night';
import { createMatch } from '../match';
import { factionOf } from '../types';
import { publicView } from '../views';
import { detail, findSeedForPlayerRole, forcePreferences, makeOptions, toVote } from './helpers';
import { living } from '../state';

function toNight(state: ReturnType<typeof createMatch>) {
  let current = toVote(state);
  const target = living(current).find((entry) => entry.role !== 'shadow' && !entry.isPlayer)!.id;
  const prefs: Record<string, string> = {};
  for (const entry of current.contestants) {
    if (!entry.isPlayer && entry.alive) prefs[entry.id] = target;
  }
  forcePreferences(current, prefs);
  current = detail(applyAction(current, { type: 'VOTE', targetId: target }));
  current = detail(applyAction(current, { type: 'ADVANCE' }));
  expect(current.phase).toBe('night');
  return current;
}

describe('night actions', () => {
  it('lets the Keeper Read a true faction, privately', () => {
    let state = toNight(findSeedForPlayerRole('keeper').state);
    const target = living(state).find((entry) => !entry.isPlayer)!;
    state = detail(applyAction(state, { type: 'NIGHT_ACTION', readTarget: target.id }));
    expect(state.phase).toBe('judgment');
    expect(state.playerIntel.reads).toHaveLength(1);
    expect(state.playerIntel.reads[0].targetId).toBe(target.id);
    expect(state.playerIntel.reads[0].faction).toBe(factionOf(target.role));
    expect(state.journal.some((entry) => entry.title === 'Your Read')).toBe(true);
    const publicJson = JSON.stringify(publicView(state));
    expect(publicJson).not.toContain('readResult');
  });

  it('lets the Warden ward someone but never themselves or the same target twice', () => {
    let state = toNight(findSeedForPlayerRole('warden').state);
    const me = state.contestants.find((entry) => entry.isPlayer)!;
    const target = living(state).find((entry) => !entry.isPlayer)!;
    const selfWard = applyAction(state, { type: 'NIGHT_ACTION', wardTarget: me.id });
    expect(selfWard.error).toBeTruthy();
    state = detail(applyAction(state, { type: 'NIGHT_ACTION', wardTarget: target.id }));
    expect(state.phase).toBe('judgment');
    expect(state.contestants.find((entry) => entry.id === me.id)!.lastWardTarget).toBe(target.id);
    expect(state.playerIntel.wards[0].targetId).toBe(target.id);

    const again = toNight(findSeedForPlayerRole('warden', 4000).state);
    const warden = again.contestants.find((entry) => entry.isPlayer)!;
    const other = living(again).find((entry) => !entry.isPlayer)!;
    warden.lastWardTarget = other.id;
    expect(applyAction(again, { type: 'NIGHT_ACTION', wardTarget: other.id }).error).toBeTruthy();
  });

  it('lets a Shadowed player draw the Veil on a Veil night', () => {
    let state = toNight(findSeedForPlayerRole('shadow').state);
    const night = state.nightState!;
    expect(night.veilTarget).toBeNull();
    const target = living(state).find(
      (entry) => entry.role !== 'shadow' && entry.id !== night.wardTarget,
    )!;
    state = detail(applyAction(state, { type: 'NIGHT_ACTION', veilTarget: target.id }));
    expect(state.phase).toBe('judgment');
    const victim = state.contestants.find((entry) => entry.id === target.id)!;
    expect(victim.alive).toBe(false);
    expect(victim.eliminatedBy).toBe('veil');
    expect(victim.revealedRole).not.toBeNull();
  });

  it('blocks the Veil with a ward and marks the rite spent', () => {
    let state = toNight(findSeedForPlayerRole('shadow').state);
    const night = state.nightState!;
    const target = living(state).find(
      (entry) => entry.role !== 'shadow' && entry.id !== night.wardTarget,
    )!;
    night.wardTarget = target.id;
    const before = living(state).length;
    state = detail(applyAction(state, { type: 'NIGHT_ACTION', veilTarget: target.id }));
    expect(state.nightState!.veilBlocked).toBe(true);
    expect(living(state)).toHaveLength(before);
    expect(state.nightState!.narration.join(' ')).toContain('No one was taken');
  });

  it('does not draw the Veil on a non-Veil night', () => {
    const state = findSeedForPlayerRole('shadow').state;
    state.round = 2;
    beginNight(state);
    expect(state.nightState!.veilTarget).toBeNull();
    expect(state.nightState!.proposals).toEqual([]);
    const target = living(state).find((entry) => entry.role !== 'shadow')!;
    const result = applyAction(state, { type: 'NIGHT_ACTION', veilTarget: target.id });
    expect(result.error).toBeTruthy();
  });

  it('applies sabotage as a real state change', () => {
    let state = toNight(findSeedForPlayerRole('shadow').state);
    const before = state.lantern;
    const target = living(state).find(
      (entry) => entry.role !== 'shadow' && entry.id !== state.nightState!.wardTarget,
    )!;
    state = detail(
      applyAction(state, { type: 'NIGHT_ACTION', veilTarget: target.id, sabotage: 'valve-open' }),
    );
    expect(state.rooms.find((room) => room.room === 'archive')!.archiveDrained).toBe(true);
    expect(state.lantern).toBe(before - 4);
  });

  it('lets a shadow AI take a target when the player is not Shadowed', () => {
    const state = toNight(findSeedForPlayerRole('oathkeeper').state);
    expect(state.nightState!.proposals.length).toBeGreaterThan(0);
    const target = state.nightState!.veilTarget;
    expect(target).toBeTruthy();
    expect(state.contestants.find((entry) => entry.id === target)!.role).not.toBe('shadow');
  });

  it('coordinates the Shadowed privately without telling anyone else', () => {
    const state = toNight(findSeedForPlayerRole('oathkeeper').state);
    const night = state.nightState!;
    expect(night.veilTarget).toBeTruthy();
    const shadowAi = state.contestants.find((entry) => entry.role === 'shadow' && !entry.isPlayer)!;
    const faithfulAi = state.contestants.find(
      (entry) => entry.role !== 'shadow' && !entry.isPlayer,
    )!;
    expect(state.knowledge[shadowAi.id].channel.length).toBeGreaterThan(0);
    expect(state.knowledge[faithfulAi.id].channel).toHaveLength(0);
    expect(night.proposals.length).toBeGreaterThan(0);
    const proposal = night.proposals[0];
    expect(state.contestants.find((entry) => entry.id === proposal.targetId)!.role).not.toBe('shadow');
  });

  it('excludes the dead from the ballot and from night choices', () => {
    const state = createMatch(makeOptions({ seed: 44 }));
    const dead = state.contestants.find((entry) => !entry.isPlayer)!;
    dead.alive = false;
    const votes = aiVotesForCouncil(state, rngFor(state));
    expect(votes[dead.id]).toBeUndefined();
    for (const targetId of Object.values(votes)) {
      expect(state.contestants.find((entry) => entry.id === targetId)!.alive).toBe(true);
    }
    const voter = state.contestants.filter((entry) => !entry.isPlayer && entry.alive)[0];
    const rng = rngFor(state);
    expect(chooseVote(state, voter, rng)).not.toBe(dead.id);
  });

  it('resolves a night when the player is dead', () => {
    const state = toNight(findSeedForPlayerRole('oathkeeper').state);
    const me = state.contestants.find((entry) => entry.isPlayer)!;
    me.alive = false;
    const result = performNightAction(state, {});
    expect(result.error).toBeNull();
    expect(result.state.phase).toBe('judgment');
  });
});
