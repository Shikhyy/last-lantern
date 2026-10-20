import type { LoadResult, MatchState, SaveEnvelope } from './types';
import { SCHEMA_VERSION } from './types';

export const SAVE_VERSION = 1;
const MAX_SAVE_BYTES = 5_000_000;

/** FNV-1a over the serialised state. Cheap, stable, and enough to catch a torn write. */
export function checksum(text: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

export function saveMatch(state: MatchState, savedAt = 0): SaveEnvelope {
  const body = JSON.stringify(state);
  return {
    version: SAVE_VERSION,
    savedAt,
    checksum: checksum(body),
    state,
  };
}

export function serializeSave(envelope: SaveEnvelope): string {
  return JSON.stringify(envelope);
}

function isMatchShape(value: unknown): value is MatchState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<MatchState>;
  return (
    typeof candidate.schemaVersion === 'number' &&
    typeof candidate.seed === 'number' &&
    typeof candidate.phase === 'string' &&
    typeof candidate.playerId === 'string' &&
    Array.isArray(candidate.contestants) &&
    candidate.contestants.length === 12 &&
    Array.isArray(candidate.events) &&
    Array.isArray(candidate.knowledgeLog) &&
    typeof candidate.lantern === 'number'
  );
}

/**
 * Repairs a session saved mid-beat. The only authority is the phase clock: if
 * the data needed to continue a beat is missing, the match rewinds to the last
 * beat that is fully described (dusk or judgment), never forward.
 */
export function recoverState(state: MatchState): MatchState {
  const recovered = state;
  if (recovered.lantern < 0) recovered.lantern = 0;
  if (recovered.lantern > 120) recovered.lantern = 120;
  if (recovered.phase === 'council' && !recovered.council) {
    recovered.phase = 'dusk';
  }
  if (recovered.phase === 'council' && recovered.council && recovered.council.step === 'reveal' && !recovered.council.votes) {
    recovered.phase = 'dusk';
    recovered.council = null;
  }
  if (recovered.phase === 'night' && !recovered.nightState) {
    recovered.phase = 'judgment';
  }
  if (recovered.phase === 'finale' && !recovered.finaleState) {
    recovered.phase = 'judgment';
  }
  if (recovered.phase === 'ending' && !recovered.ending) {
    recovered.phase = 'judgment';
  }
  if (!Array.isArray(recovered.voteHistory)) recovered.voteHistory = [];
  if (!recovered.playerIntel) {
    recovered.playerIntel = { reads: [], wards: [], channel: [], notes: [] };
  }
  if (!recovered.pendingPenalty) recovered.pendingPenalty = { thresholdBonus: 0, rewardPenalty: 0 };
  return recovered;
}

export function loadMatch(raw: string | null | undefined): LoadResult {
  if (!raw) return { status: 'corrupt', state: null, raw: raw ?? null, reason: 'No save data.' };
  if (raw.length > MAX_SAVE_BYTES) {
    return { status: 'corrupt', state: null, raw, reason: 'Save file is too large.' };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: 'corrupt', state: null, raw, reason: 'Save file is not valid JSON.' };
  }
  if (!parsed || typeof parsed !== 'object') {
    return { status: 'corrupt', state: null, raw, reason: 'Save file is empty.' };
  }
  const envelope = parsed as Partial<SaveEnvelope>;
  if (typeof envelope.version !== 'number') {
    return { status: 'corrupt', state: null, raw, reason: 'Save file has no version.' };
  }
  if (envelope.version > SAVE_VERSION) {
    return { status: 'corrupt', state: null, raw, reason: 'Save file was written by a newer build.' };
  }
  if (!isMatchShape(envelope.state)) {
    return { status: 'corrupt', state: null, raw, reason: 'Save file is missing match state.' };
  }
  const body = JSON.stringify(envelope.state);
  if (envelope.checksum !== checksum(body)) {
    return { status: 'corrupt', state: null, raw, reason: 'Save file checksum does not match.' };
  }
  if (envelope.state.schemaVersion > SCHEMA_VERSION) {
    return { status: 'corrupt', state: null, raw, reason: 'Save schema is newer than this build.' };
  }
  return { status: 'ok', state: recoverState(envelope.state), raw, reason: null };
}

export function describeLoad(result: LoadResult): string {
  if (result.status === 'ok') return 'Session restored.';
  return `The archive could not be restored: ${result.reason ?? 'unknown damage'}. The file is kept.`;
}
