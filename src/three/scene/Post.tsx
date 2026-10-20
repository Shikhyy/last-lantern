import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import type { QualityProfile } from '../quality';

/**
 * Deliberately restrained: a little bloom for real flame, a vignette to hold
 * the eye on the courtyard, and film grain so the stone does not look plasticky.
 * Disabled entirely on the mobile profile.
 */
export function Post({ profile }: { profile: QualityProfile }) {
  if (!profile.post) return null;
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        intensity={profile.tier === 'high' ? 0.32 : 0.24}
        luminanceThreshold={0.82}
        luminanceSmoothing={0.24}
        mipmapBlur
        radius={0.72}
      />
      <Vignette offset={0.3} darkness={0.68} eskil={false} blendFunction={BlendFunction.NORMAL} />
      <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.024} />
    </EffectComposer>
  );
}
