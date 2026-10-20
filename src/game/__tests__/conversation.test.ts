import { describe, expect, it } from 'vitest';
import { applyAction } from '../engine';
import { createMatch } from '../match';
import { proposePact } from '../pacts';
import { converse } from '../conversation';
import { knowledgeOf } from '../state';
import { detail, forcePreferences, makeOptions, toDay } from './helpers';

function firstAi(state: ReturnType<typeof createMatch>) {
  return state.contestants.find((entry) => !entry.isPlayer && entry.alive)!;
}

describe('conversation consequences', () => {
  it('records a private claim and shifts affinity', () => {
    let state = toDay(createMatch(makeOptions({ seed: 51 })));
    const target = firstAi(state);
    const before = knowledgeOf(state, target.id).relationships[state.playerId].affinity;
    state = detail(
      converse(state, { targetId: target.id, intent: 'opinion', subjectId: firstAi(state).id }),
    );
    expect(knowledgeOf(state, target.id).relationships[state.playerId].affinity).toBeGreaterThan(before);
    expect(state.claims.some((claim) => claim.witnessedBy.includes(state.playerId))).toBe(true);
    expect(state.journal.some((entry) => entry.kind === 'claim')).toBe(true);
    expect(state.lastMessage.length).toBeGreaterThan(0);
  });

  it('catches a lie about the person you are lying to', () => {
    let state = toDay(createMatch(makeOptions({ seed: 52 })));
    const target = firstAi(state);
    const trustBefore = knowledgeOf(state, target.id).relationships[state.playerId].trust;
    const suspicionBefore = knowledgeOf(state, target.id).suspicion[state.playerId] ?? 0.2;
    state = detail(
      converse(state, {
        targetId: target.id,
        intent: 'deceive',
        subjectId: target.id,
        text: 'You were in the archive when the seal was cut.',
      }),
    );
    expect(knowledgeOf(state, target.id).relationships[state.playerId].trust).toBeLessThan(trustBefore);
    expect(knowledgeOf(state, target.id).suspicion[state.playerId] ?? 0.2).toBeGreaterThan(
      suspicionBefore,
    );
    expect(state.lastMessage).toContain('You were not there');
    const lie = state.claims.find((claim) => claim.truth === 'false');
    expect(lie).toBeTruthy();
  });

  it('shares evidence only if the player holds it, and moves the listener', () => {
    let state = toDay(createMatch(makeOptions({ seed: 53 })));
    const target = firstAi(state);
    const clue = state.clues.find((entry) => entry.truth === 'true')!;
    expect(converse(state, { targetId: target.id, intent: 'shareEvidence', clueId: clue.id }).error).toBeTruthy();
    clue.discoveredBy.push(state.playerId);
    const suspicionBefore = knowledgeOf(state, target.id).suspicion[clue.pointsTo!];
    const trustBefore = knowledgeOf(state, target.id).relationships[state.playerId].trust;
    state = detail(converse(state, { targetId: target.id, intent: 'shareEvidence', clueId: clue.id }));
    expect(knowledgeOf(state, target.id).evidenceSeen).toContain(clue.id);
    expect(knowledgeOf(state, target.id).suspicion[clue.pointsTo!]).toBeGreaterThan(suspicionBefore);
    expect(knowledgeOf(state, target.id).relationships[state.playerId].trust).toBeGreaterThan(trustBefore);
  });

  it('catches two different whereabouts accounts about the same person in one night', () => {
    let state = toDay(createMatch(makeOptions({ seed: 58 })));
    const listener = firstAi(state);
    const subject = state.contestants.find(
      (entry) => entry.alive && !entry.isPlayer && entry.id !== listener.id,
    )!;
    state = detail(
      converse(state, {
        targetId: listener.id,
        intent: 'deceive',
        subjectId: subject.id,
        text: `${subject.name} was in the gallery when the lamps went out.`,
      }),
    );
    const trustAfterFirst = knowledgeOf(state, listener.id).relationships[state.playerId].trust;
    state = detail(
      converse(state, {
        targetId: listener.id,
        intent: 'deceive',
        subjectId: subject.id,
        text: `${subject.name} was in the archive when the lamps went out.`,
      }),
    );
    const knowledge = knowledgeOf(state, listener.id);
    expect(knowledge.relationships[state.playerId].trust).toBeLessThan(trustAfterFirst - 8);
    expect(knowledge.memories.some((entry) => entry.kind === 'contradiction')).toBe(true);
    expect(knowledge.claims.filter((claim) => claim.aboutId === subject.id).length).toBeGreaterThanOrEqual(2);
  });

  it('raises fear with a threat and lowers it with comfort', () => {
    let state = toDay(createMatch(makeOptions({ seed: 54 })));
    const target = firstAi(state);
    state = detail(converse(state, { targetId: target.id, intent: 'threaten' }));
    expect(knowledgeOf(state, target.id).relationships[state.playerId].fear).toBeGreaterThan(0);
    const fear = knowledgeOf(state, target.id).relationships[state.playerId].fear;
    state = detail(converse(state, { targetId: target.id, intent: 'console' }));
    expect(knowledgeOf(state, target.id).relationships[state.playerId].fear).toBeLessThan(fear);
  });
});

