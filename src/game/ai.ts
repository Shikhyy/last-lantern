import { clamp, Rng } from './rng';
import {
  aiLiving,
  applyRelationship,
  applySuspicion,
  emit,
  getContestant,
  living,
  livingIds,
  player,
  pushMemory,
} from './state';
import type { AiKnowledge, Contestant, MatchState, SpeechIntent } from './types';
import { VEIL_NIGHTS, factionOf } from './types';

export function rngFor(state: MatchState): Rng {
  const rng = new Rng(0);
  rng.restore(state.rngState);
  return rng;
}

export function commitRng(state: MatchState, rng: Rng): void {
  state.rngState = rng.state;
}

export function sigma(state: MatchState, contestant: Contestant): number {
  const difficulty = state.difficulty === 'easy' ? 0 : state.difficulty === 'hard' ? 1 : 0.5;
  return 0.06 + 0.29 * (1 - difficulty) * (1 - contestant.personality.composure / 200);
}

export function credibilityOf(knowledge: AiKnowledge, speakerId: string): number {
  const trust = knowledge.relationships[speakerId]?.trust ?? 0;
  const accuracy = knowledge.credibility[speakerId] ?? 0;
  return clamp(0.38 + trust / 240 + accuracy, 0.08, 1);
}

export function inferenceNoise(state: MatchState, contestant: Contestant, rng: Rng): number {
  return rng.gauss(0, sigma(state, contestant) * 0.35);
}

export function publicPressure(state: MatchState, targetId: string): number {
  let pressure = 0;
  for (const entry of state.journal) {
    if (entry.phase === 'council' && entry.kind === 'vote' && entry.text.includes(targetId)) pressure += 1;
  }
  if (state.council) {
    for (const speech of state.council.speeches) {
      if (speech.intent === 'accuse' && speech.targetId === targetId) pressure += 2;
    }
  }
  return pressure;
}

function scoreTarget(state: MatchState, voter: Contestant, target: Contestant): number {
  const knowledge = state.knowledge[voter.id];
  if (!knowledge) return -99;
  const suspicion = knowledge.suspicion[target.id] ?? 0.2;
  const relationship = knowledge.relationships[target.id];
  const trust = relationship?.trust ?? 0;

  if (voter.role === 'shadow') {
    if (target.role === 'shadow') {
      // Only throw an ally to the table when the endgame demands cover.
      const cover = state.contestants.filter((entry) => entry.alive).length <= 5 && voter.personality.guile > 70;
      return cover ? 0.5 + suspicion * 0.5 : -3;
    }
    return (
      0.75 +
      suspicion * 0.55 +
      (target.personality.nerve + target.personality.candor) / 420 +
      (target.isPlayer ? 0.06 : 0)
    );
  }

  return suspicion * 1.55 - trust / 230 - (relationship?.affinity ?? 0) / 400;
}

