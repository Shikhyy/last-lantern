/**
 * The Last Lantern — core domain types.
 *
 * Everything under `src/game` is pure and deterministic: no DOM, no React, no
 * `Math.random`, no `Date.now`. The engine is the only authority on hidden
 * truth (roles, clue truth states, night actions); UI code must consume the
 * projections in `views.ts`, never `MatchState` directly.
 */

export type Role = 'shadow' | 'keeper' | 'warden' | 'oathkeeper';
export type Faction = 'shadow' | 'oathkeeper';

export type Phase = 'dawn' | 'day' | 'dusk' | 'council' | 'night' | 'judgment' | 'finale' | 'ending';

export type RoomId = 'aangan' | 'gallery' | 'archive' | 'council';

export type Difficulty = 'easy' | 'normal' | 'hard';

export type TruthState = 'true' | 'false' | 'planted';

export type EvidenceType = 'physical' | 'documentary' | 'testimony' | 'timeline' | 'cipher';

export type PactTerm = 'voteWithMe' | 'shareInfo' | 'protect' | 'keepSecret' | 'silence';
export type PactStatus = 'proposed' | 'active' | 'kept' | 'broken' | 'refused' | 'expired';

export type ConversationIntent =
  | 'whereabouts'
  | 'opinion'
  | 'shareEvidence'
  | 'accuse'
  | 'defend'
  | 'confide'
  | 'pact'
  | 'deceive'
  | 'threaten'
  | 'console';

export type SpeechIntent = 'accuse' | 'defend' | 'present' | 'question' | 'silent';

export type MemoryProfile =
  | 'photographic'
  | 'social'
  | 'visual'
  | 'sensory'
  | 'spatial'
  | 'procedural'
  | 'melodic'
  | 'numeric'
  | 'taxonomic'
  | 'ecological'
  | 'quote';

export type PlayerOath =
  | 'keep_promise'
  | 'ask_before_accuse'
  | 'watch_room'
  | 'speak_last'
  | 'owe_no_one'
  | 'remember_everything';

export type EndingId =
  | 'keeper_of_the_flame'
  | 'quiet_steward'
  | 'shadows_lantern'
  | 'gilded_betrayal'
  | 'long_dark'
  | 'unlit_oath';

export interface Personality {
  warmth: number;
  candor: number;
  nerve: number;
  guile: number;
  composure: number;
  curiosity: number;
}

export interface CastMember {
  characterId: string;
  name: string;
  age: number;
  city: string;
  personality: Personality;
  memoryProfile: MemoryProfile;
  motive: string;
  secret: string;
  socialTendency: string;
  voice: string;
  tell: string;
}

export interface Contestant {
  id: string;
  characterId: string;
  name: string;
  isPlayer: boolean;
  pronouns: string;
  role: Role;
  alive: boolean;
  eliminatedOn: number | null;
  eliminatedBy: 'council' | 'veil' | 'finale' | 'darkness' | null;
  /** Set only when the Judgment of the Flame has publicly revealed this role. */
  revealedRole: Role | null;
  embers: number;
  shields: number;
  personality: Personality;
  memoryProfile: MemoryProfile;
  motive: string;
  secret: string;
  socialTendency: string;
  voice: string;
  tell: string;
  oath: PlayerOath | null;
  /** Warden bookkeeping: last person this contestant warded. */
  lastWardTarget: string | null;
  /** How many testimonies this contestant has given (finale). */
  testimonies: number;
}

export interface Clue {
  id: string;
  templateId: string;
  type: EvidenceType;
  title: string;
  body: string;
  room: RoomId;
  requires: 'none' | 'archive-open' | 'archive-drained';
  truth: TruthState;
  /** Engine-only weighting. Never rendered as a role label. */
  pointsTo: string | null;
  pointsAwayFrom: string | null;
  weight: number;
  tell: string | null;
  /** Id of another clue that exposes this clue's planted tell. */
  tellOf: string | null;
  discoveredBy: string[];
  tellRevealed: boolean;
  roundPlaced: number;
}

export interface KnownClaim {
  id: string;
  speakerId: string;
  aboutId: string | null;
  topic: 'whereabouts' | 'role' | 'deed' | 'testimony';
  text: string;
  night: number;
  credibility: number;
}

export interface Claim {
  id: string;
  speakerId: string;
  aboutId: string | null;
  topic: 'whereabouts' | 'role' | 'deed' | 'testimony';
  text: string;
  /** Engine truth. Never copied into AI knowledge. */
  truth: TruthState;
  night: number;
  phase: Phase;
  clueId: string | null;
  /** Everyone who heard the statement in the fiction. */
  witnessedBy: string[];
}

export interface MemoryEntry {
  id: string;
  night: number;
  kind: 'observation' | 'testimony' | 'betrayal' | 'kindness' | 'pact' | 'clue' | 'contradiction';
  text: string;
  importance: number;
  weight: number;
  subjectId: string | null;
  highEmotion: boolean;
}

