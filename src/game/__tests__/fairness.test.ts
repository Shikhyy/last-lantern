import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createMatch } from '../match';
import { autoPlay } from '../simulate';
import { playerView, publicView } from '../views';
import { factionOf } from '../types';
import { makeOptions } from './helpers';

function gameFiles(dir = 'src/game'): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry !== '__tests__') out.push(...gameFiles(full));
    } else if (entry.endsWith('.ts')) {
      out.push(full);
    }
  }
  return out;
}

describe('role secrecy and information boundaries', () => {
  it('never puts an unrevealed role in the public view', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const state = createMatch(makeOptions({ seed }));
      const view = publicView(state);
      for (const contestant of view.contestants) {
        expect(Object.keys(contestant)).not.toContain('role');
        expect(contestant.revealedRole).toBeNull();
      }
      expect(JSON.stringify(view)).not.toContain('"shadow"');
      expect(JSON.stringify(view)).not.toContain('"keeper"');
      expect(JSON.stringify(view)).not.toContain('"warden"');
    }
  });

  it('gives the player only their own role and, if Shadowed, their allies', () => {
    for (let seed = 1; seed <= 60; seed += 1) {
      const state = createMatch(makeOptions({ seed }));
      const me = state.contestants.find((entry) => entry.isPlayer)!;
      const view = playerView(state);
      expect(view.ownRole).toBe(me.role);
      for (const contestant of view.contestants) {
        expect(Object.keys(contestant)).not.toContain('role');
        expect(contestant.revealedRole).toBeNull();
      }
      if (me.role === 'shadow') {
        const expected = state.contestants
          .filter((entry) => entry.role === 'shadow' && entry.id !== me.id)
          .map((entry) => entry.id);
        expect(new Set(view.shadowAllies)).toEqual(new Set(expected));
      } else {
        expect(view.shadowAllies).toEqual([]);
      }
    }
  });

  it('gives a non-Shadowed AI no shadow allies or channel', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const state = createMatch(makeOptions({ seed }));
      for (const contestant of state.contestants) {
        if (contestant.isPlayer || contestant.role === 'shadow') continue;
        const knowledge = state.knowledge[contestant.id];
        expect(knowledge.shadowAllies).toEqual([]);
        expect(knowledge.channel).toEqual([]);
        expect(Object.keys(knowledge)).not.toContain('journal');
      }
    }
  });

  it('never gives an AI knowledge of a role it has not Read', () => {
    for (let seed = 1; seed <= 30; seed += 1) {
      const state = createMatch(makeOptions({ seed }));
      for (const contestant of state.contestants) {
        if (contestant.isPlayer || contestant.role === 'shadow') continue;
        const knowledge = state.knowledge[contestant.id];
        for (const result of knowledge.readResults) {
          const target = state.contestants.find((entry) => entry.id === result.targetId)!;
          expect(result.faction).toBe(factionOf(target.role));
          expect(result.night).toBeLessThanOrEqual(state.round);
        }
      }
    }
  });

  it('ties every belief change to an event the observer witnessed', () => {
    for (let seed = 1; seed <= 12; seed += 1) {
      const state = autoPlay(createMatch(makeOptions({ seed })));
      const events = new Map(state.events.map((event) => [event.id, event]));
      for (const delta of state.knowledgeLog) {
        const event = events.get(delta.eventId);
        expect(event, `missing event ${delta.eventId}`).toBeTruthy();
        expect(event!.witnessedBy, `observer ${delta.observerId} did not witness ${event!.id}`).toContain(
          delta.observerId,
        );
        expect(event!.round).toBeLessThanOrEqual(delta.night);
      }
    }
  });

  it('keeps the Shadowed channel out of every other contestant’s memory', () => {
    for (let seed = 1; seed <= 12; seed += 1) {
      const state = autoPlay(createMatch(makeOptions({ seed })));
      for (const contestant of state.contestants) {
        if (contestant.isPlayer || contestant.role === 'shadow') continue;
        const knowledge = state.knowledge[contestant.id];
        const json = JSON.stringify(knowledge);
        expect(json).not.toContain('shadowAllies":["');
        expect(knowledge.channel).toHaveLength(0);
      }
    }
  });

  it('contains no Math.random anywhere in the pure game core', () => {
    for (const file of gameFiles()) {
      const source = readFileSync(file, 'utf8');
      expect(source, file).not.toMatch(/Math\.random\s*\(/);
    }
  });
});
