import { create } from 'zustand';
import { audio } from '@/audio/audio';
import { detectDefaultQuality, useSceneStore } from './sceneStore';
import type { QualityTier } from '@/three/assets/manifest';

export interface PalaceSettings {
  quality: QualityTier | 'auto';
  reducedMotion: boolean;
  highContrast: boolean;
  muted: boolean;
  master: number;
  ambience: number;
  sfx: number;
}

const KEY = 'tll.settings.v1';

const DEFAULTS: PalaceSettings = {
  quality: 'auto',
  reducedMotion:
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      ? true
      : false,
  highContrast: false,
  muted: false,
  master: 0.42,
  ambience: 0.5,
  sfx: 0.4,
};

function read(): PalaceSettings {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<PalaceSettings>;
    return {
      ...DEFAULTS,
      ...parsed,
      quality:
        parsed.quality === 'high' || parsed.quality === 'medium' || parsed.quality === 'low' || parsed.quality === 'auto'
          ? parsed.quality
          : DEFAULTS.quality,
    };
  } catch {
    return DEFAULTS;
  }
}

/**
 * Non-React read of the motion preference. The media query is the floor; the
 * in-game setting can only add more restraint, never less.
 */
export function motionReduced(): boolean {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return true;
  }
  return useSettingsStore.getState().settings.reducedMotion;
}

export function applySettings(settings: PalaceSettings): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.motion = settings.reducedMotion ? 'reduced' : 'full';
  root.dataset.contrast = settings.highContrast ? 'high' : 'normal';
  useSceneStore
    .getState()
    .setQuality(settings.quality === 'auto' ? detectDefaultQuality() : settings.quality);
  audio.setVolumes({
    master: settings.master,
    ambience: settings.ambience,
    sfx: settings.sfx,
    muted: settings.muted,
  });
}

interface SettingsStore {
  settings: PalaceSettings;
  set: (patch: Partial<PalaceSettings>) => void;
  reset: () => void;
}

const initial = read();
applySettings(initial);

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: initial,
  set: (patch) =>
    set((state) => {
      const next = { ...state.settings, ...patch };
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(KEY, JSON.stringify(next));
        } catch {
          // Storage can be unavailable; the session still uses the value.
        }
      }
      applySettings(next);
      return { settings: next };
    }),
  reset: () =>
    set(() => {
      if (typeof window !== 'undefined') window.localStorage.removeItem(KEY);
      applySettings(DEFAULTS);
      return { settings: DEFAULTS };
    }),
}));
