import { converse } from './conversation';
import { castVote, riddleVote, beginPlayerSpeech, toggleShield } from './council';
import { examineClue, exploreRoom } from './evidence';
import { advance } from './phases';
import { submitAnswer, submitFinalVote, submitTestimony } from './finale';
import { createMatch } from './match';
import { contribute, resolveMission, sabotageMission } from './missions';
import { performNightAction } from './night';
import { proposePact } from './pacts';
import type { ActionResult, GameAction, MatchOptions, MatchState } from './types';

function result(state: MatchState): ActionResult {
  return { state, events: [], error: null };
}

/**
 * The single entry point for every gameplay verb. The input state is never
 * mutated: on an illegal action the original state is returned untouched and
 * the error is surfaced to the caller.
 */
export function applyAction(previous: MatchState, action: GameAction): ActionResult {
  const state: MatchState = structuredClone(previous) as MatchState;
  let outcome: ActionResult;

  switch (action.type) {
    case 'ADVANCE':
      outcome = advance(state);
      break;

    case 'EXPLORE':
      if (state.phase !== 'day') {
        return { state: previous, events: [], error: 'Rooms are searched during the day.' };
      }
      outcome = exploreRoom(state, action.room);
      break;

    case 'SET_ROOM':
      state.currentRoom = action.room;
      outcome = result(state);
      break;

    case 'EXAMINE':
      if (state.phase !== 'day' && state.phase !== 'dusk') {
        return { state: previous, events: [], error: 'There is no light to read by now.' };
      }
      outcome = examineClue(state, action.clueId);
      break;

    case 'CONTRIBUTE':
      outcome = contribute(state, action.missionId);
      break;

    case 'RESOLVE_MISSION':
      outcome = resolveMission(state, action.missionId);
      break;

    case 'SABOTAGE':
      outcome = sabotageMission(state, action.missionId);
      break;

    case 'CONVERSE':
      outcome = converse(state, {
        targetId: action.targetId,
        intent: action.intent,
        subjectId: action.subjectId,
        clueId: action.clueId,
        text: action.text,
      });
      break;

    case 'PROPOSE_PACT':
      outcome = proposePact(state, action.targetId, action.term);
      break;

    case 'SPEECH':
      outcome = beginPlayerSpeech(state, action.intent, action.targetId, action.clueId);
      break;

    case 'SPEND_SHIELD':
      outcome = toggleShield(state);
      break;

    case 'VOTE':
      outcome = state.council?.round === 2 ? riddleVote(state, action.targetId) : castVote(state, action.targetId);
      break;

    case 'RIDDLE_VOTE':
      outcome = riddleVote(state, action.targetId);
      break;

    case 'NIGHT_ACTION':
      outcome = performNightAction(state, {
        veilTarget: action.veilTarget,
        sabotage: action.sabotage,
        readTarget: action.readTarget,
        wardTarget: action.wardTarget,
      });
      break;

    case 'FINAL_TESTIMONY':
      outcome = submitTestimony(state, action.text);
      break;

    case 'FINAL_ANSWER':
      outcome = submitAnswer(state, action.text);
      break;

    case 'FINAL_VOTE':
      outcome = submitFinalVote(state, action.targetId);
      break;

    default:
      return { state: previous, events: [], error: 'Unknown action.' };
  }

  if (outcome.error) return { state: previous, events: [], error: outcome.error };
  return outcome;
}

/**
 * A new match keeps only the soft anti-repeat ledger from the old one. Nothing
 * else — roles, knowledge, journal — crosses the boundary.
 */
export function restartMatch(previous: MatchState | null, options: MatchOptions): MatchState {
  return createMatch({
    ...options,
    antiRepeat: previous ? { ...previous.antiRepeat } : options.antiRepeat,
  });
}
