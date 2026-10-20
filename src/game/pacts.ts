import { OATH_BY_ID } from './cast';
import { addJournal, applyRelationship, emit, getContestant, note, player } from './state';
import type { ActionResult, MatchState, PactTerm } from './types';

const TERM_LABEL: Record<PactTerm, string> = {
  voteWithMe: 'Vote with me at this council.',
  shareInfo: 'Share what you learn about the palace with me.',
  protect: 'Protect me tonight, if you can.',
  keepSecret: 'Keep what I tell you until the finale.',
  silence: 'Do not speak my name at council.',
};

export function pactLabel(term: PactTerm): string {
  return TERM_LABEL[term];
}

export function proposePact(state: MatchState, targetId: string, term: PactTerm): ActionResult {
  const me = player(state);
  if (!me.alive) return { state, events: [], error: 'The dead make no promises.' };
  if (state.phase !== 'day' && state.phase !== 'dusk') {
    return { state, events: [], error: 'Pacts are made in daylight or at dusk.' };
  }
  const target = state.contestants.find((entry) => entry.id === targetId && entry.alive && !entry.isPlayer);
  if (!target) return { state, events: [], error: 'Choose a living contestant.' };
  const knowledge = state.knowledge[target.id];
  if (!knowledge) return { state, events: [], error: 'They cannot hear you.' };

  const trust = knowledge.relationships[me.id]?.trust ?? 0;
  const suspicion = knowledge.suspicion[me.id] ?? 0.2;
  const oathBonus = me.oath === 'keep_promise' ? OATH_BY_ID.keep_promise.bonus : 0;
  const termCost = term === 'protect' ? 8 : term === 'keepSecret' ? 4 : term === 'silence' ? 2 : 0;
  const score = trust + oathBonus / 2 - suspicion * 35 - termCost;
  const shadowAlliance = target.role === 'shadow' && me.role === 'shadow';
  const accepted = shadowAlliance || score > 4;

  const id = `p${state.nextId}`;
  state.nextId += 1;
  const pact = {
    id,
    a: me.id,
    b: target.id,
    term,
    round: state.round,
    expiresRound: state.round + 2,
    status: (accepted ? 'active' : 'refused') as 'active' | 'refused',
    brokenBy: null,
    revealed: false,
  };
  state.pacts.push(pact);

  const event = emit(state, {
    kind: 'pact',
    text: accepted
      ? `${target.name} accepts a private pact: “${TERM_LABEL[term]}”`
      : `${target.name} refuses a private pact.`,
    witnessedBy: [me.id, target.id],
    actorId: me.id,
    subjectId: target.id,
  });

  if (accepted) {
    applyRelationship(state, target.id, me.id, 'trust', 8, event.id);
    applyRelationship(state, me.id, target.id, 'debt', 6, event.id);
    addJournal(state, { kind: 'pact', title: `Pact with ${target.name}`, text: TERM_LABEL[term] });
    note(state, `${target.name} accepts: “${TERM_LABEL[term]}”`);
  } else {
    applyRelationship(state, target.id, me.id, 'trust', -3, event.id);
    applyRelationship(state, target.id, me.id, 'affinity', -2, event.id);
    addJournal(state, { kind: 'pact', title: `${target.name} refused`, text: TERM_LABEL[term] });
    note(state, `${target.name} refuses the pact.`);
  }

  return { state, events: [event], error: null };
}

export function activePactBetween(state: MatchState, a: string, b: string): boolean {
  return state.pacts.some(
    (pact) =>
      pact.status === 'active' &&
      ((pact.a === a && pact.b === b) || (pact.a === b && pact.b === a)),
  );
}

export function pactPartnerOf(state: MatchState, id: string): string | null {
  const pact = state.pacts.find((entry) => entry.status === 'active' && (entry.a === id || entry.b === id));
  if (!pact) return null;
  return pact.a === id ? pact.b : pact.a;
}

export function pactSummary(state: MatchState): { kept: number; broken: number } {
  return {
    kept: state.pacts.filter((pact) => pact.status === 'kept').length,
    broken: state.pacts.filter((pact) => pact.status === 'broken').length,
  };
}

export function revealPact(state: MatchState, pactId: string): void {
  const pact = state.pacts.find((entry) => entry.id === pactId);
  if (pact) pact.revealed = true;
}

export function describePact(state: MatchState, pactId: string): string {
  const pact = state.pacts.find((entry) => entry.id === pactId);
  if (!pact) return '';
  return `${getContestant(state, pact.a).name} and ${getContestant(state, pact.b).name}: ${TERM_LABEL[pact.term]}`;
}
