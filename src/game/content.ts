import type { Clue, EvidenceType, Mission, RoomId } from './types';

export interface ClueTemplate {
  id: string;
  type: EvidenceType;
  title: string;
  room: RoomId;
  requires: Clue['requires'];
  body: (suspect: string, cleared: string) => string;
  weight: number;
  planted?: boolean;
  tell?: string;
}

/**
 * Authored clue pool. Bodies name a *person*, never a faction — the engine
 * binding (`pointsTo`) is what carries suspicion weight, and it is never shown.
 */
export const CLUE_TEMPLATES: ClueTemplate[] = [
  {
    id: 'cut-seal',
    type: 'documentary',
    title: 'The cut seal',
    room: 'archive',
    requires: 'none',
    body: (suspect, cleared) =>
      `The wax seal on the archive door has been cut in one clean stroke. The blade was narrow. ${suspect} carried a paper knife at the oath; ${cleared} was at the fountain when the second bell rang.`,
    weight: 0.26,
  },
  {
    id: 'grease-valve',
    type: 'physical',
    title: 'Fresh grease on the fourth valve',
    room: 'archive',
    requires: 'archive-drained',
    body: (suspect, cleared) =>
      `The collar of the fourth valve is slick with fresh grease. Whoever opened it knew the cistern. ${suspect} spoke of the lower levels before anyone had been shown them; ${cleared} has not left the gallery all day.`,
    weight: 0.3,
  },
  {
    id: 'indigo-thread',
    type: 'physical',
    title: 'Indigo thread on the mirror frame',
    room: 'gallery',
    requires: 'none',
    body: (suspect, cleared) =>
      `A thread of indigo silk is caught on the mirror frame at hip height. ${suspect} wears that indigo. ${cleared} was in pale linen at the ceremony.`,
    weight: 0.24,
  },
  {
    id: 'scraped-name',
    type: 'documentary',
    title: 'A name scraped from the guest list',
    room: 'archive',
    requires: 'archive-open',
    body: (suspect, cleared) =>
      `A name has been scraped from the guest list with a thumbnail; the paper beneath is fresh. ${suspect} asked twice about that list. ${cleared} cannot read the court hand.`,
    weight: 0.27,
  },
  {
    id: 'second-bell',
    type: 'timeline',
    title: 'The second bell',
    room: 'aangan',
    requires: 'none',
    body: (suspect, cleared) =>
      `At the second bell the arcade stood empty but for two people. ${suspect} came in from the north corridor, out of breath. ${cleared} was already seated, in view of the whole courtyard.`,
    weight: 0.25,
  },
  {
    id: 'burnt-letter',
    type: 'documentary',
    title: 'A letter burned to the signature',
    room: 'archive',
    requires: 'archive-open',
    body: (suspect, cleared) =>
      `A letter burned down to its signature. The hand matches the palace ledger, and the ash is still warm. ${suspect} was seen near the archive with a candle. ${cleared} was on the terrace.`,
    weight: 0.28,
  },
  {
    id: 'missing-page',
    type: 'documentary',
    title: 'The missing ledger page',
    room: 'archive',
    requires: 'archive-open',
    body: (suspect, cleared) =>
      `A page has been removed from the store ledger: a clean cut, no tear. ${suspect} handles paper the way a surgeon handles a knife. ${cleared} asked for the volume and returned it sealed.`,
    weight: 0.29,
  },
  {
    id: 'salt-trail',
    type: 'physical',
    title: 'Salt across the courtyard',
    room: 'aangan',
    requires: 'none',
    body: (suspect, cleared) =>
      `A trail of salt runs from the fountain to the north stair, as if something wet had been carried through. ${suspect}'s sandals are still dark. ${cleared}'s were dry at the bell.`,
    weight: 0.22,
  },
  {
    id: 'cipher-mark',
    type: 'cipher',
    title: 'The cipher on the valve housing',
    room: 'archive',
    requires: 'archive-drained',
    body: (suspect, cleared) =>
      `A cipher is cut into the valve housing: a flame with a line through it. ${suspect} wore the same mark on a ring. ${cleared} asked what it meant.`,
    weight: 0.31,
  },
  {
    id: 'wet-footprint',
    type: 'physical',
    title: 'A wet footprint under the jali',
    room: 'gallery',
    requires: 'none',
    body: (suspect, cleared) =>
      `A wet footprint lies under the jali, toes toward the archive. The print is narrow, a court shoe. ${suspect} wears one. ${cleared} was in the cistern court.`,
    weight: 0.23,
  },
  {
    id: 'planted-ink',
    type: 'documentary',
    title: 'A note in fresh ink',
    room: 'archive',
    requires: 'archive-open',
    body: (suspect, cleared) =>
      `A note names ${suspect} as the last person in the archive. The ink is newer than the paper and smells faintly of the kitchen. ${cleared} was in the council chamber.`,
    weight: 0.2,
    planted: true,
    tell: 'The ink is fresher than the folds — the note was written after the seal was cut.',
  },
  {
    id: 'testimony-slip',
    type: 'testimony',
    title: 'A torn slip under the council table',
    room: 'council',
    requires: 'none',
    body: (suspect, cleared) =>
      `Under the council table, a torn slip in ${suspect}'s hand: “the flame first, the oath after.” ${cleared} dropped nothing at the table.`,
    weight: 0.26,
  },
];

