import { clamp, round2 } from './rng';
import type {
  AiKnowledge,
  Contestant,
  EventKind,
  GameEvent,
  JournalEntry,
  MatchState,
  MemoryEntry,
  MemoryProfile,
  Relationship,
  Role,
} from './types';

export function getContestant(state: MatchState, id: string): Contestant {
  const contestant = state.contestants.find((entry) => entry.id === id);
  if (!contestant) throw new Error(`Unknown contestant: ${id}`);
  return contestant;
}

export function tryContestant(state: MatchState, id: string | null | undefined): Contestant | null {
  if (!id) return null;
  return state.contestants.find((entry) => entry.id === id) ?? null;
}

export function living(state: MatchState): Contestant[] {
  return state.contestants.filter((entry) => entry.alive);
}

export function roomStateOf(state: MatchState, room: MatchState['currentRoom']) {
  const found = state.rooms.find((entry) => entry.room === room);
  if (!found) throw new Error(`Unknown room: ${room}`);
  return found;
}

export function livingIds(state: MatchState): string[] {
  return living(state).map((entry) => entry.id);
}

export function aiContestants(state: MatchState): Contestant[] {
  return state.contestants.filter((entry) => !entry.isPlayer);
}

export function aiLiving(state: MatchState): Contestant[] {
  return state.contestants.filter((entry) => !entry.isPlayer && entry.alive);
}

export function player(state: MatchState): Contestant {
  return getContestant(state, state.playerId);
}

export function countRoles(state: MatchState): Record<Role, number> {
  const counts: Record<Role, number> = { shadow: 0, keeper: 0, warden: 0, oathkeeper: 0 };
  for (const contestant of state.contestants) counts[contestant.role] += 1;
  return counts;
}

export function shadowsAlive(state: MatchState): number {
  return state.contestants.filter((entry) => entry.alive && entry.role === 'shadow').length;
}

export function faithfulAlive(state: MatchState): number {
  return state.contestants.filter((entry) => entry.alive && entry.role !== 'shadow').length;
}

/** The shared win check. Faithful win at zero Shadows; Shadows win at parity. */
export function factionOutcome(state: MatchState): 'shadow' | 'oathkeeper' | null {
  const shadows = shadowsAlive(state);
  if (shadows === 0) return 'oathkeeper';
  if (shadows >= faithfulAlive(state)) return 'shadow';
  return null;
}

export function knowledgeOf(state: MatchState, id: string): AiKnowledge {
  const knowledge = state.knowledge[id];
  if (!knowledge) throw new Error(`No AI knowledge for ${id}`);
  return knowledge;
}

export function seenClaimIds(state: MatchState, observerId: string): Set<string> {
  const knowledge = state.knowledge[observerId];
  return new Set(knowledge ? knowledge.claims.map((claim) => claim.id) : []);
}

export function emit(
  state: MatchState,
  input: {
    kind: EventKind;
    text: string;
    actorId?: string | null;
    subjectId?: string | null;
    witnessedBy?: string[];
    privateTo?: string | null;
    amount?: number | null;
    clueId?: string | null;
  },
): GameEvent {
  const privateTo = input.privateTo ?? null;
  const witnessedBy = privateTo ? [privateTo] : (input.witnessedBy ?? livingIds(state));
  const event: GameEvent = {
    id: `g${state.nextId}`,
    round: state.round,
    phase: state.phase,
    kind: input.kind,
    actorId: input.actorId ?? null,
    subjectId: input.subjectId ?? null,
    text: input.text,
    witnessedBy: [...new Set(witnessedBy)],
    privateTo,
    amount: input.amount ?? null,
    clueId: input.clueId ?? null,
  };
  state.nextId += 1;
  state.events.push(event);
  for (const observerId of event.witnessedBy) {
    const knowledge = state.knowledge[observerId];
    if (knowledge) knowledge.seenEventIds.push(event.id);
  }
  return event;
}

export function changeLantern(state: MatchState, delta: number, reason: string, eventId: string): number {
  const before = state.lantern;
  const after = clamp(before + delta, 0, 120);
  state.lantern = after;
  state.ledger.push({
    id: `l${state.nextId}`,
    round: state.round,
    reason,
    delta,
    before,
    after,
    eventId,
  });
  state.nextId += 1;
  return after - before;
}

