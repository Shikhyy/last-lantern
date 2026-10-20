import { commitRng, rngFor } from './ai';
import { autoCouncil, beginCouncil } from './council';
import { applyEnding } from './endings';
import { advanceFinale, beginFinale } from './finale';
import { judgmentNext, revealJudgment } from './judgment';
import { aiSabotageCheck, resolveOpenMissions } from './missions';
import { beginNight, resolveNight } from './night';
import {
  addJournal,
  changeLantern,
  decayMemories,
  emit,
  living,
  note,
  player,
} from './state';
import type { ActionResult, GameEvent, MatchState } from './types';
import { ensureMissions } from './match';

export function enterDawn(state: MatchState): GameEvent[] {
  state.round += 1;
  state.phase = 'dawn';
  state.council = null;
  state.currentRoom = 'aangan';
  const events: GameEvent[] = [];
  events.push(
    emit(state, {
      kind: 'phase',
      text: `Dawn ${state.round}. The palace counts its chairs.`,
    }),
  );
  if (state.round > state.lastDawnTick) {
    const event = emit(state, {
      kind: 'dawnTick',
      text: `The night burns ten from the Lantern Meter.`,
      amount: -10,
    });
    events.push(event);
    changeLantern(state, -10, 'The night burns down', event.id);
    state.lastDawnTick = state.round;
  }
  for (const contestant of state.contestants) {
    if (!contestant.isPlayer) decayMemories(state, contestant.id, 1);
  }
  addJournal(state, {
    kind: 'roster',
    title: `Dawn ${state.round}`,
    text: `Lantern ${state.lantern}. ${living(state).length} still at the table.`,
  });
  note(state, `Dawn ${state.round}. The Lantern stands at ${state.lantern}.`);
  return events;
}

export function enterDay(state: MatchState): GameEvent[] {
  state.phase = 'day';
  const rng = rngFor(state);
  const missions = ensureMissions(state, rng);
  for (const mission of missions) aiSabotageCheck(state, mission, rng);
  commitRng(state, rng);
  const events = [
    emit(state, {
      kind: 'phase',
      text: 'Daylight. The palace is open: the Aangan, the Long Gallery, the Archive and the Council Chamber.',
    }),
  ];
  note(state, 'The day is yours. Search, speak, and take up a mission.');
  return events;
}

export function enterDusk(state: MatchState): GameEvent[] {
  state.phase = 'dusk';
  const event = emit(state, {
    kind: 'phase',
    text: 'Dusk. The lamps are lit along the arcade and the table is set.',
  });
  note(state, 'Dusk. Make your last promise before the bell.');
  return [event];
}

export function enterJudgment(state: MatchState): GameEvent[] {
  state.phase = 'judgment';
  const events = revealJudgment(state);
  events.push(
    emit(state, {
      kind: 'phase',
      text: 'The Judgment of the Flame. The dead are named, and their roles are read.',
    }),
  );
  if (state.lantern <= 0) state.outcome = state.outcome ?? 'shadow';
  note(
    state,
    state.outcome
      ? 'The Judgment is read. The palace has decided.'
      : 'The Judgment is read. The table goes on.',
  );
  return events;
}

export function enterEnding(state: MatchState, trigger: 'faction' | 'long_dark' | 'unlit' = 'faction'): void {
  applyEnding(state, trigger);
}

/**
 * The main phase clock. Each call advances exactly one authored beat and is
 * the only place a Lantern tick or a Judgment happens.
 */
export function advance(state: MatchState): ActionResult {
  if (state.phase === 'ending') return { state, events: [], error: 'The match is over.' };

  if (state.lantern <= 0) {
    enterEnding(state, 'long_dark');
    return { state, events: [], error: null };
  }

  switch (state.phase) {
    case 'dawn':
      return { state, events: enterDay(state), error: null };

    case 'day': {
      const events = resolveOpenMissions(state);
      events.push(...enterDusk(state));
      return { state, events, error: null };
    }

    case 'dusk':
      beginCouncil(state);
      return { state, events: [], error: null };

    case 'council': {
      const council = state.council;
      if (!council) {
        return { state, events: [], error: 'The council has not been called.' };
      }
      if (council.step !== 'reveal') {
        if (!player(state).alive) {
          return { state, events: autoCouncil(state), error: null };
        }
        return { state, events: [], error: 'The council has not resolved its vote.' };
      }
      if (state.outcome) {
        return { state, events: enterJudgment(state), error: null };
      }
      beginNight(state);
      return { state, events: [], error: null };
    }

    case 'night': {
      if (state.nightState && !state.nightState.resolved) {
        const result = resolveNight(state);
        return result;
      }
      return { state, events: enterJudgment(state), error: null };
    }

    case 'judgment': {
      const next = judgmentNext(state);
      if (next === 'ending') {
        enterEnding(state, state.lantern <= 0 ? 'long_dark' : 'faction');
        return { state, events: [], error: null };
      }
      if (next === 'finale') {
        beginFinale(state);
        return { state, events: [], error: null };
      }
      return { state, events: enterDawn(state), error: null };
    }

    case 'finale':
      return advanceFinale(state);

    default:
      return { state, events: [], error: 'Nothing happens.' };
  }
}

/** Who is still alive and what the player is allowed to do; used by the UI. */
export function phaseHint(state: MatchState): string {
  switch (state.phase) {
    case 'dawn':
      return 'Read the Judgment. Then take the day.';
    case 'day':
      return 'Search a room, speak with someone, or run a mission.';
    case 'dusk':
      return 'Make a last promise, then ring the bell.';
    case 'council':
      return state.council?.step === 'speech'
        ? 'Take the floor, then vote.'
        : state.council?.round === 2
          ? 'The Riddle: vote among the tied.'
          : 'Cast your vote.';
    case 'night':
      return player(state).alive && player(state).role !== 'oathkeeper'
        ? 'Choose your night action.'
        : 'Wait for the palace to decide.';
    case 'judgment':
      return 'The roles of the dead are read.';
    case 'finale':
      return 'Reckoning, the last question, one name.';
    default:
      return 'The match is over.';
  }
}
