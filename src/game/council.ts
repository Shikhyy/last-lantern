import {
  aiVotesForCouncil,
  applyEvidenceToObserver,
  chooseSpeech,
  commitRng,
  credibilityOf,
  publicPressure,
  rngFor,
  shouldSpendShield,
} from './ai';
import { addJournal, applyRelationship, applySuspicion, changeLantern, emit, factionOutcome, getContestant, living, note, player, tryContestant } from './state';
import type {
  ActionResult,
  CouncilState,
  GameEvent,
  MatchState,
  Speech,
  SpeechIntent,
} from './types';

function emptyCouncil(): CouncilState {
  return {
    step: 'speech',
    round: 1,
    speeches: [],
    floor: [],
    playerSpoken: false,
    aiVotes: {},
    playerVote: null,
    votes: null,
    tally: null,
    shieldsSpent: {},
    playerShieldPending: false,
    eliminatedId: null,
    noElimination: null,
    tiedIds: [],
    resultText: '',
  };
}

export function beginCouncil(state: MatchState): void {
  state.phase = 'council';
  state.council = emptyCouncil();
  emit(state, {
    kind: 'phase',
    text: 'The council opens. The Lantern is dimmed, and every living oath sits at the table.',
  });
}

function speechText(state: MatchState, speakerId: string, intent: SpeechIntent, targetId: string | null, clueId: string | null): string {
  const speaker = getContestant(state, speakerId);
  const target = tryContestant(state, targetId);
  const clue = clueId ? state.clues.find((entry) => entry.id === clueId) : null;
  switch (intent) {
    case 'accuse':
      return target
        ? `${speaker.name} names ${target.name} and says the second bell does not account for them.`
        : `${speaker.name} accuses the room, and the room does not answer.`;
    case 'defend':
      return target
        ? `${speaker.name} speaks for ${target.name}, carefully, and asks the table to weigh what it actually saw.`
        : `${speaker.name} asks for a little more patience.`;
    case 'present':
      return clue
        ? `${speaker.name} lays ${clue.title} on the table and lets it speak.`
        : `${speaker.name} has nothing to show and says so.`;
    case 'question':
      return target
        ? `${speaker.name} asks ${target.name} one plain question and waits for the answer.`
        : `${speaker.name} asks the table a question no one wants.`;
    case 'silent':
    default:
      return `${speaker.name} says nothing. The table fills the silence.`;
  }
}

/** Public speech changes only what listeners could hear. */
export function applySpeech(state: MatchState, speech: Speech, eventId: string): void {
  if (speech.intent === 'silent') return;
  const listeners = living(state).filter((entry) => entry.id !== speech.speakerId);
  for (const listener of listeners) {
    const knowledge = state.knowledge[listener.id];
    if (!knowledge) continue;
    const credibility = credibilityOf(knowledge, speech.speakerId);
    switch (speech.intent) {
      case 'accuse':
        if (speech.targetId) {
          applySuspicion(state, listener.id, speech.targetId, 0.09 * credibility, eventId);
          applyRelationship(state, listener.id, speech.targetId, 'trust', -4 * credibility, eventId);
        }
        applyRelationship(state, listener.id, speech.speakerId, 'trust', -1.5, eventId);
        break;
      case 'defend':
        if (speech.targetId) {
          applySuspicion(state, listener.id, speech.targetId, -0.06 * credibility, eventId);
          applyRelationship(state, listener.id, speech.targetId, 'trust', 3 * credibility, eventId);
        }
        applyRelationship(state, listener.id, speech.speakerId, 'trust', 2, eventId);
        break;
      case 'present':
        if (speech.clueId) applyEvidenceToObserver(state, listener.id, speech.clueId, eventId);
        break;
      case 'question':
        if (speech.targetId) {
          applySuspicion(state, listener.id, speech.targetId, 0.035 * credibility, eventId);
        }
        break;
      default:
        break;
    }
  }
}

