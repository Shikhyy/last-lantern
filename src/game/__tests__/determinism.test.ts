import { describe, expect, it } from 'vitest';
import { createMatch } from '../match';
import { autoPlay } from '../simulate';
import { applyAction } from '../engine';
import { loadMatch, saveMatch, serializeSave } from '../save';
import { makeOptions, toDay } from './helpers';

describe('determinism', () => {
  it('produces the identical match from the same seed and the same player', () => {
    for (const seed of [1, 2, 7, 99, 2026]) {
      const first = autoPlay(createMatch(makeOptions({ seed })));
      const second = autoPlay(createMatch(makeOptions({ seed })));
      expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    }
  });

  it('seats a different cast for different seeds', () => {
    const roles = new Set<string>();
    for (let seed = 1; seed <= 20; seed += 1) {
      const state = createMatch(makeOptions({ seed }));
      roles.add(
        state.contestants
          .map((entry) => `${entry.id}:${entry.role}`)
          .sort()
          .join(','),
      );
    }
    expect(roles.size).toBeGreaterThan(15);
  });

  it('always reaches an ending through the headless player', () => {
    for (let seed = 1; seed <= 10; seed += 1) {
      const state = autoPlay(createMatch(makeOptions({ seed })));
      expect(state.phase).toBe('ending');
      expect(state.ending).not.toBeNull();
      expect(state.ending!.epilogue.length).toBeGreaterThan(80);
    }
  });

  it('round-trips a live match through the save format', () => {
    const state = autoPlay(createMatch(makeOptions({ seed: 5 })), 40);
    const envelope = saveMatch(state, 123);
    const loaded = loadMatch(serializeSave(envelope));
    expect(loaded.status).toBe('ok');
    expect(loaded.state).not.toBeNull();
    expect(JSON.stringify(loaded.state)).toBe(JSON.stringify(state));
  });

  it('restores a match and continues it byte-for-byte', () => {
    let state = toDay(createMatch(makeOptions({ seed: 8 })));
    state = applyAction(state, { type: 'EXPLORE', room: 'gallery' }).state;
    const restored = loadMatch(serializeSave(saveMatch(state, 1))).state!;
    const nextA = applyAction(state, { type: 'ADVANCE' });
    const nextB = applyAction(restored, { type: 'ADVANCE' });
    expect(JSON.stringify(nextA.state)).toBe(JSON.stringify(nextB.state));
  });
});
