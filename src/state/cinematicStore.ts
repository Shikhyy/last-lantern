import { create } from 'zustand';

export interface CameraShot {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  /** Seconds to travel to this framing. */
  duration: number;
  ease?: 'power1.inOut' | 'power2.inOut' | 'power3.inOut' | 'sine.inOut' | 'none';
}

interface CinematicState {
  active: boolean;
  shots: CameraShot[];
  index: number;
  begin: (shots: CameraShot[]) => void;
  setIndex: (index: number) => void;
  end: () => void;
}

/**
 * The camera sequence is deliberately separate from the match. A cinematic may
 * frame a room, but it never owns or mutates game state.
 */
export const useCinematicStore = create<CinematicState>((set) => ({
  active: false,
  shots: [],
  index: 0,
  begin: (shots) => set({ active: shots.length > 0, shots, index: 0 }),
  setIndex: (index) =>
    set((state) => (index >= 0 && index < state.shots.length ? { index } : state)),
  end: () => set({ active: false, shots: [], index: 0 }),
}));
