import { aiVotesForCouncil, chooseVote, commitRng, rngFor, shouldSpendShield } from './ai';
import { voiceFor } from './dialogue';
import { applyEnding, type EndingTrigger } from './endings';
import { addJournal, aiLiving, emit, getContestant, living, note, player } from './state';
import type { ActionResult, FinaleState, GameEvent, MatchState } from './types';

export function beginFinale(state: MatchState): void {
  state.phase = 'finale';
  const testimonials = aiTestimonies(state);
  const finale: FinaleState = {
    step: 'reckoning',
    testimonies: testimonials,
    answers: [],
    round: 1,
    votes: null,
    tally: null,
    shieldsSpent: {},
    eliminatedId: null,
    tiedIds: [],
    noElimination: null,
    resultText: '',
  };
  state.finaleState = finale;
  emit(state, {
    kind: 'finale',
    text: 'The finale begins. The Last Lantern is set at the centre of the table and the doors are barred.',
  });
  for (const testimony of testimonials) {
    emit(state, {
      kind: 'finale',
      text: testimony.text,
      actorId: testimony.contestantId,
    });
  }
  addJournal(state, {
    kind: 'note',
    title: 'The finale',
    text: 'Reckoning, the last question, and one name. The flame waits.',
  });
  note(state, 'Reckoning. Say what you came here to say.');
}

function aiTestimonies(state: MatchState): { contestantId: string; text: string }[] {
  return aiLiving(state).map((contestant) => {
    const knowledge = state.knowledge[contestant.id];
    const voice = voiceFor(contestant.characterId);
    if (!knowledge) return { contestantId: contestant.id, text: voice.greeting };
    const read = knowledge.readResults[knowledge.readResults.length - 1];
    if (read && read.faction === 'shadow') {
      const target = getContestant(state, read.targetId);
      return {
        contestantId: contestant.id,
        text: `${contestant.name} stands. “I Read ${target.name}. I have said nothing until now. ${target.name} is Shadowed.”`,
      };
    }
    const ranked = living(state)
      .filter((entry) => entry.id !== contestant.id)
      .sort((a, b) => (knowledge.suspicion[b.id] ?? 0.2) - (knowledge.suspicion[a.id] ?? 0.2));
    const target = ranked[0];
    if (!target) return { contestantId: contestant.id, text: voice.greeting };
    return {
      contestantId: contestant.id,
      text: `${contestant.name} gives a final testimony. “${voice.suspicion(target.name)}”`,
    };
  });
}

const QUESTIONS = [
  'What did you see that you have not said aloud?',
  'Who did you protect, and why?',
  'Which promise are you most afraid to have kept?',
];

export function lanternQuestion(state: MatchState): string {
  return QUESTIONS[(state.round - 1) % QUESTIONS.length];
}

export function submitTestimony(state: MatchState, text: string): ActionResult {
  const finale = state.finaleState;
  if (state.phase !== 'finale' || !finale) return { state, events: [], error: 'There is no finale.' };
  if (finale.step !== 'reckoning') return { state, events: [], error: 'The reckoning is over.' };
  const me = player(state);
  if (!me.alive) return { state, events: [], error: 'The dead have no testimony.' };
  const clean = text.trim();
  if (clean.length < 2) return { state, events: [], error: 'Say something they can weigh.' };
  finale.testimonies.push({ contestantId: me.id, text: clean });
  const event = emit(state, {
    kind: 'finale',
    text: `${me.name}: “${clean}”`,
    actorId: me.id,
  });
  addJournal(state, { kind: 'note', title: 'Your testimony', text: clean });
  // Every listener weighs the testimony only through what they can hear.
  for (const contestant of living(state)) {
    if (contestant.isPlayer) continue;
    const knowledge = state.knowledge[contestant.id];
    if (!knowledge) continue;
    if (clean.toLowerCase().includes('shadow')) {
      knowledge.credibility[me.id] = (knowledge.credibility[me.id] ?? 0) + 0.04;
    }
  }
  finale.step = 'question';
  finale.answers = aiAnswers(state);
  note(state, lanternQuestion(state));
  return { state, events: [event], error: null };
}

function aiAnswers(state: MatchState): { contestantId: string; text: string }[] {
  return aiLiving(state).map((contestant) => {
    const knowledge = state.knowledge[contestant.id];
    const voice = voiceFor(contestant.characterId);
    if (!knowledge) return { contestantId: contestant.id, text: voice.greeting };
    const memory = knowledge.memories.find((entry) => entry.highEmotion) ?? knowledge.memories[0];
    if (memory) {
      return {
        contestantId: contestant.id,
        text: `${contestant.name} answers quietly. “${voice.memory(memory.text)}”`,
      };
    }
    return {
      contestantId: contestant.id,
      text: `${contestant.name} answers: “I protected the person I could not bear to lose. That is all I will say.”`,
    };
  });
}