export interface Relationship {
  trust: number;
  affinity: number;
  fear: number;
  debt: number;
}

export interface ReadResult {
  targetId: string;
  faction: Faction;
  night: number;
}

export interface ChannelMessage {
  id: string;
  night: number;
  speakerId: string;
  kind: 'veil' | 'sabotage' | 'cover' | 'note';
  targetId: string | null;
  text: string;
}

export interface AiKnowledge {
  ownerId: string;
  suspicion: Record<string, number>;
  relationships: Record<string, Relationship>;
  claims: KnownClaim[];
  seenEventIds: string[];
  memories: MemoryEntry[];
  readResults: ReadResult[];
  wardTargets: { targetId: string; night: number }[];
  wardBlockedNights: number[];
  /** Populated only for Shadowed contestants. */
  shadowAllies: string[];
  /** Populated only for Shadowed contestants. */
  channel: ChannelMessage[];
  evidenceSeen: string[];
  /** Accuracy of each speaker, as this contestant has experienced it. */
  credibility: Record<string, number>;
}

export interface KnowledgeDelta {
  observerId: string;
  targetId: string;
  field: 'suspicion' | 'trust' | 'affinity' | 'fear' | 'debt' | 'memory';
  from: number;
  to: number;
  eventId: string;
  night: number;
}

export type EventKind =
  | 'phase'
  | 'dawnTick'
  | 'mission'
  | 'clue'
  | 'conversation'
  | 'pact'
  | 'councilSpeech'
  | 'vote'
  | 'shield'
  | 'elimination'
  | 'veil'
  | 'ward'
  | 'read'
  | 'sabotage'
  | 'judgment'
  | 'finale'
  | 'lantern'
  | 'note';

export interface GameEvent {
  id: string;
  round: number;
  phase: Phase;
  kind: EventKind;
  actorId: string | null;
  subjectId: string | null;
  text: string;
  /** Everyone present for this event. The fairness audit reads this field. */
  witnessedBy: string[];
  privateTo: string | null;
  amount: number | null;
  clueId: string | null;
}

export interface LedgerEntry {
  id: string;
  round: number;
  reason: string;
  delta: number;
  before: number;
  after: number;
  eventId: string;
}

export interface JournalEntry {
  id: string;
  round: number;
  phase: Phase;
  kind: 'roster' | 'clue' | 'claim' | 'vote' | 'pact' | 'night' | 'note' | 'mission';
  title: string;
  text: string;
}

export interface Mission {
  id: string;
  family: 'archive-ledger' | 'gallery-mirrors' | 'cistern-locks';
  variant: number;
  title: string;
  objective: string;
  shadowObjective: string;
  reward: { lantern: number; embers: number; leadShield: boolean };
  failure: { lantern: number };
  threshold: number;
  round: number;
  participants: string[];
  contributions: Record<string, number>;
  sabotagedBy: string | null;
  status: 'open' | 'resolved';
  success: boolean;
  tellClueId: string | null;
  resolvedText: string | null;
}

export interface Pact {
  id: string;
  /** The proposer. `voteWithMe` binds b to a's vote. */
  a: string;
  b: string;
  term: PactTerm;
  round: number;
  expiresRound: number;
  status: PactStatus;
  brokenBy: string | null;
  /** Public only after it is used or revealed. */
  revealed: boolean;
}

export interface Speech {
  speakerId: string;
  intent: SpeechIntent;
  targetId: string | null;
  clueId: string | null;
  text: string;
}

export interface CouncilState {
  step: 'speech' | 'vote' | 'reveal';
  round: 1 | 2;
  speeches: Speech[];
  floor: string[];
  playerSpoken: boolean;
  /** AI votes are fixed before the player's vote is locked. */
  aiVotes: Record<string, string>;
  playerVote: string | null;
  votes: Record<string, string> | null;
  tally: Record<string, number> | null;
  shieldsSpent: Record<string, number>;
  playerShieldPending: boolean;
  eliminatedId: string | null;
  noElimination: 'tie' | 'zero' | null;
  tiedIds: string[];
  resultText: string;
}

export interface NightState {
  /** Veil target chosen by the Shadowed (player or AI). */
  veilTarget: string | null;
  veilBlocked: boolean;
  /** Sabotage id, or null. */
  sabotage: string | null;
  readTarget: string | null;
  readResult: Faction | null;
  wardTarget: string | null;
  proposals: { speakerId: string; targetId: string }[];
  resolved: boolean;
  /** Narrow public narration for the Dawn, with no hidden names. */
  narration: string[];
}

export interface FinaleState {
  step: 'reckoning' | 'question' | 'vote' | 'reveal' | 'unmasking';
  testimonies: { contestantId: string; text: string }[];
  answers: { contestantId: string; text: string }[];
  round: 1 | 2;
  votes: Record<string, string> | null;
  tally: Record<string, number> | null;
  shieldsSpent: Record<string, number>;
  eliminatedId: string | null;
  tiedIds: string[];
  noElimination: 'tie' | 'zero' | null;
  resultText: string;
}

