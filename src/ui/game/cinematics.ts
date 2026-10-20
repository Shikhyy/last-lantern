import type { GameEvent } from '@/game/types';
import type { PlayerView } from '@/game/views';
import type { RoomId } from '@/game/types';
import type { CameraShot } from '@/state/cinematicStore';

export type CueTone = 'arrival' | 'dawn' | 'day' | 'council' | 'night' | 'judgment' | 'evidence' | 'mission' | 'finale';

export interface CinematicCue {
  id: string;
  kicker: string;
  title: string;
  lines: string[];
  facts?: { label: string; value: string }[];
  room: RoomId;
  time: 'day' | 'night';
  tone: CueTone;
  shots: CameraShot[];
  continueLabel: string;
}

const shotsFor = (room: RoomId): CameraShot[] => {
  switch (room) {
    case 'gallery':
      return [
        { position: [1.2, 1.95, -12.6], target: [0.05, 2.15, -46], fov: 44, duration: 0 },
        { position: [-1.5, 1.9, -24], target: [0, 2.05, -42], fov: 50, duration: 5, ease: 'power2.inOut' },
      ];
    case 'archive':
      return [
        { position: [-19.4, 2.15, 4.4], target: [-27.2, 1.65, -1.6], fov: 42, duration: 0 },
        { position: [-22.4, 2.0, 2.4], target: [-27.2, 1.55, -1.9], fov: 46, duration: 5, ease: 'power2.inOut' },
      ];
    case 'council':
      return [
        { position: [15.2, 3.4, 4.6], target: [22.5, 1.0, -1.2], fov: 52, duration: 0 },
        { position: [17.2, 2.5, 4.9], target: [23.4, 1.2, -0.9], fov: 44, duration: 5, ease: 'power2.inOut' },
      ];
    default:
      return [
        { position: [-8.6, 4.4, 7.0], target: [0.0, 1.6, -0.4], fov: 46, duration: 0 },
        { position: [-2.8, 2.15, 4.2], target: [0.0, 1.65, 0], fov: 40, duration: 5, ease: 'power2.inOut' },
      ];
  }
};

const roleName = (view: PlayerView, id: string | null) => {
  const person = view.contestants.find((entry) => entry.id === id);
  return person?.name ?? 'Someone';
};

