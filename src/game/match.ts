import { CAST, castMember } from './cast';
import { CLUE_TEMPLATES, MISSION_DEFINITIONS } from './content';
import { Rng } from './rng';
import { assignRoles } from './roles';
import { addJournal, emit, getContestant } from './state';
import {
  SCHEMA_VERSION,
  STARTING_LANTERN,
  type AiKnowledge,
  type Clue,
  type Contestant,
  type MatchOptions,
  type MatchState,
  type Mission,
  type Relationship,
  type Role,
} from './types';

export const AI_SEATS = 11;
export const TOTAL_SEATS = AI_SEATS + 1;

const ALIBI_PLACES = [
  'the kitchen court',
  'the north terrace',
  'the mirror bay',
  'the lower stair',
  'the archive court',
  'the fountain',
  'the gatehouse',
  'the long gallery',
  'the council antechamber',
];

/** Private first-night accounts. Some are false; the engine records the truth. */
export function placeAlibis(contestants: Contestant[], rng: Rng) {
  const alibis: MatchState['alibis'] = [];
  for (const contestant of contestants) {
    if (contestant.isPlayer) continue;
    for (let round = 1; round <= 5; round += 1) {
      const truthful = contestant.role !== 'shadow' || rng.chance(0.55);
      alibis.push({ contestantId: contestant.id, round, place: rng.pick(ALIBI_PLACES), truthful });
    }
  }
  return alibis;
}

function emptyKnowledge(ownerId: string, peers: string[]): AiKnowledge {
  const relationships: Record<string, Relationship> = {};
  for (const peer of peers) {
    relationships[peer] = { trust: 0, affinity: 0, fear: 0, debt: 0 };
  }
  return {
    ownerId,
    suspicion: {},
    relationships,
    claims: [],
    seenEventIds: [],
    memories: [],
    readResults: [],
    wardTargets: [],
    wardBlockedNights: [],
    shadowAllies: [],
    channel: [],
    evidenceSeen: [],
    credibility: {},
  };
}

