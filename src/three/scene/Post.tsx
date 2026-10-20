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
        intensity={profile.tier === 'high' ? 0.42 : 0.3}
        luminanceThreshold={0.72}
        luminanceSmoothing={0.24}
        mipmapBlur
        radius={0.72}
      />
      <Vignette offset={0.26} darkness={0.62} eskil={false} blendFunction={BlendFunction.NORMAL} />
      <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.024} />
    </EffectComposer>
  );
}
