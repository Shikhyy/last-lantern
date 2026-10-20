import type { QualityTier } from './assets/manifest';

export interface QualityProfile {
  tier: QualityTier;
  dpr: [number, number];
  shadows: boolean;
  shadowMapSize: number;
  post: boolean;
  dustMotes: number;
  lampLights: number;
  waterSegments: number;
  anisotropy: number;
}

/**
 * Performance budgets from docs/TECHNICAL_ARCHITECTURE.md §7.
 * Low is the mobile profile: no real-time shadow maps, reduced particle and
 * light counts, one-pixel DPR.
 */
export const QUALITY: Record<QualityTier, QualityProfile> = {
  high: {
    tier: 'high',
    dpr: [1, 1.75],
    shadows: true,
    shadowMapSize: 2048,
    post: true,
    dustMotes: 520,
    lampLights: 6,
    waterSegments: 40,
    anisotropy: 8,
  },
  medium: {
    tier: 'medium',
    dpr: [0.85, 1.4],
    shadows: true,
    shadowMapSize: 1024,
    post: true,
    dustMotes: 240,
    lampLights: 3,
    waterSegments: 24,
    anisotropy: 4,
  },
  low: {
    tier: 'low',
    dpr: [0.7, 1],
    shadows: false,
    shadowMapSize: 512,
    post: false,
    dustMotes: 0,
    lampLights: 1,
    waterSegments: 12,
    anisotropy: 2,
  },
};

export function profileFor(tier: QualityTier): QualityProfile {
  return QUALITY[tier];
}