export function createMatch(options: MatchOptions): MatchState {
  const seed = (options.seed >>> 0) || 0x5eed;
  const rng = new Rng(seed);
  const seats = CAST.map((member, index) => ({ id: `c${index + 1}`, characterId: member.characterId }));
  seats.push({ id: 'player', characterId: 'player' });
  const assignment = assignRoles(rng, seats, options.antiRepeat ?? {}, options.fullyRandom ?? false);

  const contestants: Contestant[] = [];
  for (const seat of seats) {
    if (seat.id === 'player') {
      contestants.push({
        id: 'player',
        characterId: 'player',
        name: options.playerName.trim() || 'The Stranger',
        isPlayer: true,
        pronouns: options.pronouns || 'they/them',
        role: assignment[seat.id],
        alive: true,
        eliminatedOn: null,
        eliminatedBy: null,
        revealedRole: null,
        embers: 0,
        shields: 0,
        personality: { warmth: 50, candor: 50, nerve: 50, guile: 50, composure: 50, curiosity: 50 },
        memoryProfile: 'photographic',
        motive: 'To leave Nimbagarh with an oath still worth keeping.',
        secret: 'You have never told anyone why you accepted the invitation.',
        socialTendency: 'The room has not decided what you are yet.',
        voice: 'Your own.',
        tell: 'None that you know of.',
        oath: options.oath,
        lastWardTarget: null,
        testimonies: 0,
      });
      continue;
    }
    const member = castMember(seat.characterId);
    contestants.push({
      id: seat.id,
      characterId: seat.characterId,
      name: member.name,
      isPlayer: false,
      pronouns: 'they/them',
      role: assignment[seat.id],
      alive: true,
      eliminatedOn: null,
      eliminatedBy: null,
      revealedRole: null,
      embers: 0,
      shields: 0,
      personality: member.personality,
      memoryProfile: member.memoryProfile,
      motive: member.motive,
      secret: member.secret,
      socialTendency: member.socialTendency,
      voice: member.voice,
      tell: member.tell,
      oath: null,
      lastWardTarget: null,
      testimonies: 0,
    });
  }

  const ids = contestants.map((entry) => entry.id);
  const knowledge: Record<string, AiKnowledge> = {};
  for (const contestant of contestants) {
    if (contestant.isPlayer) continue;
    const graph = emptyKnowledge(contestant.id, ids.filter((id) => id !== contestant.id));
    for (const peer of ids) {
      if (peer === contestant.id) continue;
      const personality = contestant.personality;
      graph.suspicion[peer] = Math.max(
        0.02,
        Math.min(0.5, 0.18 + rng.between(-0.04, 0.08) + (50 - personality.candor) / 900),
      );
      graph.relationships[peer] = {
        trust: rng.between(-4, 4),
        affinity: (personality.warmth - 50) / 18 + rng.between(-6, 6),
        fear: 0,
        debt: 0,
      };
    }
    knowledge[contestant.id] = graph;
  }

  const alibis = placeAlibis(contestants, rng);
  const shadows = contestants.filter((entry) => entry.role === 'shadow').map((entry) => entry.id);
  for (const shadowId of shadows) {
    const graph = knowledge[shadowId];
    if (!graph) continue;
    graph.shadowAllies = shadows.filter((id) => id !== shadowId);
    for (const ally of graph.shadowAllies) graph.suspicion[ally] = 0.02;
  }

  const state: MatchState = {
    schemaVersion: SCHEMA_VERSION,
    seed,
    rngState: rng.state,
    nextId: 1,
    phase: 'dawn',
    round: 1,
    playerId: 'player',
    playerIntel: { reads: [], wards: [], channel: [], notes: [] },
    contestants,
    knowledge,
    clues: [],
    claims: [],
    missions: [],
    pacts: [],
    boardLinks: [],
    council: null,
    nightState: null,
    finaleState: null,
    lantern: STARTING_LANTERN,
    ledger: [],
    events: [],
    journal: [],
    voteHistory: [],
    knowledgeLog: [],
    rooms: [
      { room: 'aangan', visited: false, archiveOpen: false, archiveDrained: false },
      { room: 'gallery', visited: false, archiveOpen: false, archiveDrained: false },
      { room: 'archive', visited: false, archiveOpen: false, archiveDrained: false },
      { room: 'council', visited: false, archiveOpen: false, archiveDrained: false },
    ],
    currentRoom: 'aangan',
    alibis,
    pendingPenalty: { thresholdBonus: 0, rewardPenalty: 0 },
    lastDawnTick: 1,
    ending: null,
    outcome: null,
    difficulty: options.difficulty,
    settings: { fullyRandom: options.fullyRandom ?? false, untimedDay: false, guided: false },
    antiRepeat: Object.fromEntries(
      contestants.map((entry) => [entry.characterId, entry.role as Role]),
    ),
    lastMessage: 'Dawn 1. The Last Lantern is lit.',
  };

  const opening = emit(state, {
    kind: 'phase',
    text: 'Dawn 1. Twelve oaths are sworn in the Aangan; the Last Lantern is lit at one hundred.',
  });
  changeLanternAtStart(state, opening.id);
  state.clues = placeClues(state, rng);
  state.rngState = rng.state;

  addJournal(state, {
    kind: 'roster',
    title: 'The twelve',
    text: contestants.map((entry) => entry.name).join(' · '),
  });

  return state;
}

function changeLanternAtStart(state: MatchState, eventId: string): void {
  state.ledger.push({
    id: `l${state.nextId}`,
    round: state.round,
    reason: 'The Last Lantern is lit',
    delta: 0,
    before: STARTING_LANTERN,
    after: STARTING_LANTERN,
    eventId,
  });
  state.nextId += 1;
  state.lantern = STARTING_LANTERN;
}

/**
 * Places ten authored clues across five nights. Each night receives at least
 * one true clue bound to a Shadowed and away from an Oathkeeper. One planted
 * red herring is added at Night 3 and carries a discoverable tell.
 */
