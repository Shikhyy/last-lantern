import { applyEvidenceToObserver, commitRng, recordPublicClaim, rngFor } from './ai';
import { voiceFor } from './dialogue';
import { proposePact } from './pacts';
import {
  addJournal,
  applyRelationship,
  applySuspicion,
  emit,
  getContestant,
  living,
  note,
  player,
  pushMemory,
} from './state';
import type { ActionResult, ConversationIntent, GameEvent, MatchState } from './types';

function alibiFor(state: MatchState, contestantId: string): { place: string; truthful: boolean } {
  return (
    state.alibis.find((entry) => entry.contestantId === contestantId && entry.round === state.round) ?? {
      place: 'the gallery',
      truthful: true,
    }
  );
}

export function converse(
  state: MatchState,
  input: { targetId: string; intent: ConversationIntent; subjectId?: string; clueId?: string; text?: string },
): ActionResult {
  const me = player(state);
  if (!me.alive) return { state, events: [], error: 'The dead hold no conversations.' };
  if (state.phase !== 'day' && state.phase !== 'dusk') {
    return { state, events: [], error: 'There is no time to talk now.' };
  }
  const target = state.contestants.find((entry) => entry.id === input.targetId && entry.alive && !entry.isPlayer);
  if (!target) return { state, events: [], error: 'Choose a living contestant.' };
  const knowledge = state.knowledge[target.id];
  if (!knowledge) return { state, events: [], error: 'They will not speak with you.' };

  if (input.intent === 'pact') return proposePact(state, target.id, 'voteWithMe');

  const events: GameEvent[] = [];
  const voice = voiceFor(target.characterId);
  const event = emit(state, {
    kind: 'conversation',
    text: `${me.name} speaks privately with ${target.name}.`,
    witnessedBy: [me.id, target.id],
    actorId: me.id,
    subjectId: target.id,
  });
  events.push(event);
  const rng = rngFor(state);
  let line = '';
  let journal = '';

  switch (input.intent) {
    case 'whereabouts': {
      const alibi = alibiFor(state, target.id);
      line = voice.whereabouts(alibi.place);
      recordPublicClaim(
        state,
        target.id,
        target.id,
        'whereabouts',
        line,
        alibi.truthful ? 'true' : 'false',
        [me.id, target.id],
      );
      journal = `${target.name}: “${line}”`;
      applyRelationship(state, target.id, me.id, 'affinity', -1, event.id);
      break;
    }
    case 'opinion': {
      const candidates = living(state).filter((entry) => entry.id !== target.id && entry.id !== me.id);
      const subject =
        (input.subjectId ? getContestant(state, input.subjectId) : undefined) ??
        (candidates.length > 0 ? candidates[rng.int(candidates.length)] : target);
      const suspicion = knowledge.suspicion[subject.id] ?? 0.2;
      line =
        suspicion > 0.58
          ? voice.suspicion(subject.name)
          : suspicion < 0.26
            ? voice.trust(subject.name)
            : voice.neutral(subject.name);
      recordPublicClaim(state, target.id, subject.id, 'deed', line, 'true', [me.id, target.id]);
      journal = `${target.name} on ${subject.name}: “${line}”`;
      applyRelationship(state, target.id, me.id, 'affinity', 2, event.id);
      break;
    }
    case 'shareEvidence': {
      const clue = state.clues.find((entry) => entry.id === input.clueId);
      if (!clue || !clue.discoveredBy.includes(me.id)) {
        return { state, events: [], error: 'You do not hold that evidence.' };
      }
      applyEvidenceToObserver(state, target.id, clue.id, event.id);
      applyRelationship(state, target.id, me.id, 'trust', 10, event.id);
      applyRelationship(state, target.id, me.id, 'affinity', 4, event.id);
      knowledge.credibility[me.id] = (knowledge.credibility[me.id] ?? 0) + 0.06;
      const implicated = clue.pointsTo ? getContestant(state, clue.pointsTo) : null;
      line = implicated
        ? `${target.name} studies ${clue.title}. “${voice.suspicion(implicated.name)}”`
        : `${target.name} studies ${clue.title} and says nothing for a moment.`;
      journal = `You showed ${target.name} ${clue.title}. ${line}`;
      pushMemory(state, target.id, {
        kind: 'kindness',
        text: `${me.name} showed you ${clue.title}.`,
        importance: 0.55,
        subjectId: me.id,
      });
      break;
    }
    case 'accuse': {
      if (!input.subjectId) return { state, events: [], error: 'Name the person you are accusing.' };
      const subject = state.contestants.find((entry) => entry.id === input.subjectId && entry.alive);
      if (!subject) return { state, events: [], error: 'That person is not here.' };
      if (subject.id === me.id) return { state, events: [], error: 'Accuse someone else.' };
      const already = (knowledge.suspicion[subject.id] ?? 0.2) > 0.5;
      applySuspicion(state, target.id, subject.id, already ? 0.11 : 0.07, event.id);
      applyRelationship(state, target.id, subject.id, 'trust', -12, event.id);
      applyRelationship(state, target.id, me.id, 'trust', already ? 3 : -4, event.id);
      line = already
        ? `${target.name} lowers their voice. “I had noticed. Say the rest of it.”`
        : `${target.name} hears you out, then says: “That is a serious thing to put on a table.”`;
      recordPublicClaim(
        state,
        me.id,
        subject.id,
        'deed',
        `${me.name} accused ${subject.name} in private.`,
        'true',
        [me.id, target.id],
      );
      journal = `You accused ${subject.name} to ${target.name}.`;
      break;
    }
    case 'defend': {
      if (!input.subjectId) return { state, events: [], error: 'Name the person you are defending.' };
      const subject = state.contestants.find((entry) => entry.id === input.subjectId && entry.alive);
      if (!subject) return { state, events: [], error: 'That person is not here.' };
      applySuspicion(state, target.id, subject.id, -0.07, event.id);
      applyRelationship(state, target.id, subject.id, 'trust', 8, event.id);
      applyRelationship(state, target.id, me.id, 'affinity', 3, event.id);
      line = `${target.name} listens, and something in their shoulders eases. “I will weigh that.”`;
      journal = `You defended ${subject.name} to ${target.name}.`;
      break;
    }
    case 'confide': {
      applyRelationship(state, target.id, me.id, 'trust', 6, event.id);
      applyRelationship(state, target.id, me.id, 'affinity', 10, event.id);
      line = voice.confide;
      journal = `${target.name} confides: “${line}”`;
      pushMemory(state, target.id, {
        kind: 'kindness',
        text: `${me.name} confided in you.`,
        importance: 0.6,
        subjectId: me.id,
      });
      break;
    }
    case 'deceive': {
      const subject = input.subjectId ? state.contestants.find((entry) => entry.id === input.subjectId) : null;
      if (!subject) return { state, events: [], error: 'Choose who the lie is about.' };
      const lie = input.text?.trim() || `${subject.name} was in the archive when the seal was cut.`;
      const selfContradiction = subject.id === target.id;
      recordPublicClaim(state, me.id, subject.id, 'whereabouts', lie, 'false', [me.id, target.id]);
      if (selfContradiction) {
        const alibi = alibiFor(state, target.id);
        applyRelationship(state, target.id, me.id, 'trust', -22, event.id);
        applySuspicion(state, target.id, me.id, 0.2, event.id);
        line = `${target.name} goes still. “You were not there. I was. I was in ${alibi.place}.”`;
      } else {
        applySuspicion(state, target.id, subject.id, 0.06, event.id);
        line = `${target.name} nods slowly. “If that is true, it changes the shape of the night.”`;
      }
      journal = `You lied to ${target.name}: “${lie}”`;
      break;
    }
    case 'threaten': {
      applyRelationship(state, target.id, me.id, 'fear', 25, event.id);
      applyRelationship(state, target.id, me.id, 'trust', -18, event.id);
      applyRelationship(state, target.id, me.id, 'affinity', -12, event.id);
      line = voice.threat;
      journal = `You threatened ${target.name}.`;
      break;
    }
    case 'console': {
      applyRelationship(state, target.id, me.id, 'affinity', 12, event.id);
      applyRelationship(state, target.id, me.id, 'trust', 7, event.id);
      applyRelationship(state, target.id, me.id, 'fear', -5, event.id);
      line = voice.console;
      journal = `You sat with ${target.name}.`;
      break;
    }
    default:
      return { state, events: [], error: 'That is not something you can say.' };
  }

  const memory = knowledge.memories.find((entry) => entry.weight > 0.35);
  if (memory && rng.chance(0.4)) {
    line = `${line} ${voice.memory(memory.text)}`;
  }
  commitRng(state, rng);

  event.text = line;
  events[0] = event;
  addJournal(state, { kind: 'claim', title: `With ${target.name}`, text: journal });
  note(state, line);
  return { state, events, error: null };
}