export function cueForAction(
  view: PlayerView,
  phaseBefore: string | null,
  events: GameEvent[],
): CinematicCue | null {
  if (view.phase === 'ending') return null;
  const relevant = (kind: GameEvent['kind']) => events.filter((event) => event.kind === kind);

  if (view.phase === 'judgment') {
    const revealed = view.contestants.filter((entry) => entry.revealedRole !== null);
    const fallen = revealed.filter((entry) => !entry.alive);
    const lines = [
      fallen.length
        ? `The flame reads ${fallen.map((entry) => `${entry.name} as ${entry.revealedRole === 'shadow' ? 'Shadowed' : 'Oathkeeper'}`).join('; ')}.`
        : 'No one is named this dawn. The table holds.',
      view.nightNarration.join(' '),
    ].filter(Boolean);
    return {
      id: `judgment-${view.round}`,
      kicker: `The Judgment · night ${view.round}`,
      title: view.outcome ? 'The palace has decided.' : 'The roles of the dead are read.',
      lines,
      facts: [
        { label: 'Lantern', value: String(view.lantern) },
        { label: 'Living', value: String(view.contestants.filter((entry) => entry.alive).length) },
      ],
      room: 'aangan',
      time: 'day',
      tone: 'judgment',
      shots: shotsFor('aangan'),
      continueLabel: view.outcome ? 'Read the last page' : 'Break the dawn',
    };
  }

  if (view.phase === 'dawn') {
    const dead = view.contestants.filter((entry) => !entry.alive);
    const lines = [
      view.nightNarration.join(' ') || 'The corridors give up nothing this morning.',
      dead.length
        ? `${dead.map((entry) => entry.name).join(', ')} ${dead.length === 1 ? 'is' : 'are'} not at breakfast.`
        : 'Every chair is filled. For now.',
    ];
    return {
      id: `dawn-${view.round}`,
      kicker: `Dawn ${view.round} · the Aangan`,
      title: 'Breakfast is laid. The chairs are counted.',
      lines,
      facts: [
        { label: 'Lantern', value: String(view.lantern) },
        { label: 'Living', value: String(view.contestants.filter((entry) => entry.alive).length) },
        { label: 'Pacts', value: String(view.pacts.filter((pact) => pact.status === 'active').length) },
      ],
      room: 'aangan',
      time: 'day',
      tone: 'dawn',
      shots: shotsFor('aangan'),
      continueLabel: 'Take the day',
    };
  }

  if (view.phase === 'night' && phaseBefore === 'council') {
    return {
      id: `night-${view.round}`,
      kicker: `Night ${view.round} · the palace sleeps`,
      title: 'The lamps are turned down, one by one.',
      lines: [
        view.ownRole === 'shadow'
          ? 'Your allies have left advice in the channel. The palace is listening for a hand on a latch.'
          : view.ownRole === 'keeper'
            ? 'The Keeper’s Read is a private door. No one will know you opened it.'
            : view.ownRole === 'warden'
              ? 'The ward is a small mercy. Set it before the Veil is drawn.'
              : 'You hold no night action. Wait, listen, and remember who is missing at dawn.',
        view.round === 1 || view.round === 3 || view.round === 5
          ? 'The Veil may be drawn tonight.'
          : 'No Veil is permitted tonight. The palace still has other ways of taking someone.',
      ],
      facts: [{ label: 'Shadowed', value: '3 began' }],
      room: 'aangan',
      time: 'night',
      tone: 'night',
      shots: shotsFor('aangan'),
      continueLabel: 'Enter the night',
    };
  }

  if (view.phase === 'day' && phaseBefore === 'dawn') {
    return {
      id: `day-${view.round}`,
      kicker: `Day ${view.round} · the work is posted`,
      title: 'The palace opens its rooms.',
      lines: [
        'Four rooms, four kinds of evidence. The work of the day is written on the board; the table will expect an account of it by dusk.',
      ],
      facts: view.missions.map((mission) => ({
        label: mission.title,
        value: `${mission.threshold} needed`,
      })),
      room: 'aangan',
      time: 'day',
      tone: 'day',
      shots: shotsFor('aangan'),
      continueLabel: 'Search, speak, promise',
    };
  }

  if (view.phase === 'council' && phaseBefore === 'dusk') {
    return {
      id: `council-${view.round}`,
      kicker: `Council · night ${view.round}`,
      title: 'The table is called.',
      lines: [
        'Every living contestant takes the floor once. Then the ballots are private, and locked together.',
        'A tie opens the Lantern’s Riddle. A second tie leaves no one banished.',
      ],
      facts: [
        { label: 'Living', value: String(view.contestants.filter((entry) => entry.alive).length) },
        { label: 'Ballots', value: 'Private until locked' },
      ],
      room: 'council',
      time: 'night',
      tone: 'council',
      shots: shotsFor('council'),
      continueLabel: 'Take the floor',
    };
  }

  if (view.phase === 'council' && view.council?.step === 'reveal') {
    const tally = view.council.tally ?? [];
    const named = view.council.eliminatedId
      ? view.contestants.find((entry) => entry.id === view.council?.eliminatedId)
      : null;
    return {
      id: `vote-${view.round}-${view.council.round}`,
      kicker: view.council.round === 2 ? 'The Lantern’s Riddle · the count' : 'The count',
      title: named ? `${named.name} is banished.` : 'No one is banished.',
      lines: [
        view.council.resultText,
        named
          ? 'The role is not read here. The Judgment of the Flame will read it after the night.'
          : 'The table keeps its seats, and the flame pays for the indecision.',
      ],
      facts: tally.slice(0, 4).map((entry) => ({
        label: roleName(view, entry.contestantId),
        value: `${entry.votes} ${entry.votes === 1 ? 'vote' : 'votes'}`,
      })),
      room: 'council',
      time: 'night',
      tone: 'council',
      shots: shotsFor('council'),
      continueLabel: 'Leave for the night',
    };
  }

  if (view.phase === 'finale') {
    const finale = view.finale;
    if (!finale) return null;
    const named = finale.eliminatedId
      ? view.contestants.find((entry) => entry.id === finale.eliminatedId)
      : null;
    const revealed = finale.step === 'reveal' && named;
    return {
      id: `finale-${finale.step}-${finale.round}`,
      kicker: 'The finale · the last question',
      title:
        finale.step === 'reckoning'
          ? 'The reckoning'
          : finale.step === 'question'
            ? 'The Lantern asks'
            : finale.step === 'vote'
              ? 'One name'
              : 'The last unmasking',
      lines: [
        finale.step === 'reckoning'
          ? 'Every living contestant gives a final testimony. Nothing said now can be taken back.'
          : finale.step === 'question'
            ? finale.question
            : finale.step === 'vote'
              ? 'The table names one person. The role will be read immediately.'
              : finale.resultText,
        revealed && named
          ? `${named.name} is ${named.revealedRole === 'shadow' ? 'Shadowed' : 'an Oathkeeper'}.`
          : '',
      ].filter(Boolean),
      facts: revealed && named
        ? [{ label: named.name, value: named.revealedRole === 'shadow' ? 'Shadowed' : 'Oathkeeper' }]
        : [{ label: 'Living', value: String(view.contestants.filter((entry) => entry.alive).length) }],
      room: 'council',
      time: 'night',
      tone: 'finale',
      shots: shotsFor('council'),
      continueLabel: finale.step === 'reveal' ? 'Unmask the court' : 'Continue',
    };
  }

  const clues = relevant('clue');
  if (clues.length > 0) {
    const clueViews = clues
      .map((event) => view.clues.find((clue) => clue.id === event.clueId))
      .filter((clue): clue is NonNullable<typeof clue> => Boolean(clue));
    if (clueViews.length > 0) {
      return {
        id: `clue-${clues[0].id}`,
        kicker: `Evidence · ${roomName(clueViews[0].room)}`,
        title: clueViews.length === 1 ? clueViews[0].title : 'Two things do not agree.',
        lines: clueViews.map((clue) => clue.body),
        facts: clueViews.map((clue) => ({
          label: clue.type,
          value: clue.tellRevealed ? 'A planted tell is exposed' : 'Unread',
        })),
        room: clueViews[0].room,
        time: 'day',
        tone: 'evidence',
        shots: shotsFor(clueViews[0].room),
        continueLabel: 'Enter it in the journal',
      };
    }
  }

  const missionEvents = [...relevant('mission'), ...relevant('sabotage')];
  if (missionEvents.length > 0) {
    const resolved = view.missions.find((mission) => mission.status === 'resolved');
    if (resolved) {
      return {
        id: `mission-${resolved.id}-${resolved.status}`,
        kicker: `The work · ${resolved.title}`,
        title: resolved.success ? 'The work holds.' : 'The work fails.',
        lines: [
          resolved.resolvedText ?? (resolved.success ? 'The palace accepts what was made.' : 'The palace pays for what was missed.'),
          resolved.success ? 'The Lantern takes the gain.' : 'The Lantern takes the loss.',
        ],
        facts: [
          { label: 'Threshold', value: String(resolved.threshold) },
          { label: 'Lantern', value: String(view.lantern) },
        ],
        room: 'aangan',
        time: 'night',
        tone: 'mission',
        shots: shotsFor('aangan'),
        continueLabel: 'Return to the table',
      };
    }
  }

  const speeches = relevant('councilSpeech');
  if (speeches.length > 0) {
    const speech = speeches[speeches.length - 1];
    return {
      id: `speech-${speech.id}`,
      kicker: 'The floor · your words',
      title: 'The room heard you.',
      lines: [speech.text, 'Every living contestant will answer in turn. The vote is still private.'],
      room: 'council',
      time: 'night',
      tone: 'council',
      shots: shotsFor('council'),
      continueLabel: 'Hear the room',
    };
  }

  return null;
}

function roomName(room: RoomId): string {
  switch (room) {
    case 'gallery':
      return 'The Long Gallery';
    case 'archive':
      return 'The Archive';
    case 'council':
      return 'The Council Chamber';
    default:
      return 'The Aangan';
  }
}