/** Chooses a vote for one living AI. Never reads the player's locked vote. */
export function chooseVote(state: MatchState, voter: Contestant, rng: Rng, eligible?: string[]): string {
  const pool = eligible ?? livingIds(state);
  const candidates = pool
    .filter((id) => id !== voter.id)
    .map((id) => getContestant(state, id))
    .filter((entry) => entry.alive);
  if (candidates.length === 0) return voter.id;

  let best = candidates[0];
  let bestScore = -Infinity;
  for (const candidate of candidates) {
    const noise = rng.gauss(0, sigma(state, voter));
    const score = scoreTarget(state, voter, candidate) + noise;
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best.id;
}

export function aiVotesForCouncil(state: MatchState, rng: Rng, eligible?: string[]): Record<string, string> {
  const votes: Record<string, string> = {};
  for (const voter of aiLiving(state)) {
    // Dead contestants never vote: aiLiving already filters, and the loop
    // reads only the live set, so a dead ally cannot be resurrected here.
    votes[voter.id] = chooseVote(state, voter, rng, eligible);
  }
  return votes;
}

export function chooseSpeech(state: MatchState, speaker: Contestant, rng: Rng): {
  intent: SpeechIntent;
  targetId: string | null;
  clueId: string | null;
  text: string;
} {
  const knowledge = state.knowledge[speaker.id];
  const others = living(state).filter((entry) => entry.id !== speaker.id);
  if (!knowledge || others.length === 0) {
    return { intent: 'silent', targetId: null, clueId: null, text: `${speaker.name} yields the floor.` };
  }
  const sorted = [...others].sort(
    (a, b) => (knowledge.suspicion[b.id] ?? 0.2) - (knowledge.suspicion[a.id] ?? 0.2),
  );
  const suspect = sorted[0];
  const ally =
    speaker.role === 'shadow' ? others.find((entry) => entry.role === 'shadow') ?? null : null;
  const accused = ally ?? suspect;

  const evidence = state.clues.find(
    (clue) => knowledge.evidenceSeen.includes(clue.id) && !clue.discoveredBy.includes(speaker.id),
  );
  const heat = knowledge.suspicion[accused.id] ?? 0.2;

  if (evidence && heat > 0.35) {
    return {
      intent: 'present',
      targetId: accused.id,
      clueId: evidence.id,
      text: `${speaker.name} sets a hand on the table and names the clue: ${evidence.title}.`,
    };
  }
  if (heat > 0.5) {
    return {
      intent: 'accuse',
      targetId: accused.id,
      clueId: null,
      text: `${speaker.name} says, without raising their voice, that ${accused.name} has been lying about the night.`,
    };
  }
  const trusted = [...others].sort((a, b) => {
    const ta = knowledge.relationships[a.id]?.trust ?? 0;
    const tb = knowledge.relationships[b.id]?.trust ?? 0;
    return tb - ta;
  })[0];
  if ((knowledge.relationships[trusted.id]?.trust ?? 0) > 18) {
    return {
      intent: 'defend',
      targetId: trusted.id,
      clueId: null,
      text: `${speaker.name} speaks for ${trusted.name}: “I have watched them. I do not think this is their hand.”`,
    };
  }
  if (rng.chance(0.5)) {
    return {
      intent: 'question',
      targetId: suspect.id,
      clueId: null,
      text: `${speaker.name} asks ${suspect.name} to account for the second bell, plainly and once.`,
    };
  }
  return { intent: 'silent', targetId: null, clueId: null, text: `${speaker.name} says nothing and lets the silence do the work.` };
}

/** Shadow proposal round: one Veil target per living Shadowed, highest total wins. */
export function shadowVeilProposal(
  state: MatchState,
  rng: Rng,
): { targetId: string | null; proposals: { speakerId: string; targetId: string }[] } {
  const shadows = aiLiving(state).filter((entry) => entry.role === 'shadow');
  const allShadows = state.contestants.filter((entry) => entry.role === 'shadow').map((entry) => entry.id);
  const targets = living(state).filter((entry) => !allShadows.includes(entry.id));
  if (targets.length === 0) return { targetId: null, proposals: [] };
  const proposals: { speakerId: string; targetId: string }[] = [];
  const score: Record<string, number> = {};
  for (const shadow of shadows) {
    const knowledge = state.knowledge[shadow.id];
    if (!knowledge) continue;
    let best = targets[0];
    let bestScore = -Infinity;
    for (const target of targets) {
      const trust = knowledge.relationships[target.id]?.trust ?? 0;
      const value =
        trust / 90 +
        target.personality.nerve / 220 +
        target.personality.candor / 260 +
        (target.isPlayer ? 0.12 : 0) +
        rng.gauss(0, sigma(state, shadow) * 0.5);
      if (value > bestScore) {
        bestScore = value;
        best = target;
      }
    }
    proposals.push({ speakerId: shadow.id, targetId: best.id });
    score[best.id] = (score[best.id] ?? 0) + 1;
  }
  const ranked = Object.entries(score).sort((a, b) => b[1] - a[1]);
  const winner = ranked.length > 0 ? ranked[0][0] : targets[0].id;
  return { targetId: winner, proposals };
}

export function chooseReadTarget(state: MatchState, keeper: Contestant, rng: Rng): string {
  const knowledge = state.knowledge[keeper.id];
  const candidates = living(state).filter((entry) => entry.id !== keeper.id);
  if (!knowledge || candidates.length === 0) return '';
  void rng;
  return [...candidates].sort(
    (a, b) => (knowledge.suspicion[b.id] ?? 0.2) - (knowledge.suspicion[a.id] ?? 0.2),
  )[0].id;
}

export function chooseWardTarget(state: MatchState, warden: Contestant): string {
  const knowledge = state.knowledge[warden.id];
  const candidates = living(state).filter(
    (entry) => entry.id !== warden.id && entry.id !== warden.lastWardTarget,
  );
  if (!knowledge || candidates.length === 0) return '';
  return [...candidates].sort((a, b) => {
    const ta = knowledge.relationships[a.id]?.trust ?? 0;
    const tb = knowledge.relationships[b.id]?.trust ?? 0;
    return tb - ta;
  })[0].id;
}

export function shouldSpendShield(state: MatchState, contestant: Contestant): boolean {
  if (contestant.shields <= 0) return false;
  if (contestant.isPlayer) return false;
  const pressure = publicPressure(state, contestant.id);
  return pressure >= 2 || (state.round >= 4 && contestant.shields > 1);
}

export function recordPublicClaim(
  state: MatchState,
  speakerId: string,
  aboutId: string | null,
  topic: 'whereabouts' | 'role' | 'deed' | 'testimony',
  text: string,
  truth: 'true' | 'false' | 'planted',
  witnessedBy: string[],
  credibilityFallback = 0.55,
): string {
  const id = `k${state.nextId}`;
  state.nextId += 1;
  const event = emit(state, {
    kind: 'note',
    text,
    actorId: speakerId,
    subjectId: aboutId,
    witnessedBy,
  });
  state.claims.push({
    id,
    speakerId,
    aboutId,
    topic,
    text,
    truth,
    night: state.round,
    phase: state.phase,
    clueId: null,
    witnessedBy,
  });
  for (const observerId of witnessedBy) {
    const knowledge = state.knowledge[observerId];
    if (!knowledge || observerId === speakerId) continue;
    const contradiction =
      topic === 'whereabouts' && aboutId
        ? knowledge.claims.some(
            (claim) =>
              claim.speakerId === speakerId &&
              claim.aboutId === aboutId &&
              claim.topic === 'whereabouts' &&
              claim.night === state.round &&
              claim.text !== text,
          )
        : false;
    knowledge.claims.push({
      id,
      speakerId,
      aboutId,
      topic,
      text,
      night: state.round,
      credibility: credibilityOf(knowledge, speakerId) * credibilityFallback,
    });
    if (aboutId) {
      const weight = topic === 'role' ? 0.2 : 0.09;
      applySuspicion(state, observerId, aboutId, weight * credibilityOf(knowledge, speakerId), event.id);
    }
    if (contradiction && aboutId) {
      // The observer only uses two accounts it actually heard, in the same
      // night. This is the whole of the contradiction mechanic.
      applyRelationship(state, observerId, speakerId, 'trust', -14, event.id);
      applySuspicion(state, observerId, speakerId, 0.12, event.id);
      knowledge.credibility[speakerId] = clamp(
        (knowledge.credibility[speakerId] ?? 0) - 0.12,
        -0.5,
        0.5,
      );
      pushMemory(state, observerId, {
        kind: 'contradiction',
        text: `${getContestant(state, speakerId).name} gave two different accounts of ${getContestant(
          state,
          aboutId,
        ).name}'s whereabouts.`,
        importance: 0.8,
        subjectId: speakerId,
        highEmotion: true,
      });
    }
  }
  return id;
}

export function applyEvidenceToObserver(
  state: MatchState,
  observerId: string,
  clueId: string,
  eventId: string,
): void {
  const knowledge = state.knowledge[observerId];
  const clue = state.clues.find((entry) => entry.id === clueId);
  if (!knowledge || !clue) return;
  if (knowledge.evidenceSeen.includes(clueId)) return;
  knowledge.evidenceSeen.push(clueId);
  if (clue.pointsTo) applySuspicion(state, observerId, clue.pointsTo, clue.weight, eventId);
  if (clue.pointsAwayFrom) applySuspicion(state, observerId, clue.pointsAwayFrom, -clue.weight * 0.65, eventId);
  pushMemory(state, observerId, {
    kind: 'clue',
    text: `Found: ${clue.title}.`,
    importance: 0.7,
    subjectId: clue.pointsTo,
  });
}

/** The Warden's ward makes a Veil fail; the rite is still spent. */
export function veilNight(round: number): boolean {
  return (VEIL_NIGHTS as readonly number[]).includes(round);
}

export function publicRoleName(role: 'shadow' | 'keeper' | 'warden' | 'oathkeeper'): string {
  return role === 'shadow' ? 'Shadowed' : role === 'keeper' ? 'Lantern Keeper' : role === 'warden' ? 'Warden' : 'Oathkeeper';
}

export function factionOfRole(role: 'shadow' | 'keeper' | 'warden' | 'oathkeeper') {
  return factionOf(role);
}

export function playerIs(state: MatchState, role: 'shadow' | 'keeper' | 'warden' | 'oathkeeper'): boolean {
  return player(state).role === role && player(state).alive;
}