export function beginPlayerSpeech(
  state: MatchState,
  intent: SpeechIntent,
  targetId?: string,
  clueId?: string,
): ActionResult {
  const council = state.council;
  if (!council) return { state, events: [], error: 'There is no council.' };
  if (state.phase !== 'council') return { state, events: [], error: 'The council is not in session.' };
  if (council.step !== 'speech') return { state, events: [], error: 'The floor has already moved on.' };
  if (council.playerSpoken) return { state, events: [], error: 'You have already spoken.' };
  const me = player(state);
  if (!me.alive) return { state, events: [], error: 'The dead have no floor.' };

  if (intent === 'accuse' || intent === 'defend' || intent === 'question') {
    if (!targetId) return { state, events: [], error: 'Name someone.' };
    const target = tryContestant(state, targetId);
    if (!target || !target.alive) return { state, events: [], error: 'That person is not at the table.' };
    if (target.id === me.id) return { state, events: [], error: 'You cannot name yourself.' };
  }
  if (intent === 'present') {
    if (!clueId) return { state, events: [], error: 'Choose a piece of evidence to present.' };
    const clue = state.clues.find((entry) => entry.id === clueId);
    if (!clue || !clue.discoveredBy.includes(me.id)) return { state, events: [], error: 'You do not hold that evidence.' };
  }

  const events: GameEvent[] = [];
  const text = speechText(state, me.id, intent, targetId ?? null, clueId ?? null);
  const speech: Speech = {
    speakerId: me.id,
    intent,
    targetId: targetId ?? null,
    clueId: clueId ?? null,
    text,
  };
  const event = emit(state, {
    kind: 'councilSpeech',
    text,
    actorId: me.id,
    subjectId: targetId ?? null,
    clueId: clueId ?? null,
  });
  events.push(event);
  applySpeech(state, speech, event.id);
  council.speeches.push(speech);
  council.playerSpoken = true;
  addJournal(state, { kind: 'claim', title: 'You at the table', text });

  // Cross-talk: every living AI takes its floor turn after hearing the room.
  const rng = rngFor(state);
  for (const contestant of state.contestants) {
    if (contestant.isPlayer || !contestant.alive) continue;
    const plan = chooseSpeech(state, contestant, rng);
    const aiSpeech: Speech = {
      speakerId: contestant.id,
      intent: plan.intent,
      targetId: plan.targetId,
      clueId: plan.clueId,
      text: plan.text,
    };
    const aiEvent = emit(state, {
      kind: 'councilSpeech',
      text: aiSpeech.text,
      actorId: contestant.id,
      subjectId: aiSpeech.targetId,
      clueId: aiSpeech.clueId,
    });
    events.push(aiEvent);
    applySpeech(state, aiSpeech, aiEvent.id);
    council.speeches.push(aiSpeech);
    addJournal(state, { kind: 'claim', title: `${contestant.name} at the table`, text: aiSpeech.text });
  }
  commitRng(state, rng);

  council.step = 'vote';
  note(state, 'The floor is closed. Votes are taken in silence and locked together.');
  return { state, events, error: null };
}

export function toggleShield(state: MatchState): ActionResult {
  const council = state.council;
  if (!council || council.step !== 'vote') return { state, events: [], error: 'Shields are spent before the count.' };
  const me = player(state);
  if (!me.alive) return { state, events: [], error: 'The dead hold nothing.' };
  if (me.shields <= 0) return { state, events: [], error: 'You hold no Oath Shield.' };
  council.playerShieldPending = !council.playerShieldPending;
  note(
    state,
    council.playerShieldPending
      ? 'You will spend one Oath Shield at the count.'
      : 'You keep your Oath Shield.',
  );
  return { state, events: [], error: null };
}

export function tallyVotes(
  state: MatchState,
  votes: Record<string, string>,
  shields: Record<string, number>,
  eligible?: string[],
): Record<string, number> {
  const tally: Record<string, number> = {};
  for (const contestant of living(state)) tally[contestant.id] = 0;
  for (const targetId of Object.values(votes)) {
    if (!eligible || eligible.includes(targetId)) {
      tally[targetId] = (tally[targetId] ?? 0) + 1;
    }
  }
  for (const [targetId, spent] of Object.entries(shields)) {
    if (spent <= 0) continue;
    tally[targetId] = Math.max(0, (tally[targetId] ?? 0) - spent);
  }
  return tally;
}

function decideShields(state: MatchState, council: CouncilState): void {
  const spent: Record<string, number> = {};
  for (const contestant of living(state)) {
    if (contestant.shields <= 0) continue;
    if (contestant.isPlayer) {
      spent[contestant.id] = council.playerShieldPending ? Math.min(1, contestant.shields) : 0;
      continue;
    }
    if (shouldSpendShield(state, contestant)) {
      spent[contestant.id] = Math.min(contestant.shields, publicPressure(state, contestant.id) >= 4 ? 2 : 1);
    }
  }
  for (const [id, amount] of Object.entries(spent)) {
    if (amount <= 0) continue;
    const contestant = getContestant(state, id);
    contestant.shields = Math.max(0, contestant.shields - amount);
    council.shieldsSpent[id] = (council.shieldsSpent[id] ?? 0) + amount;
  }
}

