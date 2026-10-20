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

    case 'BOARD_LINK': {
      if (!state.boardLinks) state.boardLinks = [];
      if (!action.from || !action.to || action.from === action.to) {
        return { state: previous, events: [], error: 'A thread needs two different pins.' };
      }
      if (state.boardLinks.length >= 40) {
        return { state: previous, events: [], error: 'The board will hold no more threads.' };
      }
      if (
        state.boardLinks.some(
          (link) => link.from === action.from && link.to === action.to && link.kind === action.kind,
        )
      ) {
        return { state: previous, events: [], error: 'That thread is already pinned.' };
      }
      state.boardLinks.push({
        id: `b${state.nextId}`,
        from: action.from,
        to: action.to,
        kind: action.kind,
        round: state.round,
      });
      state.nextId += 1;
      state.lastMessage = 'You pin a thread to the evidence board.';
      outcome = result(state);
      break;
    }

    case 'BOARD_UNLINK':
      state.boardLinks = (state.boardLinks ?? []).filter((link) => link.id !== action.id);
      state.lastMessage = 'The thread comes away cleanly.';
      outcome = result(state);
      break;

    case 'BOARD_CLEAR':
      state.boardLinks = [];
      state.lastMessage = 'The board is bare again.';
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