export interface EndingState {
  id: EndingId;
  title: string;
  faction: Faction;
  epilogue: string;
  playerSurvived: boolean;
  pactsKept: number;
  pactsBroken: number;
  unmasking: {
    roles: { contestantId: string; name: string; role: Role; alive: boolean }[];
    votes: { round: number; voterId: string; targetId: string }[];
    pacts: { a: string; b: string; term: PactTerm; status: PactStatus }[];
    lies: { speakerId: string; text: string }[];
    decisions: string[];
  };
}

export interface RoomState {
  room: RoomId;
  visited: boolean;
  archiveOpen: boolean;
  archiveDrained: boolean;
}

export interface PlayerIntel {
  reads: ReadResult[];
  wards: { targetId: string; night: number }[];
  channel: ChannelMessage[];
  notes: { round: number; to: string; text: string }[];
}

export interface MatchState {
  schemaVersion: number;
  seed: number;
  rngState: number;
  nextId: number;
  phase: Phase;
  round: number;
  playerId: string;
  playerIntel: PlayerIntel;
  contestants: Contestant[];
  knowledge: Record<string, AiKnowledge>;
  clues: Clue[];
  claims: Claim[];
  missions: Mission[];
  pacts: Pact[];
  council: CouncilState | null;
  nightState: NightState | null;
  finaleState: FinaleState | null;
  lantern: number;
  ledger: LedgerEntry[];
  events: GameEvent[];
  journal: JournalEntry[];
  voteHistory: { round: number; ballot: number; voterId: string; targetId: string }[];
  knowledgeLog: KnowledgeDelta[];
  rooms: RoomState[];
  currentRoom: RoomId;
  alibis: { contestantId: string; round: number; place: string; truthful: boolean }[];
  pendingPenalty: { thresholdBonus: number; rewardPenalty: number };
  lastDawnTick: number;
  ending: EndingState | null;
  outcome: Faction | null;
  difficulty: Difficulty;
  settings: { fullyRandom: boolean; untimedDay: boolean; guided: boolean };
  /** The character/role pairing from the previous match on this save. */
  antiRepeat: Record<string, Role>;
  /** Player-facing one-line summary of the last action. */
  lastMessage: string;
}

export interface MatchOptions {
  seed: number;
  playerName: string;
  pronouns: string;
  oath: PlayerOath;
  difficulty: Difficulty;
  antiRepeat?: Record<string, Role>;
  fullyRandom?: boolean;
}

export interface ActionResult {
  state: MatchState;
  events: GameEvent[];
  error: string | null;
}

export type GameAction =
  | { type: 'ADVANCE' }
  | { type: 'EXPLORE'; room: RoomId }
  | { type: 'EXAMINE'; clueId: string }
  | { type: 'CONTRIBUTE'; missionId: string }
  | { type: 'RESOLVE_MISSION'; missionId: string }
  | { type: 'SABOTAGE'; missionId: string }
  | { type: 'CONVERSE'; targetId: string; intent: ConversationIntent; subjectId?: string; clueId?: string; text?: string }
  | { type: 'PROPOSE_PACT'; targetId: string; term: PactTerm }
  | { type: 'SPEECH'; intent: SpeechIntent; targetId?: string; clueId?: string }
  | { type: 'VOTE'; targetId: string }
  | { type: 'SPEND_SHIELD' }
  | { type: 'RIDDLE_VOTE'; targetId: string }
  | { type: 'NIGHT_ACTION'; veilTarget?: string; sabotage?: string; readTarget?: string; wardTarget?: string }
  | { type: 'FINAL_TESTIMONY'; text: string }
  | { type: 'FINAL_ANSWER'; text: string }
  | { type: 'FINAL_VOTE'; targetId: string }
  | { type: 'SET_ROOM'; room: RoomId };

export interface SaveEnvelope {
  version: number;
  savedAt: number;
  checksum: string;
  state: MatchState;
}

export interface LoadResult {
  status: 'ok' | 'corrupt';
  state: MatchState | null;
  raw: string | null;
  reason: string | null;
}

export const SCHEMA_VERSION = 1;
export const STARTING_LANTERN = 100;
export const MAX_LANTERN = 120;
export const ROLE_COUNTS: Record<Role, number> = { shadow: 3, keeper: 1, warden: 1, oathkeeper: 7 };
export const SHIELD_COST = 3;
export const MAX_SHIELDS = 2;
export const VEIL_NIGHTS = [1, 3, 5] as const;

export function factionOf(role: Role): Faction {
  return role === 'shadow' ? 'shadow' : 'oathkeeper';
}

export function isFaithful(role: Role): boolean {
  return role !== 'shadow';
}

export const ROLE_LABEL: Record<Role, string> = {
  shadow: 'Shadowed',
  keeper: 'Lantern Keeper',
  warden: 'Warden',
  oathkeeper: 'Oathkeeper',
};
