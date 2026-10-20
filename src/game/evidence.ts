import { applyEvidenceToObserver, rngFor, commitRng } from './ai';
import { addJournal, emit, note, player, roomStateOf } from './state';
import type { ActionResult, Clue, GameEvent, MatchState, RoomId } from './types';

const ROOM_LABEL: Record<RoomId, string> = {
  aangan: 'the Aangan',
  gallery: 'the Long Gallery',
  archive: 'the Archive',
  council: 'the Council Chamber',
};

export function clueAvailable(state: MatchState, clue: Clue): boolean {
  if (clue.roundPlaced > state.round) return false;
  const archive = roomStateOf(state, 'archive');
  if (clue.requires === 'archive-open' && !archive.archiveOpen) return false;
  if (clue.requires === 'archive-drained' && !archive.archiveDrained) return false;
  return true;
}

/** Who else is in the room when the player searches it. Seeded, so replayable. */
function witnessesFor(state: MatchState, room: RoomId): string[] {
  const rng = rngFor(state);
  const present = state.contestants.filter(
    (entry) => entry.alive && !entry.isPlayer && rng.chance(room === 'council' ? 0.55 : 0.35),
  );
  commitRng(state, rng);
  return [state.playerId, ...present.map((entry) => entry.id)];
}

export function exploreRoom(state: MatchState, room: RoomId): ActionResult {
  const events: GameEvent[] = [];
  state.currentRoom = room;
  const roomState = roomStateOf(state, room);
  roomState.visited = true;

  if (room === 'archive' && !roomState.archiveOpen) {
    roomState.archiveOpen = true;
    const opened = emit(state, {
      kind: 'clue',
      text: 'The archive seal has been cut in one clean stroke. The archive is open.',
    });
    events.push(opened);
    addJournal(state, {
      kind: 'clue',
      title: 'The cut seal',
      text: 'The wax seal on the archive door was cut before anyone was named. Someone began early.',
    });
    note(state, 'The archive is open. The cut is too clean to be an accident.');
    return { state, events, error: null };
  }

  const witnesses = witnessesFor(state, room);
  const discoveries = state.clues.filter(
    (clue) =>
      clue.room === room && clueAvailable(state, clue) && !clue.discoveredBy.includes(state.playerId),
  );

  if (discoveries.length === 0) {
    note(state, `You search ${ROOM_LABEL[room]}, but find nothing you did not already know.`);
    return { state, events, error: null };
  }

  for (const clue of discoveries.slice(0, 2)) {
    clue.discoveredBy.push(state.playerId);
    const event = emit(state, {
      kind: 'clue',
      text: `${player(state).name} finds ${clue.title} in ${ROOM_LABEL[room]}. ${clue.body}`,
      witnessedBy: witnesses,
      clueId: clue.id,
      actorId: state.playerId,
    });
    events.push(event);
    addJournal(state, { kind: 'clue', title: clue.title, text: clue.body });
    for (const observerId of witnesses) {
      if (observerId === state.playerId) continue;
      applyEvidenceToObserver(state, observerId, clue.id, event.id);
    }
  }

  note(
    state,
    discoveries.length === 1
      ? `You find ${discoveries[0].title}.`
      : `You find ${discoveries.length} pieces of evidence.`,
  );
  return { state, events, error: null };
}

export function examineClue(state: MatchState, clueId: string): ActionResult {
  const clue = state.clues.find((entry) => entry.id === clueId);
  if (!clue) return { state, events: [], error: 'No such clue.' };
  if (!clue.discoveredBy.includes(state.playerId)) {
    return { state, events: [], error: 'You have not found that yet.' };
  }
  if (!clue.tell || clue.tellRevealed) {
    note(state, `${clue.title}: nothing more to read in it.`);
    return { state, events: [], error: null };
  }
  clue.tellRevealed = true;
  const event = emit(state, {
    kind: 'clue',
    text: `${player(state).name} looks twice at ${clue.title}. ${clue.tell}`,
    privateTo: state.playerId,
    clueId: clue.id,
    actorId: state.playerId,
  });
  addJournal(state, { kind: 'clue', title: `A tell: ${clue.title}`, text: clue.tell });
  note(state, clue.tell);
  return { state, events: [event], error: null };
}
