import { OATH_BY_ID } from './cast';
import { lanternQuestion } from './finale';
import { phaseHint } from './phases';
import { getContestant, player } from './state';
import type {
  Clue,
  Contestant,
  EndingState,
  Faction,
  JournalEntry,
  MatchState,
  Mission,
  NightState,
  Pact,
  Phase,
  PlayerOath,
  Role,
} from './types';
import { factionOf } from './types';

export interface ContestantView {
  id: string;
  name: string;
  isPlayer: boolean;
  alive: boolean;
  eliminatedOn: number | null;
  eliminatedBy: Contestant['eliminatedBy'];
  revealedRole: Role | null;
  embers: number;
  shields: number;
  personality: Contestant['personality'];
  socialTendency: string;
  /** Dossier facts that are public in the fiction. */
  tell: string;
}

export interface MissionView {
  id: string;
  title: string;
  family: Mission['family'];
  variant: number;
  objective: string;
  threshold: number;
  participants: string[];
  contributions: Record<string, number>;
  status: Mission['status'];
  success: boolean;
  resolvedText: string | null;
}

export interface ClueView {
  id: string;
  type: Clue['type'];
  title: string;
  body: string;
  room: Clue['room'];
  tell: string | null;
  tellRevealed: boolean;
}

export interface FinaleView {
  step: 'reckoning' | 'question' | 'vote' | 'reveal' | 'unmasking';
  round: 1 | 2;
  testimonies: { contestantId: string; text: string }[];
  answers: { contestantId: string; text: string }[];
  resultText: string;
  tiedIds: string[];
  eliminatedId: string | null;
  noElimination: 'tie' | 'zero' | null;
  question: string;
}

export interface CouncilView {
  step: 'speech' | 'vote' | 'reveal';
  round: 1 | 2;
  speeches: { speakerId: string; intent: string; targetId: string | null; text: string }[];
  votes: { voterId: string; targetId: string }[] | null;
  tally: { contestantId: string; votes: number }[] | null;
  tiedIds: string[];
  eliminatedId: string | null;
  noElimination: 'tie' | 'zero' | null;
  resultText: string;
}

export interface PublicMatchView {
  phase: Phase;
  round: number;
  lantern: number;
  lastMessage: string;
  outcome: Faction | null;
  contestants: ContestantView[];
  missions: MissionView[];
  council: CouncilView | null;
  nightNarration: string[];
  ledger: { round: number; reason: string; delta: number; after: number }[];
  rooms: { room: string; visited: boolean; archiveOpen: boolean; archiveDrained: boolean }[];
  ending: EndingState | null;
  isFinale: boolean;
  finale: FinaleView | null;
  phaseHint: string;
}

export interface PlayerView extends PublicMatchView {
  ownRole: Role;
  ownFaction: Faction;
  ownOath: PlayerOath | null;
  ownOathTitle: string | null;
  /** Only populated when the player is Shadowed. */
  shadowAllies: string[];
  /** Only populated when the player is Shadowed. */
  shadowObjectives: Record<string, string>;
  clues: ClueView[];
  claims: { id: string; speakerId: string; aboutId: string | null; text: string; night: number }[];
  journal: JournalEntry[];
  pacts: Pact[];
  intel: MatchState['playerIntel'];
  night: {
    canVeil: boolean;
    canSabotage: boolean;
    canRead: boolean;
    canWard: boolean;
    veilTarget: string | null;
    readTarget: string | null;
    readResult: Faction | null;
    wardTarget: string | null;
    proposals: { speakerId: string; targetId: string }[];
    narration: string[];
  } | null;
  isPlayerAlive: boolean;
  spectator: boolean;
  saveAllowed: boolean;
}

export function contestantView(contestant: Contestant): ContestantView {
  return {
    id: contestant.id,
    name: contestant.name,
    isPlayer: contestant.isPlayer,
    alive: contestant.alive,
    eliminatedOn: contestant.eliminatedOn,
    eliminatedBy: contestant.eliminatedBy,
    revealedRole: contestant.revealedRole,
    embers: contestant.embers,
    shields: contestant.shields,
    personality: contestant.personality,
    socialTendency: contestant.socialTendency,
    tell: contestant.tell,
  };
}

export function missionView(mission: Mission): MissionView {
  return {
    id: mission.id,
    title: mission.title,
    family: mission.family,
    variant: mission.variant,
    objective: mission.objective,
    threshold: mission.threshold,
    participants: [...mission.participants],
    contributions: { ...mission.contributions },
    status: mission.status,
    success: mission.success,
    resolvedText: mission.resolvedText,
  };
}

export function councilView(state: MatchState): CouncilView | null {
  const council = state.council;
  if (!council) return null;
  const revealed = council.step === 'reveal';
  return {
    step: council.step,
    round: council.round,
    speeches: council.speeches.map((speech) => ({
      speakerId: speech.speakerId,
      intent: speech.intent,
      targetId: speech.targetId,
      text: speech.text,
    })),
    votes: revealed && council.votes
      ? Object.entries(council.votes).map(([voterId, targetId]) => ({ voterId, targetId }))
      : null,
    tally: revealed && council.tally
      ? Object.entries(council.tally)
          .map(([contestantId, votes]) => ({ contestantId, votes }))
          .sort((a, b) => b.votes - a.votes)
      : null,
    tiedIds: [...council.tiedIds],
    eliminatedId: revealed ? council.eliminatedId : null,
    noElimination: revealed ? council.noElimination : null,
    resultText: revealed ? council.resultText : '',
  };
}

