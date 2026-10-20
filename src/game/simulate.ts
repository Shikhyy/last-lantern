import { applyAction } from './engine';
import { living } from './state';
import type { ActionResult, GameAction, MatchState, RoomId } from './types';

const DAY_ROOMS: RoomId[] = ['gallery', 'archive', 'aangan', 'council'];
const VEIL_NIGHTS = [1, 3, 5];

/**
 * A deterministic headless player used by the invariant suite and the balance
 * report. It only ever reads what a player is allowed to read: the public
 * view, the player's own role, and their own evidence. It is not shipped in
 * the game UI.
 */
export function autoPlay(initial: MatchState, maxSteps = 600): MatchState {
  let state = initial;
  let steps = 0;
  let talkedRound = 0;
  let votedRound = 0;
  let nightRound = 0;

  const run = (action: GameAction): ActionResult => {
    const result = applyAction(state, action);
    if (!result.error) state = result.state;
    steps += 1;
    return result;
  };

  while (state.phase !== 'ending' && steps < maxSteps) {
    const me = state.contestants.find((entry) => entry.id === state.playerId);

    switch (state.phase) {
      case 'dawn':
      case 'dusk':
      case 'judgment':
        run({ type: 'ADVANCE' });
        break;

      case 'day': {
        if (!me?.alive) {
          run({ type: 'ADVANCE' });
          break;
        }
        const unvisited = DAY_ROOMS.find(
          (room) => !state.rooms.find((entry) => entry.room === room)?.visited,
        );
        if (unvisited) {
          run({ type: 'EXPLORE', room: unvisited });
          break;
        }
        const mission = state.missions.find(
          (entry) => entry.round === state.round && entry.status === 'open',
        );
        if (mission) {
          if ((mission.contributions[state.playerId] ?? 0) < 2) {
            run({ type: 'CONTRIBUTE', missionId: mission.id });
          } else {
            run({ type: 'RESOLVE_MISSION', missionId: mission.id });
          }
          break;
        }
        if (talkedRound !== state.round) {
          talkedRound = state.round;
          const target = living(state).find((entry) => !entry.isPlayer);
          if (target) run({ type: 'CONVERSE', targetId: target.id, intent: 'opinion' });
          break;
        }
        run({ type: 'ADVANCE' });
        break;
      }

      case 'council': {
        const council = state.council;
        if (!council) {
          run({ type: 'ADVANCE' });
          break;
        }
        if (!me?.alive) {
          run({ type: 'ADVANCE' });
          break;
        }
        if (council.step === 'speech') {
          const target = mostAccused(state) ?? living(state).find((entry) => !entry.isPlayer)?.id;
          if (target) run({ type: 'SPEECH', intent: 'accuse', targetId: target });
          else run({ type: 'SPEECH', intent: 'silent' });
          break;
        }
        if (council.step === 'vote' && votedRound !== state.round + council.round / 10) {
          votedRound = state.round + council.round / 10;
          if (council.round === 2) {
            const tied = council.tiedIds.find((id) => id !== state.playerId);
            if (tied) run({ type: 'RIDDLE_VOTE', targetId: tied });
            else run({ type: 'ADVANCE' });
          } else {
            const target = mostAccused(state) ?? living(state).find((entry) => !entry.isPlayer)?.id;
            if (target) run({ type: 'VOTE', targetId: target });
            else run({ type: 'ADVANCE' });
          }
          break;
        }
        run({ type: 'ADVANCE' });
        break;
      }

      case 'night': {
        if (!me?.alive) {
          run({ type: 'ADVANCE' });
          break;
        }
        if (nightRound === state.round) {
          run({ type: 'ADVANCE' });
          break;
        }
        nightRound = state.round;
        if (me.role === 'shadow') {
          const allies = new Set(
            state.contestants.filter((entry) => entry.role === 'shadow').map((entry) => entry.id),
          );
          const target = living(state).find(
            (entry) => !allies.has(entry.id) && entry.id !== state.playerId,
          );
          const veilDue = VEIL_NIGHTS.includes(state.round);
          run({
            type: 'NIGHT_ACTION',
            veilTarget: veilDue ? target?.id : undefined,
            sabotage: state.round % 2 === 0 ? 'valve-open' : undefined,
          });
          break;
        }
        if (me.role === 'keeper') {
          const target = living(state).find((entry) => entry.id !== state.playerId);
          run({ type: 'NIGHT_ACTION', readTarget: target?.id });
          break;
        }
        if (me.role === 'warden') {
          const target = living(state).find((entry) => entry.id !== state.playerId);
          run({ type: 'NIGHT_ACTION', wardTarget: target?.id });
          break;
        }
        run({ type: 'NIGHT_ACTION' });
        break;
      }

      case 'finale': {
        const finale = state.finaleState;
        if (!finale || !me?.alive) {
          run({ type: 'ADVANCE' });
          break;
        }
        if (finale.step === 'reckoning') {
          run({
            type: 'FINAL_TESTIMONY',
            text: 'I came for the truth of the flame, and I have not finished reading it.',
          });
          break;
        }
        if (finale.step === 'question') {
          run({
            type: 'FINAL_ANSWER',
            text: 'I protected the person the room had already decided to lose.',
          });
          break;
        }
        if (finale.step === 'vote') {
          const pool = finale.round === 2 ? finale.tiedIds : living(state).map((entry) => entry.id);
          const target = pool.find((id) => id !== state.playerId);
          if (target) run({ type: 'FINAL_VOTE', targetId: target });
          else run({ type: 'ADVANCE' });
          break;
        }
        run({ type: 'ADVANCE' });
        break;
      }

      default:
        run({ type: 'ADVANCE' });
        break;
    }
  }
  return state;
}

function mostAccused(state: MatchState): string | null {
  const counts: Record<string, number> = {};
  for (const speech of state.council?.speeches ?? []) {
    if (speech.intent === 'accuse' && speech.targetId) {
      counts[speech.targetId] = (counts[speech.targetId] ?? 0) + 1;
    }
  }
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return ranked.length > 0 ? ranked[0][0] : null;
}