describe('pacts', () => {
  it('accepts a promise from a trusted contestant and refuses from a distrusted one', () => {
    const state = toDay(createMatch(makeOptions({ seed: 55 })));
    const target = firstAi(state);
    knowledgeOf(state, target.id).relationships[state.playerId].trust = 50;
    knowledgeOf(state, target.id).suspicion[state.playerId] = 0.05;
    const accepted = proposePact(state, target.id, 'voteWithMe');
    expect(accepted.error).toBeNull();
    expect(accepted.state.pacts[0].status).toBe('active');
    expect(accepted.state.journal.some((entry) => entry.kind === 'pact')).toBe(true);

    const cold = toDay(createMatch(makeOptions({ seed: 55 })));
    const stranger = firstAi(cold);
    knowledgeOf(cold, stranger.id).relationships[cold.playerId].trust = -50;
    knowledgeOf(cold, stranger.id).suspicion[cold.playerId] = 0.5;
    const refused = proposePact(cold, stranger.id, 'voteWithMe');
    expect(refused.error).toBeNull();
    expect(refused.state.pacts[0].status).toBe('refused');
  });

  it('keeps a pact when the votes match and breaks it when they do not', () => {
    let state = toDay(createMatch(makeOptions({ seed: 56 })));
    const target = firstAi(state);
    knowledgeOf(state, target.id).relationships[state.playerId].trust = 50;
    knowledgeOf(state, target.id).suspicion[state.playerId] = 0.05;
    state = detail(proposePact(state, target.id, 'voteWithMe'));
    state = detail(applyAction(state, { type: 'ADVANCE' }));
    state = detail(applyAction(state, { type: 'ADVANCE' }));
    state = detail(applyAction(state, { type: 'SPEECH', intent: 'silent' }));
    const victim = state.contestants.find(
      (entry) => entry.alive && !entry.isPlayer && entry.id !== target.id,
    )!;
    const prefs: Record<string, string> = {};
    for (const entry of state.contestants) {
      if (!entry.isPlayer && entry.alive) prefs[entry.id] = victim.id;
    }
    forcePreferences(state, prefs);
    const kept = detail(applyAction(state, { type: 'VOTE', targetId: victim.id }));
    expect(kept.pacts[0].status).toBe('kept');
  });

  it('marks the follower who votes elsewhere as the breaker', () => {
    let state = toDay(createMatch(makeOptions({ seed: 57 })));
    const target = firstAi(state);
    knowledgeOf(state, target.id).relationships[state.playerId].trust = 50;
    knowledgeOf(state, target.id).suspicion[state.playerId] = 0.05;
    state = detail(proposePact(state, target.id, 'voteWithMe'));
    state = detail(applyAction(state, { type: 'ADVANCE' }));
    state = detail(applyAction(state, { type: 'ADVANCE' }));
    state = detail(applyAction(state, { type: 'SPEECH', intent: 'silent' }));
    const victim = state.contestants.find(
      (entry) => entry.alive && !entry.isPlayer && entry.id !== target.id,
    )!;
    const other = state.contestants.find(
      (entry) => entry.alive && !entry.isPlayer && entry.id !== target.id && entry.id !== victim.id,
    )!;
    const prefs: Record<string, string> = {};
    for (const entry of state.contestants) {
      if (!entry.isPlayer && entry.alive) prefs[entry.id] = victim.id;
    }
    forcePreferences(state, prefs);
    const broken = detail(applyAction(state, { type: 'VOTE', targetId: other.id }));
    const pact = broken.pacts[0];
    expect(pact.status).toBe('broken');
    expect(pact.brokenBy).toBe(target.id);
    expect(broken.journal.some((entry) => entry.title === 'A pact broken')).toBe(true);
  });
});