function eliminate(state: MatchState, targetId: string, by: 'council' | 'finale'): GameEvent[] {
  const target = getContestant(state, targetId);
  const witnesses = living(state).map((entry) => entry.id);
  const events = [
    emit(state, {
      kind: 'elimination',
      text:
        by === 'finale'
          ? `${target.name} is named by the final vote and leaves the table.`
          : `${target.name} is banished from the council. Their role is not yet read.`,
      actorId: 'host',
      subjectId: target.id,
      witnessedBy: witnesses,
    }),
  ];
  target.alive = false;
  target.eliminatedOn = state.round;
  target.eliminatedBy = by;
  target.shields = 0;
  addJournal(state, {
    kind: 'vote',
    title: by === 'finale' ? 'The final vote' : 'The banishment',
    text: `${target.name} was named. The Judgment of the Flame will read their role.`,
  });
  state.outcome = factionOutcome(state);
  note(state, `${target.name} leaves the table.`);
  return events;
}

function lockBallot(
  state: MatchState,
  council: CouncilState,
  playerVote: string | null,
  eligible?: string[],
): GameEvent[] {
  const me = player(state);
  const events: GameEvent[] = [];
  const rng = rngFor(state);
  // Every AI vote is fixed here, before the player's vote is revealed. No AI
  // decision function receives `playerVote` (F-10).
  const aiVotes = aiVotesForCouncil(state, rng, eligible);
  commitRng(state, rng);

  council.aiVotes = aiVotes;
  council.playerVote = playerVote;
  council.votes = { ...aiVotes };
  if (playerVote) council.votes[me.id] = playerVote;
  const ballotVotes = { ...council.votes };
  decideShields(state, council);

  const tally = tallyVotes(state, council.votes, council.shieldsSpent, eligible);
  council.tally = tally;
  const pool = eligible ?? living(state).map((entry) => entry.id);
  const max = Math.max(0, ...pool.map((id) => tally[id] ?? 0));
  const leaders = pool.filter((id) => (tally[id] ?? 0) === max);

  for (const [voterId, votedId] of Object.entries(council.votes)) {
    state.voteHistory.push({ round: state.round, ballot: council.round, voterId, targetId: votedId });
    events.push(
      emit(state, {
        kind: 'vote',
        text: `${getContestant(state, voterId).name} votes for ${getContestant(state, votedId).name}.`,
        actorId: voterId,
        subjectId: votedId,
      }),
    );
  }

  if (max === 0) {
    council.noElimination = 'zero';
    council.step = 'reveal';
    council.resultText =
      council.round === 2
        ? 'The Riddle ends with every tally cancelled. No one is banished. The Lantern loses ten.'
        : 'Every tally is cancelled. No one is banished, and the Lantern loses ten.';
    const event = emit(state, { kind: 'vote', text: council.resultText, actorId: 'host' });
    events.push(event);
    applyLantern(state, -10, 'A council with no outcome', event.id);
  } else if (leaders.length > 1 && council.round === 1) {
    council.round = 2;
    council.tiedIds = leaders;
    council.step = 'vote';
    council.votes = null;
    council.tally = null;
    council.playerVote = null;
    council.aiVotes = {};
    council.playerShieldPending = false;
    council.shieldsSpent = {};
    council.resultText = `The tally is tied: ${leaders
      .map((id) => getContestant(state, id).name)
      .join(' and ')}. The Lantern's Riddle begins.`;
    const tie = emit(state, { kind: 'vote', text: council.resultText, actorId: 'host' });
    events.push(tie);
  } else if (leaders.length > 1) {
    council.noElimination = 'tie';
    council.tiedIds = leaders;
    council.step = 'reveal';
    council.resultText =
      'The Riddle is tied a second time. No one is banished, and the Lantern loses fifteen.';
    const event = emit(state, { kind: 'vote', text: council.resultText, actorId: 'host' });
    events.push(event);
    applyLantern(state, -15, 'A second tied ballot', event.id);
  } else {
    council.eliminatedId = leaders[0];
    council.step = 'reveal';
    council.resultText = `${getContestant(state, leaders[0]).name} is banished with ${max} votes.`;
    events.push(...eliminate(state, leaders[0], 'council'));
  }

  evaluatePacts(state, ballotVotes, events);
  addJournal(state, { kind: 'vote', title: 'The count', text: council.resultText });
  return events;
}

