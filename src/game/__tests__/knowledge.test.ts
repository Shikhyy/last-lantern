import { describe, expect, it } from 'vitest';
import { applyEvidenceToObserver, credibilityOf, recordPublicClaim } from '../ai';
import { createMatch } from '../match';
import {
  applyRelationship,
  applySuspicion,
  decayMemories,
  getContestant,
  knowledgeOf,
  pushMemory,
} from '../state';
import { makeOptions } from './helpers';

describe('AI belief updates', () => {
  it('moves suspicion only for the witnesses of a claim', () => {
    const state = createMatch(makeOptions({ seed: 21 }));
    const [a, b, c] = state.contestants.filter((entry) => !entry.isPlayer);
    const target = state.contestants.find((entry) => entry.id !== a.id && entry.id !== b.id && entry.id !== c.id)!;
    const beforeB = knowledgeOf(state, b.id).suspicion[target.id];
    const beforeC = knowledgeOf(state, c.id).suspicion[target.id];
    recordPublicClaim(state, a.id, target.id, 'deed', 'A says they were seen in the archive.', 'true', [
      a.id,
      b.id,
    ]);
    expect(knowledgeOf(state, b.id).suspicion[target.id]).toBeGreaterThan(beforeB);
    expect(knowledgeOf(state, c.id).suspicion[target.id]).toBe(beforeC);
  });

  it('stores a claim without any engine-truth field in AI memory', () => {
    const state = createMatch(makeOptions({ seed: 21 }));
    const [a, b] = state.contestants.filter((entry) => !entry.isPlayer);
    recordPublicClaim(state, a.id, b.id, 'role', 'A says B is Shadowed.', 'false', [a.id, b.id]);
    for (const contestant of state.contestants) {
      const knowledge = state.knowledge[contestant.id];
      if (!knowledge) continue;
      for (const claim of knowledge.claims) {
        expect(Object.keys(claim)).not.toContain('truth');
        expect(Object.keys(claim)).not.toContain('pointsTo');
      }
    }
  });

  it('discounts an unreliable speaker through trust and accuracy', () => {
    const state = createMatch(makeOptions({ seed: 21 }));
    const [speaker, listener] = state.contestants.filter((entry) => !entry.isPlayer);
    const knowledge = knowledgeOf(state, listener.id);
    const baseline = credibilityOf(knowledge, speaker.id);
    applyRelationship(state, listener.id, speaker.id, 'trust', 60, 'g0');
    expect(credibilityOf(knowledge, speaker.id)).toBeGreaterThan(baseline);
    knowledge.credibility[speaker.id] = -0.3;
    expect(credibilityOf(knowledge, speaker.id)).toBeLessThan(baseline);
  });

  it('clamps relationships and suspicion to their authored bounds', () => {
    const state = createMatch(makeOptions({ seed: 21 }));
    const [a, b] = state.contestants.filter((entry) => !entry.isPlayer);
    applyRelationship(state, a.id, b.id, 'trust', 500, 'g0');
    expect(knowledgeOf(state, a.id).relationships[b.id].trust).toBe(100);
    applyRelationship(state, a.id, b.id, 'trust', -500, 'g0');
    expect(knowledgeOf(state, a.id).relationships[b.id].trust).toBe(-100);
    applySuspicion(state, a.id, b.id, 5, 'g0');
    expect(knowledgeOf(state, a.id).suspicion[b.id]).toBe(1);
    applySuspicion(state, a.id, b.id, -5, 'g0');
    expect(knowledgeOf(state, a.id).suspicion[b.id]).toBe(0);
  });

  it('moves suspicion with evidence toward the suspect and away from the cleared', () => {
    const state = createMatch(makeOptions({ seed: 21 }));
    const observer = state.contestants.find((entry) => !entry.isPlayer)!;
    const clue = state.clues.find((entry) => entry.truth === 'true')!;
    const beforeTo = knowledgeOf(state, observer.id).suspicion[clue.pointsTo!];
    const beforeAway = knowledgeOf(state, observer.id).suspicion[clue.pointsAwayFrom!];
    applyEvidenceToObserver(state, observer.id, clue.id, 'g0');
    expect(knowledgeOf(state, observer.id).suspicion[clue.pointsTo!]).toBeGreaterThan(beforeTo);
    expect(knowledgeOf(state, observer.id).suspicion[clue.pointsAwayFrom!]).toBeLessThan(beforeAway);
    expect(knowledgeOf(state, observer.id).evidenceSeen).toContain(clue.id);
    const second = knowledgeOf(state, observer.id).suspicion[clue.pointsTo!];
    applyEvidenceToObserver(state, observer.id, clue.id, 'g0');
    expect(knowledgeOf(state, observer.id).suspicion[clue.pointsTo!]).toBe(second);
  });

  it('decays memory by profile but keeps a floor for high-emotion events', () => {
    const state = createMatch(makeOptions({ seed: 21 }));
    const observer = state.contestants.find((entry) => !entry.isPlayer)!;
    pushMemory(state, observer.id, {
      kind: 'betrayal',
      text: 'They broke a promise at the table.',
      importance: 0.95,
      highEmotion: true,
    });
    pushMemory(state, observer.id, {
      kind: 'observation',
      text: 'The light was low.',
      importance: 0.3,
    });
    decayMemories(state, observer.id, 6);
    const memories = knowledgeOf(state, observer.id).memories;
    const betrayal = memories.find((entry) => entry.kind === 'betrayal')!;
    const trivial = memories.find((entry) => entry.text === 'The light was low.')!;
    expect(betrayal.weight).toBeGreaterThan(0.3);
    expect(trivial.weight).toBeLessThan(0.25);
    expect(trivial.weight).toBeLessThan(betrayal.weight);
  });

  it('never updates a contestant’s belief about themselves', () => {
    const state = createMatch(makeOptions({ seed: 21 }));
    const [a] = state.contestants.filter((entry) => !entry.isPlayer);
    const before = knowledgeOf(state, a.id).suspicion[a.id];
    applySuspicion(state, a.id, a.id, 0.4, 'g0');
    expect(knowledgeOf(state, a.id).suspicion[a.id] ?? before).toBe(before);
  });

  it('keeps memory bounded', () => {
    const state = createMatch(makeOptions({ seed: 21 }));
    const observer = state.contestants.find((entry) => !entry.isPlayer)!;
    for (let i = 0; i < 60; i += 1) {
      pushMemory(state, observer.id, { kind: 'observation', text: `memory ${i}`, importance: 0.5 });
    }
    expect(knowledgeOf(state, observer.id).memories.length).toBeLessThanOrEqual(40);
    expect(getContestant(state, observer.id).alive).toBe(true);
  });
});