export function submitAnswer(state: MatchState, text: string): ActionResult {
  const finale = state.finaleState;
  if (state.phase !== 'finale' || !finale) return { state, events: [], error: 'There is no finale.' };
  if (finale.step !== 'question') return { state, events: [], error: 'The question has passed.' };
  const me = player(state);
  if (!me.alive) return { state, events: [], error: 'The dead do not answer.' };
  const clean = text.trim();
  if (clean.length < 2) return { state, events: [], error: 'Answer the question.' };
  finale.answers.push({ contestantId: me.id, text: clean });
  const event = emit(state, {
    kind: 'finale',
    text: `${me.name} answers the Lantern: “${clean}”`,
    actorId: me.id,
  });
  addJournal(state, { kind: 'note', title: 'Your answer', text: clean });
  finale.step = 'vote';
  note(state, 'One name. The vote is taken now.');
  return { state, events: [event], error: null };
}

export function submitFinalVote(state: MatchState, targetId: string): ActionResult {
  const finale = state.finaleState;
  if (state.phase !== 'finale' || !finale) return { state, events: [], error: 'There is no finale.' };
  if (finale.step !== 'vote') return { state, events: [], error: 'The vote is not open.' };
  const me = player(state);
  if (!me.alive) return { state, events: [], error: 'The dead do not vote.' };
  const target = state.contestants.find((entry) => entry.id === targetId && entry.alive);
  if (!target) return { state, events: [], error: 'Name someone at the table.' };
  if (target.id === me.id) return { state, events: [], error: 'You cannot name yourself.' };

  const eligible = finale.round === 2 ? finale.tiedIds : undefined;
  if (eligible && !eligible.includes(target.id)) {
    return { state, events: [], error: 'The Riddle names only the tied.' };
  }

  const rng = rngFor(state);
  const aiVotes: Record<string, string> = {};
  for (const voter of aiLiving(state)) {
    aiVotes[voter.id] = eligible
      ? chooseVote(state, voter, rng, eligible)
      : chooseVote(state, voter, rng);
  }
  commitRng(state, rng);

  const votes: Record<string, string> = { ...aiVotes, [me.id]: target.id };
  const spent: Record<string, number> = {};
  for (const contestant of living(state)) {
    if (contestant.shields <= 0) continue;
    const amount = !contestant.isPlayer && shouldSpendShield(state, contestant) ? 1 : 0;
    if (amount > 0) {
      contestant.shields -= amount;
      spent[contestant.id] = amount;
    }
  }
  const tally: Record<string, number> = {};
  for (const contestant of living(state)) tally[contestant.id] = 0;
  for (const voted of Object.values(votes)) {
    if (!eligible || eligible.includes(voted)) tally[voted] = (tally[voted] ?? 0) + 1;
  }
  for (const [id, amount] of Object.entries(spent)) {
    tally[id] = Math.max(0, (tally[id] ?? 0) - amount);
  }

  finale.votes = votes;
  finale.tally = tally;
  finale.shieldsSpent = spent;
  const events: GameEvent[] = [];
  for (const [voterId, votedId] of Object.entries(votes)) {
    const ballot = finale.round;
    state.voteHistory.push({ round: state.round, ballot, voterId, targetId: votedId });
    events.push(
      emit(state, {
        kind: 'vote',
        text: `${getContestant(state, voterId).name} names ${getContestant(state, votedId).name}.`,
        actorId: voterId,
        subjectId: votedId,
      }),
    );
  }

  const pool = eligible ?? living(state).map((entry) => entry.id);
  const max = Math.max(...pool.map((id) => tally[id] ?? 0));
  const leaders = pool.filter((id) => (tally[id] ?? 0) === max);

  if (max === 0) {
    finale.noElimination = 'zero';
    if (finale.round === 1) {
      finale.round = 2;
      finale.tiedIds = pool;
      finale.votes = null;
      finale.tally = null;
      finale.resultText = 'Every tally is cancelled. The Lantern’s Riddle begins.';
      events.push(emit(state, { kind: 'vote', text: finale.resultText, actorId: 'host' }));
      return { state, events, error: null };
    }
    finale.step = 'reveal';
    finale.resultText = 'No name is agreed. The oath is left unlit.';
    state.outcome = 'shadow';
    events.push(emit(state, { kind: 'vote', text: finale.resultText, actorId: 'host' }));
    return { state, events, error: null };
  }

  if (leaders.length > 1) {
    if (finale.round === 1) {
      finale.round = 2;
      finale.tiedIds = leaders;
      finale.votes = null;
      finale.tally = null;
      finale.resultText = `The table ties between ${leaders
        .map((id) => getContestant(state, id).name)
        .join(' and ')}. The Lantern’s Riddle begins.`;
      events.push(emit(state, { kind: 'vote', text: finale.resultText, actorId: 'host' }));
      return { state, events, error: null };
    }
    finale.noElimination = 'tie';
    finale.step = 'reveal';
    finale.resultText = 'The Riddle ties a second time. No one is named, and the oath goes unlit.';
    state.outcome = 'shadow';
    events.push(emit(state, { kind: 'vote', text: finale.resultText, actorId: 'host' }));
    return { state, events, error: null };
  }

  const named = getContestant(state, leaders[0]);
  named.alive = false;
  named.eliminatedOn = state.round;
  named.eliminatedBy = 'finale';
  named.revealedRole = named.role;
  finale.eliminatedId = named.id;
  finale.step = 'reveal';
  state.outcome = named.role === 'shadow' ? 'oathkeeper' : 'shadow';
  finale.resultText =
    named.role === 'shadow'
      ? `${named.name} is Shadowed. The oathkeepers have the flame.`
      : `${named.name} is an Oathkeeper. The Shadowed have the flame.`;
  const verdict = emit(state, {
    kind: 'judgment',
    text: `The final name is ${named.name}: ${named.role === 'shadow' ? 'Shadowed' : 'Oathkeeper'}.`,
    actorId: 'host',
    subjectId: named.id,
  });
  events.push(verdict);
  addJournal(state, { kind: 'vote', title: 'The final name', text: finale.resultText });
  note(state, finale.resultText);
  return { state, events, error: null };
}