export function placeClues(state: MatchState, rng: Rng): Clue[] {
  const shadows = state.contestants.filter((entry) => entry.role === 'shadow').map((entry) => entry.id);
  const faithfuls = state.contestants.filter((entry) => entry.role !== 'shadow').map((entry) => entry.id);
  const pool = rng.shuffle(CLUE_TEMPLATES.filter((template) => !template.planted));
  const clues: Clue[] = [];
  let cursor = 0;
  for (let round = 1; round <= 5; round += 1) {
    for (let slot = 0; slot < 2; slot += 1) {
      const template = pool[cursor % pool.length];
      cursor += 1;
      const suspect = rng.pick(shadows);
      const cleared = rng.pick(faithfuls.filter((id) => id !== suspect));
      clues.push(buildClue(state, template, suspect, cleared, round));
    }
  }
  const plantedTemplate = CLUE_TEMPLATES.find((template) => template.planted);
  if (plantedTemplate) {
    const suspect = rng.pick(faithfuls);
    const cleared = rng.pick(shadows);
    const planted = buildClue(state, plantedTemplate, suspect, cleared, 3);
    planted.tellOf = 'planted-ink';
    clues.push(planted);
  }
  return clues.sort((a, b) => a.roundPlaced - b.roundPlaced);
}

function buildClue(
  state: MatchState,
  template: (typeof CLUE_TEMPLATES)[number],
  suspectId: string,
  clearedId: string,
  round: number,
): Clue {
  const suspect = getContestant(state, suspectId);
  const cleared = getContestant(state, clearedId);
  const id = `cl${state.nextId}`;
  state.nextId += 1;
  return {
    id,
    templateId: template.id,
    type: template.type,
    title: template.title,
    body: template.body(suspect.name, cleared.name),
    room: template.room,
    requires: template.requires,
    truth: template.planted ? 'planted' : 'true',
    pointsTo: suspectId,
    pointsAwayFrom: clearedId,
    weight: template.weight,
    tell: template.tell ?? null,
    tellOf: null,
    discoveredBy: [],
    tellRevealed: false,
    roundPlaced: round,
  };
}

/** Creates the day's two missions and applies the AI contributions. */
export function ensureMissions(state: MatchState, rng: Rng): Mission[] {
  const existing = state.missions.filter((mission) => mission.round === state.round);
  if (existing.length > 0) return existing;
  const used = new Set(state.missions.map((mission) => `${mission.family}:${mission.variant}`));
  const available = MISSION_DEFINITIONS.filter((definition) => !used.has(`${definition.family}:${definition.variant}`));
  const pool = available.length >= 2 ? available : MISSION_DEFINITIONS;
  const picks = rng.shuffle(pool).slice(0, 2);
  const created: Mission[] = picks.map((definition) => {
    const id = `mi${state.nextId}`;
    state.nextId += 1;
    const participants = state.contestants.filter((entry) => entry.alive).map((entry) => entry.id);
    const contributions: Record<string, number> = {};
    for (const participant of participants) contributions[participant] = 0;
    return {
      id,
      family: definition.family,
      variant: definition.variant,
      title: definition.title,
      objective: definition.objective,
      shadowObjective: definition.shadowObjective,
      reward: {
        ...definition.reward,
        lantern: Math.max(0, definition.reward.lantern - state.pendingPenalty.rewardPenalty),
      },
      failure: { ...definition.failure },
      threshold: definition.threshold + state.pendingPenalty.thresholdBonus,
      round: state.round,
      participants,
      contributions,
      sabotagedBy: null,
      status: 'open',
      success: false,
      tellClueId: null,
      resolvedText: null,
    };
  });

  for (const mission of created) {
    for (const contestant of state.contestants) {
      if (!contestant.alive || contestant.isPlayer) continue;
      const p = contestant.personality;
      const odds = 0.4 + p.nerve / 500 + p.curiosity / 500 + (contestant.role === 'shadow' ? 0.08 : 0);
      if (rng.chance(odds)) mission.contributions[contestant.id] = 1;
    }
  }

  state.pendingPenalty = { thresholdBonus: 0, rewardPenalty: 0 };
  state.missions.push(...created);
  return created;
}
