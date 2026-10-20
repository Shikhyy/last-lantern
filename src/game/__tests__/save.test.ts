import { describe, expect, it } from 'vitest';
import { createMatch } from '../match';
import { applyAction, restartMatch } from '../engine';
import { autoPlay } from '../simulate';
import {
  SAVE_VERSION,
  checksum,
  loadMatch,
  recoverState,
  saveMatch,
  serializeSave,
} from '../save';
import { makeOptions } from './helpers';

describe('save, load and recovery', () => {
  it('writes a versioned, checksummed envelope', () => {
    const state = createMatch(makeOptions({ seed: 61 }));
    const envelope = saveMatch(state, 1000);
    expect(envelope.version).toBe(SAVE_VERSION);
    expect(envelope.savedAt).toBe(1000);
    expect(envelope.checksum).toBe(checksum(JSON.stringify(state)));
  });

  it('round-trips the whole match, including hidden knowledge and the RNG cursor', () => {
    const state = autoPlay(createMatch(makeOptions({ seed: 62 })), 90);
    const loaded = loadMatch(serializeSave(saveMatch(state, 1)));
    expect(loaded.status).toBe('ok');
    expect(loaded.state!.rngState).toBe(state.rngState);
    expect(loaded.state!.knowledge).toEqual(state.knowledge);
    expect(loaded.state!.contestants.map((entry) => entry.role)).toEqual(
      state.contestants.map((entry) => entry.role),
    );
  });

  it('rejects a truncated file, invalid JSON, a bad checksum and a newer build', () => {
    const state = createMatch(makeOptions({ seed: 63 }));
    const raw = serializeSave(saveMatch(state, 1));

    expect(loadMatch(raw.slice(0, Math.floor(raw.length / 2))).status).toBe('corrupt');
    expect(loadMatch('not json').status).toBe('corrupt');
    expect(loadMatch(null).status).toBe('corrupt');

    const tampered = JSON.parse(raw);
    tampered.state.lantern = 1;
    expect(loadMatch(JSON.stringify(tampered)).status).toBe('corrupt');

    const future = JSON.parse(raw);
    future.version = SAVE_VERSION + 1;
    expect(loadMatch(JSON.stringify(future)).status).toBe('corrupt');

    const wrongShape = JSON.parse(raw);
    wrongShape.state.contestants = wrongShape.state.contestants.slice(0, 11);
    wrongShape.checksum = checksum(JSON.stringify(wrongShape.state));
    expect(loadMatch(JSON.stringify(wrongShape)).status).toBe('corrupt');
  });

  it('recovers a session interrupted mid-council without inventing a vote', () => {
    const state = autoPlay(createMatch(makeOptions({ seed: 64 })), 30);
    state.phase = 'council';
    state.council = null;
    recoverState(state);
    expect(state.phase).toBe('dusk');
  });

  it('recovers a night or finale missing its scene data by rewinding a beat', () => {
    const night = createMatch(makeOptions({ seed: 65 }));
    night.phase = 'night';
    night.nightState = null;
    recoverState(night);
    expect(night.phase).toBe('judgment');

    const finale = createMatch(makeOptions({ seed: 65 }));
    finale.phase = 'finale';
    finale.finaleState = null;
    recoverState(finale);
    expect(finale.phase).toBe('judgment');
  });

  it('keeps a damaged save rather than silently overwriting it', () => {
    const result = loadMatch('{"version":1,"state":');
    expect(result.status).toBe('corrupt');
    expect(result.raw).toBe('{"version":1,"state":');
    expect(result.reason).toContain('JSON');
  });

  it('restarts with a fresh, hidden table and keeps only the soft anti-repeat ledger', () => {
    const finished = autoPlay(createMatch(makeOptions({ seed: 66 })));
    expect(finished.phase).toBe('ending');
    const restarted = restartMatch(finished, makeOptions({ seed: 67 }));
    expect(restarted.phase).toBe('dawn');
    expect(restarted.round).toBe(1);
    expect(restarted.lantern).toBe(100);
    expect(restarted.ending).toBeNull();
    expect(restarted.outcome).toBeNull();
    expect(restarted.events).toHaveLength(1);
    expect(restarted.events[0].text.length).toBeGreaterThan(0);
    expect(restarted.journal.length).toBeLessThanOrEqual(1);
    expect(restarted.voteHistory).toHaveLength(0);
    for (const contestant of restarted.contestants) {
      expect(contestant.revealedRole).toBeNull();
      expect(contestant.alive).toBe(true);
    }
    expect(Object.keys(restarted.antiRepeat)).toHaveLength(12);
    expect(Object.keys(finished.antiRepeat)).toHaveLength(12);
  });

  it('continues a loaded match through the same actions', () => {
    const state = autoPlay(createMatch(makeOptions({ seed: 68 })), 60);
    const loaded = loadMatch(serializeSave(saveMatch(state, 1))).state!;
    const a = applyAction(state, { type: 'ADVANCE' });
    const b = applyAction(loaded, { type: 'ADVANCE' });
    expect(a.error).toBe(b.error);
    expect(JSON.stringify(a.state)).toBe(JSON.stringify(b.state));
  });
});