export function finishFinale(state: MatchState, trigger: EndingTrigger = 'faction'): void {
  applyEnding(state, trigger);
}

/** Used for spectator mode and by the ADVANCE verb in the finale. */
export function advanceFinale(state: MatchState): ActionResult {
  const finale = state.finaleState;
  if (!finale) return { state, events: [], error: 'There is no finale.' };
  const me = player(state);
  const events: GameEvent[] = [];
  if (finale.step === 'reckoning') {
    if (me.alive) return { state, events: [], error: 'Give your testimony first.' };
    finale.step = 'question';
    finale.answers = aiAnswers(state);
    return { state, events, error: null };
  }
  if (finale.step === 'question') {
    if (me.alive) return { state, events: [], error: 'Answer the Lantern first.' };
    finale.step = 'vote';
    return { state, events, error: null };
  }
  if (finale.step === 'vote') {
    if (me.alive) return { state, events: [], error: 'Cast your final name.' };
    const rng = rngFor(state);
    const votes: Record<string, string> = aiVotesForCouncil(
      state,
      rng,
      finale.round === 2 ? finale.tiedIds : undefined,
    );
    commitRng(state, rng);
    const pool = finale.round === 2 ? finale.tiedIds : living(state).map((entry) => entry.id);
    const tally: Record<string, number> = {};
    for (const id of pool) tally[id] = 0;
    for (const voted of Object.values(votes)) {
      if (pool.includes(voted)) tally[voted] = (tally[voted] ?? 0) + 1;
    }
    finale.votes = votes;
    finale.tally = tally;
    const max = Math.max(...Object.values(tally));
    const leaders = pool.filter((id) => tally[id] === max);
    if (max === 0 || leaders.length > 1) {
      if (finale.round === 1) {
        finale.round = 2;
        finale.tiedIds = leaders.length > 0 ? leaders : pool;
        finale.votes = null;
        finale.tally = null;
      } else {
        finale.step = 'reveal';
        finale.noElimination = 'tie';
        finale.resultText = 'The Riddle ties a second time. No one is named.';
        state.outcome = 'shadow';
      }
      return { state, events, error: null };
    }
    const named = getContestant(state, leaders[0]);
    named.alive = false;
    named.eliminatedOn = state.round;
    named.eliminatedBy = 'finale';
    named.revealedRole = named.role;
    finale.eliminatedId = named.id;
    finale.step = 'reveal';
    state.outcome = named.role === 'shadow' ? 'oathkeeper' : 'shadow';
    finale.resultText = `${named.name} is named.`;
    return { state, events, error: null };
  }
  if (finale.step === 'reveal') {
    finishFinale(state);
    return { state, events, error: null };
  }
  return { state, events, error: 'The finale is over.' };
}