export function castVote(state: MatchState, targetId: string): ActionResult {
  const council = state.council;
  if (!council || state.phase !== 'council') return { state, events: [], error: 'There is no council.' };
  if (council.step !== 'vote') return { state, events: [], error: 'The table is not voting.' };
  if (council.round !== 1) return { state, events: [], error: 'The Riddle is open.' };
  if (council.votes) return { state, events: [], error: 'The vote is already locked.' };
  const me = player(state);
  if (!me.alive) return { state, events: [], error: 'The dead do not vote.' };
  const target = tryContestant(state, targetId);
  if (!target || !target.alive) return { state, events: [], error: 'That person cannot receive a vote.' };
  if (target.id === me.id) return { state, events: [], error: 'You cannot vote for yourself.' };
  const events = lockBallot(state, council, targetId);
  return { state, events, error: null };
}

export function riddleVote(state: MatchState, targetId: string): ActionResult {
  const council = state.council;
  if (!council || state.phase !== 'council') return { state, events: [], error: 'There is no council.' };
  if (council.round !== 2 || council.step !== 'vote' || council.votes) {
    return { state, events: [], error: 'The Riddle is not open.' };
  }
  if (!council.tiedIds.includes(targetId)) {
    return { state, events: [], error: 'The Riddle may only name one of the tied contestants.' };
  }
  const me = player(state);
  if (!me.alive) return { state, events: [], error: 'The dead do not vote.' };
  const events = lockBallot(state, council, targetId, council.tiedIds);
  return { state, events, error: null };
}

function applyLantern(state: MatchState, delta: number, reason: string, eventId: string): void {
  changeLantern(state, delta, reason, eventId);
}

function evaluatePacts(state: MatchState, votes: Record<string, string> | null, events: GameEvent[]): void {
  for (const pact of state.pacts) {
    if (pact.status !== 'active') continue;
    if (pact.term === 'voteWithMe' && votes) {
      const voterA = votes[pact.a];
      const voterB = votes[pact.b];
      if (voterA && voterB) {
        if (voterA === voterB) {
          pact.status = 'kept';
          const event = emit(state, {
            kind: 'pact',
            text: 'A private pact holds: two votes went the same way.',
            privateTo: pact.a,
          });
          events.push(event);
          if (state.knowledge[pact.a]) {
            applyRelationship(state, pact.a, pact.b, 'trust', 6, event.id);
          }
          if (state.knowledge[pact.b]) {
            applyRelationship(state, pact.b, pact.a, 'trust', 6, event.id);
          }
        } else {
          pact.status = 'broken';
          pact.brokenBy = pact.b;
          const event = emit(state, {
            kind: 'pact',
            text: 'A private pact breaks at the count.',
            privateTo: pact.a,
          });
          events.push(event);
          if (state.knowledge[pact.a]) {
            applyRelationship(state, pact.a, pact.b, 'trust', -28, event.id);
          }
          addJournal(state, { kind: 'pact', title: 'A pact broken', text: 'A promise was broken at the count.' });
        }
      }
    }
  }
}

/** Spectator / auto-play: the table proceeds without the player. */
export function autoCouncil(state: MatchState): GameEvent[] {
  const council = state.council;
  const events: GameEvent[] = [];
  if (!council) return events;
  const rng = rngFor(state);
  if (council.step === 'speech') {
    for (const contestant of state.contestants) {
      if (contestant.isPlayer || !contestant.alive) continue;
      const plan = chooseSpeech(state, contestant, rng);
      const event = emit(state, {
        kind: 'councilSpeech',
        text: plan.text,
        actorId: contestant.id,
        subjectId: plan.targetId,
        clueId: plan.clueId,
      });
      events.push(event);
      applySpeech(state, { ...plan, speakerId: contestant.id }, event.id);
      council.speeches.push({ ...plan, speakerId: contestant.id });
    }
    council.playerSpoken = true;
    council.step = 'vote';
  }
  commitRng(state, rng);

  const me = player(state);
  let guard = 0;
  while (council.step === 'vote' && !council.votes && guard < 3) {
    guard += 1;
    const eligible = council.round === 2 ? council.tiedIds : undefined;
    const pool = (eligible ?? living(state).map((entry) => entry.id)).filter((id) => id !== me.id);
    if (pool.length === 0) break;
    const pickRng = rngFor(state);
    const vote = pickRng.pick(pool);
    commitRng(state, pickRng);
    events.push(...lockBallot(state, council, me.alive ? vote : null, eligible));
  }
  return events;
}
