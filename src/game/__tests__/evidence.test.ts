import { describe, expect, it } from 'vitest';
import { applyAction } from '../engine';
import { createMatch } from '../match';
import { clueAvailable } from '../evidence';
import { playerView } from '../views';
import { detail, makeOptions, toDay } from './helpers';

describe('evidence ownership and reliability', () => {
  it('opens the archive with an authored beat and then reveals its clues', () => {
    let state = toDay(createMatch(makeOptions({ seed: 11 })));
    state = detail(applyAction(state, { type: 'EXPLORE', room: 'archive' }));
    expect(state.rooms.find((room) => room.room === 'archive')!.archiveOpen).toBe(true);
    const before = state.clues.filter((clue) => clue.discoveredBy.includes(state.playerId)).length;
    state = detail(applyAction(state, { type: 'EXPLORE', room: 'archive' }));
    const after = state.clues.filter((clue) => clue.discoveredBy.includes(state.playerId)).length;
    expect(after).toBeGreaterThan(before);
  });

  it('records the discoverer and shows only the player’s own evidence', () => {
    let state = toDay(createMatch(makeOptions({ seed: 11 })));
    state = detail(applyAction(state, { type: 'EXPLORE', room: 'archive' }));
    state = detail(applyAction(state, { type: 'EXPLORE', room: 'archive' }));
    const view = playerView(state);
    expect(view.clues.length).toBeGreaterThan(0);
    for (const clue of view.clues) {
      expect(Object.keys(clue)).not.toContain('truth');
      expect(Object.keys(clue)).not.toContain('pointsTo');
      expect(Object.keys(clue)).not.toContain('pointsAwayFrom');
      expect(clue.title.length).toBeGreaterThan(0);
    }
    expect(state.journal.some((entry) => entry.kind === 'clue')).toBe(true);
  });

  it('refuses to examine evidence the player does not own', () => {
    const state = toDay(createMatch(makeOptions({ seed: 11 })));
    const clue = state.clues[0];
    const before = JSON.stringify(state);
    const result = applyAction(state, { type: 'EXAMINE', clueId: clue.id });
    expect(result.error).toBeTruthy();
    expect(JSON.stringify(result.state)).toBe(before);
  });

  it('exposes a planted clue’s tell only on a second look', () => {
    let state = toDay(createMatch(makeOptions({ seed: 11 })));
    const planted = state.clues.find((clue) => clue.truth === 'planted')!;
    planted.discoveredBy.push(state.playerId);
    expect(planted.tellRevealed).toBe(false);
    state = detail(applyAction(state, { type: 'EXAMINE', clueId: planted.id }));
    const after = state.clues.find((clue) => clue.id === planted.id)!;
    expect(after.tellRevealed).toBe(true);
    expect(state.journal.some((entry) => entry.text.includes('ink'))).toBe(true);
  });

  it('gates archive clues on the seal and on the cistern', () => {
    const state = toDay(createMatch(makeOptions({ seed: 11 })));
    const archive = state.rooms.find((room) => room.room === 'archive')!;
    archive.archiveOpen = false;
    archive.archiveDrained = false;
    const sealed = state.clues.find((clue) => clue.requires === 'archive-open')!;
    const drowned = state.clues.find((clue) => clue.requires === 'archive-drained')!;
    sealed.roundPlaced = 1;
    drowned.roundPlaced = 1;
    expect(clueAvailable(state, sealed)).toBe(false);
    expect(clueAvailable(state, drowned)).toBe(false);
    archive.archiveOpen = true;
    expect(clueAvailable(state, sealed)).toBe(true);
    expect(clueAvailable(state, drowned)).toBe(false);
    archive.archiveDrained = true;
    expect(clueAvailable(state, drowned)).toBe(true);
  });

  it('binds every true clue to a Shadowed suspect and the herring to a faithful', () => {
    const state = createMatch(makeOptions({ seed: 11 }));
    const shadows = new Set(state.contestants.filter((entry) => entry.role === 'shadow').map((entry) => entry.id));
    for (const clue of state.clues) {
      if (clue.truth === 'planted') {
        expect(shadows.has(clue.pointsTo!)).toBe(false);
      } else {
        expect(shadows.has(clue.pointsTo!)).toBe(true);
        expect(shadows.has(clue.pointsAwayFrom!)).toBe(false);
      }
    }
  });
});