export interface MissionDefinition {
  family: Mission['family'];
  variant: number;
  title: string;
  objective: string;
  shadowObjective: string;
  reward: { lantern: number; embers: number; leadShield: boolean };
  failure: { lantern: number };
  threshold: number;
}

export const MISSION_DEFINITIONS: MissionDefinition[] = [
  {
    family: 'archive-ledger',
    variant: 1,
    title: 'The Archive Ledger',
    objective: 'Reconstruct the torn ledger of palace stores before the seal is set.',
    shadowObjective: 'Quietly withhold one true fragment before the ledger is sealed.',
    reward: { lantern: 10, embers: 1, leadShield: false },
    failure: { lantern: 0 },
    threshold: 6,
  },
  {
    family: 'archive-ledger',
    variant: 2,
    title: 'The Store Ledger, Second Hand',
    objective: 'Match the grain tallies to the caravan manifests without losing a page.',
    shadowObjective: 'Slip a false entry into the record and let the room defend it.',
    reward: { lantern: 12, embers: 1, leadShield: false },
    failure: { lantern: 0 },
    threshold: 6,
  },
  {
    family: 'archive-ledger',
    variant: 3,
    title: 'The Sealed Inventory',
    objective: 'Read the sealed inventory aloud and reconcile it with the storeroom.',
    shadowObjective: 'Break the seal early and blame the draught.',
    reward: { lantern: 10, embers: 1, leadShield: false },
    failure: { lantern: 0 },
    threshold: 7,
  },
  {
    family: 'gallery-mirrors',
    variant: 1,
    title: 'The Gallery of Mirrors',
    objective: 'Align three mirror assemblies and the jali shutter to reveal the inscription.',
    shadowObjective: 'Tilt one mirror toward a planted inscription of your own.',
    reward: { lantern: 15, embers: 1, leadShield: false },
    failure: { lantern: 0 },
    threshold: 7,
  },
  {
    family: 'gallery-mirrors',
    variant: 2,
    title: 'The Second Inscription',
    objective: 'Hold the mirrors steady while the far wall is read aloud.',
    shadowObjective: 'Let the light burn the true inscription and keep the false one.',
    reward: { lantern: 15, embers: 1, leadShield: false },
    failure: { lantern: 0 },
    threshold: 7,
  },
  {
    family: 'gallery-mirrors',
    variant: 3,
    title: 'The Mirror Bay',
    objective: 'Find the bay’s true bearing from the shadows the jali throws.',
    shadowObjective: 'Move the shutter a hand’s width and let the room misread the light.',
    reward: { lantern: 18, embers: 2, leadShield: false },
    failure: { lantern: 0 },
    threshold: 8,
  },
  {
    family: 'cistern-locks',
    variant: 1,
    title: 'The Cistern Locks',
    objective: 'Balance the three locks before the reservoir overflows.',
    shadowObjective: 'Open the hidden fourth valve and let the lower archive take the water.',
    reward: { lantern: 20, embers: 1, leadShield: true },
    failure: { lantern: -10 },
    threshold: 8,
  },
  {
    family: 'cistern-locks',
    variant: 2,
    title: 'The Reservoir at Dusk',
    objective: 'Hold the pressure while the valves are turned blind.',
    shadowObjective: 'Drain the reservoir and call it a fault in the old stone.',
    reward: { lantern: 20, embers: 1, leadShield: true },
    failure: { lantern: -10 },
    threshold: 8,
  },
  {
    family: 'cistern-locks',
    variant: 3,
    title: 'The Lower Archive',
    objective: 'Pump the flooded stair dry without cracking the vault.',
    shadowObjective: 'Leave the hidden valve open and let one clue drown.',
    reward: { lantern: 22, embers: 2, leadShield: true },
    failure: { lantern: -10 },
    threshold: 9,
  },
];

export const SABOTAGES = [
  { id: 'mirror-tilt', label: 'Tilt a mirror', text: 'A mirror is tilted a hand’s width out of true.' },
  { id: 'ledger-fragment', label: 'Withhold a ledger fragment', text: 'One fragment of the ledger is quietly pocketed.' },
  { id: 'valve-open', label: 'Open the hidden valve', text: 'The fourth valve is opened; water climbs the lower stair.' },
  { id: 'lamp-smoke', label: 'Smoke the lamps', text: 'Oil is poured on a lamp wick; the room fills with smoke.' },
  { id: 'door-bar', label: 'Bar a door', text: 'A door is barred from the outside, costing the room minutes.' },
] as const;

export type SabotageId = (typeof SABOTAGES)[number]['id'];
