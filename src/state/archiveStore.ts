import { create } from 'zustand';
import type { MatchOptions, MatchState, Role } from '@/game/types';

export interface ArchiveEntry {
  id: string;
  recordedAt: number;
  seed: number;
  options: MatchOptions;
  playerName: string;
  playerRole: Role;
  endingId: string;
  endingTitle: string;
  faction: 'shadow' | 'oathkeeper';
  night: number;
  lantern: number;
  survived: boolean;
  pactsKept: number;
  pactsBroken: number;
  roles: { name: string; role: Role; alive: boolean }[];
  decisions: string[];
}

const KEY = 'tll.archive.v1';

function read(): ArchiveEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ArchiveEntry[]).slice(0, 24) : [];
  } catch {
    return [];
  }
}

function write(entries: ArchiveEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries.slice(0, 24)));
  } catch {
    // An unavailable archive must not interrupt the ending.
  }
}

interface ArchiveStore {
  entries: ArchiveEntry[];
  record: (state: MatchState, options: MatchOptions | null) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useArchiveStore = create<ArchiveStore>((set) => ({
  entries: read(),
  record: (state, options) =>
    set((current) => {
      if (!state.ending || !options) return current;
      const player = state.contestants.find((entry) => entry.isPlayer);
      if (!player) return current;
      const id = `${state.seed}-${state.ending.id}-${state.round}`;
      if (current.entries.some((entry) => entry.id === id)) return current;
      const entry: ArchiveEntry = {
        id,
        recordedAt: Date.now(),
        seed: state.seed,
        options,
        playerName: player.name,
        playerRole: player.role,
        endingId: state.ending.id,
        endingTitle: state.ending.title,
        faction: state.ending.faction,
        night: state.round,
        lantern: state.lantern,
        survived: player.alive,
        pactsKept: state.ending.pactsKept,
        pactsBroken: state.ending.pactsBroken,
        roles: state.ending.unmasking.roles,
        decisions: state.ending.unmasking.decisions,
      };
      const entries = [entry, ...current.entries].slice(0, 24);
      write(entries);
      return { entries };
    }),
  remove: (id) =>
    set((current) => {
      const entries = current.entries.filter((entry) => entry.id !== id);
      write(entries);
      return { entries };
    }),
  clear: () =>
    set(() => {
      write([]);
      return { entries: [] };
    }),
}));