export function addJournal(
  state: MatchState,
  input: { kind: JournalEntry['kind']; title: string; text: string },
): JournalEntry {
  const entry: JournalEntry = {
    id: `j${state.nextId}`,
    round: state.round,
    phase: state.phase,
    ...input,
  };
  state.nextId += 1;
  state.journal.push(entry);
  return entry;
}

export function applySuspicion(
  state: MatchState,
  observerId: string,
  targetId: string,
  delta: number,
  eventId: string,
): void {
  const knowledge = state.knowledge[observerId];
  if (!knowledge || observerId === targetId) return;
  const from = knowledge.suspicion[targetId] ?? 0.2;
  const to = round2(clamp(from + delta, 0, 1));
  if (to === from) return;
  knowledge.suspicion[targetId] = to;
  state.knowledgeLog.push({
    observerId,
    targetId,
    field: 'suspicion',
    from,
    to,
    eventId,
    night: state.round,
  });
}

export function applyRelationship(
  state: MatchState,
  observerId: string,
  targetId: string,
  field: keyof Relationship,
  delta: number,
  eventId: string,
): void {
  const knowledge = state.knowledge[observerId];
  if (!knowledge || observerId === targetId) return;
  const relationship = knowledge.relationships[targetId];
  if (!relationship) return;
  const bounds: Record<keyof Relationship, [number, number]> = {
    trust: [-100, 100],
    affinity: [-100, 100],
    fear: [0, 100],
    debt: [-100, 100],
  };
  const from = relationship[field];
  const to = round2(clamp(from + delta, bounds[field][0], bounds[field][1]));
  if (to === from) return;
  relationship[field] = to;
  state.knowledgeLog.push({
    observerId,
    targetId,
    field,
    from,
    to,
    eventId,
    night: state.round,
  });
}

const MEMORY_DECAY: Record<MemoryProfile, number> = {
  photographic: 0.93,
  social: 0.86,
  visual: 0.88,
  sensory: 0.82,
  spatial: 0.9,
  procedural: 0.9,
  melodic: 0.84,
  numeric: 0.9,
  taxonomic: 0.92,
  ecological: 0.88,
  quote: 0.94,
};

export function pushMemory(
  state: MatchState,
  observerId: string,
  input: {
    kind: MemoryEntry['kind'];
    text: string;
    importance: number;
    subjectId?: string | null;
    highEmotion?: boolean;
  },
): MemoryEntry | null {
  const knowledge = state.knowledge[observerId];
  if (!knowledge) return null;
  const entry: MemoryEntry = {
    id: `m${state.nextId}`,
    night: state.round,
    kind: input.kind,
    text: input.text,
    importance: clamp(input.importance, 0, 1),
    weight: clamp(input.importance, 0, 1),
    subjectId: input.subjectId ?? null,
    highEmotion: input.highEmotion ?? false,
  };
  state.nextId += 1;
  knowledge.memories.push(entry);
  knowledge.memories.sort((a, b) => b.weight - a.weight);
  if (knowledge.memories.length > 40) knowledge.memories.length = 40;
  return entry;
}

/** Decay every memory by the character's profile; high-emotion and betrayal entries keep a floor. */
export function decayMemories(state: MatchState, observerId: string, nights = 1): void {
  const knowledge = state.knowledge[observerId];
  if (!knowledge) return;
  const contestant = tryContestant(state, observerId);
  if (!contestant) return;
  const rate = MEMORY_DECAY[contestant.memoryProfile] ** nights;
  for (const memory of knowledge.memories) {
    const floor =
      memory.highEmotion || memory.kind === 'betrayal' || memory.kind === 'contradiction'
        ? Math.max(0.35, memory.importance * 0.6)
        : 0.02;
    memory.weight = round2(Math.max(floor, memory.weight * rate));
  }
  knowledge.memories.sort((a, b) => b.weight - a.weight);
}

export function note(state: MatchState, text: string): void {
  state.lastMessage = text;
}

export function voteWeight(state: MatchState, targetId: string): number {
  const target = tryContestant(state, targetId);
  return target ? 1 : 0;
}
