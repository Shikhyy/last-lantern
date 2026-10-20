import { create } from 'zustand';
import type { QualityTier, RoomId, TimeOfDay } from '@/three/assets/manifest';

export interface SceneStats {
  fps: number;
  triangles: number;
  drawCalls: number;
  meshes: number;
  textures: number;
  camera: [number, number, number];
}

interface SceneState {
  mode: 'explore' | 'game';
  quality: QualityTier;
  timeOfDay: TimeOfDay;
  room: RoomId;
  debug: boolean;
  cameraOverride: { position: [number, number, number]; target: [number, number, number]; fov: number } | null;
  stats: SceneStats;
  enabledRooms: RoomId[];
  setMode: (mode: 'explore' | 'game') => void;
  setQuality: (quality: QualityTier) => void;
  setTimeOfDay: (time: TimeOfDay) => void;
  setRoom: (room: RoomId) => void;
  toggleDebug: () => void;
  setStats: (stats: SceneStats) => void;
  enableRoom: (room: RoomId) => void;
}

export function detectDefaultQuality(): QualityTier {
  if (typeof window === 'undefined') return 'medium';
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 4;
  if (coarse || memory <= 4 || cores <= 4) return 'low';
  if (memory <= 8 || cores <= 8) return 'medium';
  return 'high';
}

interface DeepLink {
  mode?: 'explore' | 'game';
  quality?: QualityTier;
  timeOfDay?: TimeOfDay;
  room?: RoomId;
  debug?: boolean;
  camera?: { position: [number, number, number]; target: [number, number, number]; fov: number };
}

/**
 * Deep links: ?room=council&time=night&quality=high&debug=1
 * Used for reviewing a specific composition and for poster capture.
 */
function readDeepLink(): DeepLink {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const link: DeepLink = {};
  const mode = params.get('mode');
  if (mode === 'game' || mode === 'explore') link.mode = mode;
  const quality = params.get('quality');
  if (quality === 'high' || quality === 'medium' || quality === 'low') link.quality = quality;
  const time = params.get('time');
  if (time === 'day' || time === 'night') link.timeOfDay = time;
  const room = params.get('room');
  if (room === 'aangan' || room === 'gallery' || room === 'archive' || room === 'council') link.room = room;
  if (params.get('debug') === '1') link.debug = true;
  const cam = params.get('cam');
  if (cam) {
    const numbers = cam.split(',').map(Number);
    if (numbers.length === 6 && numbers.every((value) => Number.isFinite(value))) {
      const fov = Number(params.get('fov') ?? 40);
      link.camera = {
        position: [numbers[0], numbers[1], numbers[2]],
        target: [numbers[3], numbers[4], numbers[5]],
        fov: Number.isFinite(fov) ? fov : 40,
      };
    }
  }
  return link;
}

const deepLink = readDeepLink();

export const useSceneStore = create<SceneState>((set) => ({
  mode: deepLink.mode ?? 'explore',
  quality: deepLink.quality ?? detectDefaultQuality(),
  timeOfDay: deepLink.timeOfDay ?? 'day',
  room: deepLink.room ?? 'aangan',
  debug: deepLink.debug ?? false,
  cameraOverride: deepLink.camera ?? null,
  stats: { fps: 0, triangles: 0, drawCalls: 0, meshes: 0, textures: 0, camera: [0, 0, 0] },
  enabledRooms: ['aangan', 'gallery'],
  setMode: (mode) => set({ mode }),
  setQuality: (quality) => set({ quality }),
  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
  setRoom: (room) => set({ room }),
  toggleDebug: () => set((state) => ({ debug: !state.debug })),
  setStats: (stats) => set({ stats }),
  enableRoom: (room) =>
    set((state) => (state.enabledRooms.includes(room) ? state : { enabledRooms: [...state.enabledRooms, room] })),
}));