export function publicView(state: MatchState): PublicMatchView {
  return {
    phase: state.phase,
    round: state.round,
    lantern: state.lantern,
    lastMessage: state.lastMessage,
    outcome: state.outcome,
    contestants: state.contestants.map((contestant) => contestantView(contestant)),
    missions: state.missions.filter((mission) => mission.round === state.round).map(missionView),
    council: councilView(state),
    nightNarration: state.phase === 'judgment' || state.phase === 'dawn' ? (state.nightState?.narration ?? []) : [],
    ledger: state.ledger.map((entry) => ({
      round: entry.round,
      reason: entry.reason,
      delta: entry.delta,
      after: entry.after,
    })),
    rooms: state.rooms.map((room) => ({
      room: room.room,
      visited: room.visited,
      archiveOpen: room.archiveOpen,
      archiveDrained: room.archiveDrained,
    })),
    ending: state.phase === 'ending' ? state.ending : null,
    isFinale: state.phase === 'finale',
    finale: finaleView(state),
    phaseHint: phaseHint(state),
  };
}

function finaleView(state: MatchState): FinaleView | null {
  const finale = state.finaleState;
  if (!finale || state.phase !== 'finale') return null;
  return {
    step: finale.step,
    round: finale.round,
    testimonies: finale.testimonies.map((entry) => ({ ...entry })),
    answers: finale.answers.map((entry) => ({ ...entry })),
    resultText: finale.resultText,
    tiedIds: [...finale.tiedIds],
    eliminatedId: finale.eliminatedId,
    noElimination: finale.noElimination,
    question: lanternQuestion(state),
  };
}

function clueView(clue: Clue): ClueView {
  return {
    id: clue.id,
    type: clue.type,
    title: clue.title,
    body: clue.body,
    room: clue.room,
    tell: clue.tellRevealed ? clue.tell : null,
    tellRevealed: clue.tellRevealed,
  };
}

export function playerView(state: MatchState): PlayerView {
  const me = player(state);
  const isShadow = me.role === 'shadow';
  const night = state.phase === 'night' ? nightView(state) : null;
  const saveAllowed =
    me.alive && (state.phase === 'day' || state.phase === 'dusk' || state.phase === 'council');
  return {
    ...publicView(state),
    ownRole: me.role,
    ownFaction: factionOf(me.role),
    ownOath: me.oath,
    ownOathTitle: me.oath ? OATH_BY_ID[me.oath].title : null,
    shadowAllies: isShadow
      ? state.contestants.filter((entry) => entry.role === 'shadow' && entry.id !== me.id).map((entry) => entry.id)
      : [],
    shadowObjectives: isShadow
      ? Object.fromEntries(
          state.missions
            .filter((mission) => mission.round === state.round)
            .map((mission) => [mission.id, mission.shadowObjective]),
        )
      : {},
    clues: state.clues.filter((clue) => clue.discoveredBy.includes(me.id)).map(clueView),
    claims: state.claims
      .filter((claim) => claim.witnessedBy.includes(me.id))
      .map((claim) => ({
        id: claim.id,
        speakerId: claim.speakerId,
        aboutId: claim.aboutId,
        text: claim.text,
        night: claim.night,
      })),
    journal: [...state.journal],
    pacts: state.pacts.filter(
      (pact) => pact.a === me.id || pact.b === me.id || pact.revealed,
    ),
    intel: {
      reads: [...state.playerIntel.reads],
      wards: [...state.playerIntel.wards],
      channel: [...state.playerIntel.channel],
      notes: [...state.playerIntel.notes],
    },
    night,
    isPlayerAlive: me.alive,
    spectator: !me.alive && state.phase !== 'ending',
    saveAllowed,
  };
}

function nightView(state: MatchState): PlayerView['night'] {
  const me = player(state);
  const night = state.nightState;
  if (!night) return null;
  const canVeil = me.alive && me.role === 'shadow' && (state.round === 1 || state.round === 3 || state.round === 5);
  const canSabotage = me.alive && me.role === 'shadow' && state.round <= 5;
  const canRead = me.alive && me.role === 'keeper';
  const canWard = me.alive && me.role === 'warden';
  return {
    canVeil,
    canSabotage,
    canRead,
    canWard,
    veilTarget: canVeil ? night.veilTarget : null,
    readTarget: canRead ? night.readTarget : null,
    readResult: canRead ? night.readResult : null,
    wardTarget: canWard ? night.wardTarget : null,
    proposals: canVeil ? night.proposals : [],
    narration: [...night.narration],
  };
}

export function getClue(state: MatchState, clueId: string): Clue | null {
  return state.clues.find((clue) => clue.id === clueId) ?? null;
}

export function nameOf(state: MatchState, id: string): string {
  return getContestant(state, id)?.name ?? id;
}

export function nightIsPublic(state: MatchState): NightState | null {
  return state.phase === 'judgment' || state.phase === 'dawn' ? state.nightState : null;
}
