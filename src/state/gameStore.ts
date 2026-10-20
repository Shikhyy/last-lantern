import { create } from 'zustand';
import { applyAction } from '@/game/engine';
import { createMatch } from '@/game/match';
import { loadMatch, saveMatch, serializeSave } from '@/game/save';
import type { GameAction, MatchOptions, MatchState, RoomId } from '@/game/types';
import { useSceneStore } from './sceneStore';

const SAVE_KEY = 'tll.match.v1';

export type SaveStatus = 'none' | 'ok' | 'corrupt';

interface GameState {
  match: MatchState | null;
  status: 'title' | 'playing';
  error: string | null;
  notice: string | null;
  saveStatus: SaveStatus;
  saveReason: string | null;
  hasSave: boolean;
  lastOptions: MatchOptions | null;
  start: (options: MatchOptions) => void;
  resume: () => void;
  act: (action: GameAction) => boolean;
  restart: () => void;
  abandon: () => void;
  dismiss: () => void;
  goToRoom: (room: RoomId) => void;
}

function readSave(): { status: SaveStatus; reason: string | null; state: MatchState | null } {
  if (typeof window === 'undefined') return { status: 'none', reason: null, state: null };
  const raw = window.localStorage.getItem(SAVE_KEY);
  if (!raw) return { status: 'none', reason: null, state: null };
  const loaded = loadMatch(raw);
  if (loaded.status === 'ok' && loaded.state) {
    return { status: 'ok', reason: null, state: loaded.state };
  }
  return { status: 'corrupt', reason: loaded.reason, state: null };
}

const initial = readSave();

function optionsOf(state: MatchState): MatchOptions {
  return {
    seed: state.seed,
    playerName: state.contestants.find((entry) => entry.isPlayer)?.name ?? 'The Stranger',
    pronouns: state.contestants.find((entry) => entry.isPlayer)?.pronouns ?? 'they/them',
    oath: state.contestants.find((entry) => entry.isPlayer)?.oath ?? 'keep_promise',
    difficulty: state.difficulty,
    antiRepeat: { ...state.antiRepeat },
  };
}

export function syncScene(state: MatchState): void {
  const scene = useSceneStore.getState();
  scene.setRoom(state.currentRoom);
  const day = state.phase === 'dawn' || state.phase === 'day' || state.phase === 'judgment' || state.phase === 'ending';
  scene.setTimeOfDay(day ? 'day' : 'night');
}

export const useGameStore = create<GameState>((set, get) => ({
  match: null,
  status: 'title',
  error: null,
  notice: null,
  saveStatus: initial.status,
  saveReason: initial.reason,
  hasSave: initial.status === 'ok',
  lastOptions: null,

  start: (options) => {
    const match = createMatch(options);
    persist(match);
    set({
      match,
      status: 'playing',
      error: null,
      notice: match.lastMessage,
      saveStatus: 'ok',
      saveReason: null,
      hasSave: true,
      lastOptions: { ...options },
    });
    syncScene(match);
  },

  resume: () => {
    const loaded = readSave();
    if (loaded.status !== 'ok' || !loaded.state) {
      set({
        error: loaded.reason ?? 'There is no session to continue.',
        saveStatus: loaded.status,
        saveReason: loaded.reason,
        hasSave: false,
      });
      return;
    }
    set({
      match: loaded.state,
      status: 'playing',
      error: null,
      notice: loaded.state.lastMessage,
      saveStatus: 'ok',
      saveReason: null,
      hasSave: true,
      lastOptions: optionsOf(loaded.state),
    });
    syncScene(loaded.state);
  },

  act: (action) => {
    const current = get().match;
    if (!current) {
      set({ error: 'There is no match in progress.' });
      return false;
    }
    const result = applyAction(current, action);
    if (result.error) {
      set({ error: result.error });
      return false;
    }
    const notice =
      result.events.length > 0
        ? result.events[result.events.length - 1].text
        : result.state.lastMessage;
    persist(result.state);
    set({
      match: result.state,
      error: null,
      notice,
      saveStatus: 'ok',
      hasSave: true,
      lastOptions: get().lastOptions ?? optionsOf(result.state),
    });
    syncScene(result.state);
    return true;
  },

  restart: () => {
    const current = get().match;
    const options = get().lastOptions ?? (current ? optionsOf(current) : null);
    if (!options) {
      set({ error: 'There is nothing to restart.' });
      return;
    }
    const seed = nextSeed();
    const match = createMatch({ ...options, seed, antiRepeat: current ? { ...current.antiRepeat } : undefined });
    persist(match);
    set({
      match,
      status: 'playing',
      error: null,
      notice: match.lastMessage,
      saveStatus: 'ok',
      saveReason: null,
      hasSave: true,
      lastOptions: { ...options, seed },
    });
    syncScene(match);
  },

  abandon: () => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(SAVE_KEY);
    set({
      match: null,
      status: 'title',
      error: null,
      notice: null,
      saveStatus: 'none',
      saveReason: null,
      hasSave: false,
      lastOptions: null,
    });
    useSceneStore.getState().setTimeOfDay('day');
    useSceneStore.getState().setRoom('aangan');
  },

  dismiss: () => set({ error: null }),
  goToRoom: (room) => {
    const current = get().match;
    if (!current) return;
    const next = applyAction(current, { type: 'SET_ROOM', room });
    if (next.error) {
      set({ error: next.error });
      return;
    }
    set({ match: next.state, error: null });
    useSceneStore.getState().setRoom(room);
  },
}));

function persist(state: MatchState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SAVE_KEY, serializeSave(saveMatch(state, Date.now())));
  } catch {
    // A full or disabled storage must not stop play.
  }
}

function nextSeed(): number {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return buffer[0] || 1;
  }
  return Math.floor(Date.now() % 2147483647) || 1;
}
