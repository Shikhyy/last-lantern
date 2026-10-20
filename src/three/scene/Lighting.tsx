import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { DirectionalLight, HemisphereLight, MathUtils } from 'three';
import { SCENE_COLORS } from '../materials';
import { profileFor } from '../quality';
import { useSceneStore } from '@/state/sceneStore';

/**
 * One directional sun with a single shadow map for the hero area, one cool
 * bounce fill, and a moon at night. No shadow maps on every object; the merged
 * architecture receives and casts as a small number of meshes.
 */
export function Lighting() {
  const quality = useSceneStore((state) => state.quality);
  const timeOfDay = useSceneStore((state) => state.timeOfDay);
  const profile = profileFor(quality);
  const sun = useRef<DirectionalLight>(null);
  const fill = useRef<DirectionalLight>(null);
  const moon = useRef<DirectionalLight>(null);
  const hemi = useRef<HemisphereLight>(null);

  useFrame((_, delta) => {
    const k = 1 - Math.exp(-delta * 2.6);
    const day = timeOfDay === 'day';
    if (sun.current) sun.current.intensity = MathUtils.lerp(sun.current.intensity, day ? 1.75 : 0, k);
    if (fill.current) fill.current.intensity = MathUtils.lerp(fill.current.intensity, day ? 0.3 : 0.14, k);
    if (moon.current) moon.current.intensity = MathUtils.lerp(moon.current.intensity, day ? 0 : 0.72, k);
    if (hemi.current) hemi.current.intensity = MathUtils.lerp(hemi.current.intensity, day ? 0.42 : 0.2, k);
  });

  return (
    <>
      <hemisphereLight ref={hemi} color={SCENE_COLORS.sun} groundColor={0x2a1c12} intensity={0.3} />
      <directionalLight
        ref={sun}
        color={SCENE_COLORS.sun}
        intensity={1.75}
        position={[-24, 44, 17]}
        castShadow={profile.shadows}
        shadow-mapSize-width={profile.shadowMapSize}
        shadow-mapSize-height={profile.shadowMapSize}
        shadow-camera-near={1}
        shadow-camera-far={200}
        shadow-camera-left={-58}
        shadow-camera-right={58}
        shadow-camera-top={58}
        shadow-camera-bottom={-58}
        shadow-bias={-0.0007}
        shadow-normalBias={0.04}
      />
      <directionalLight ref={fill} color={0xbfd0e0} intensity={0.3} position={[30, 18, -24]} />
      <directionalLight
        ref={moon}
        color={SCENE_COLORS.moon}
        intensity={0}
        position={[26, 34, -30]}
        castShadow={profile.shadows}
        shadow-mapSize-width={profile.shadowMapSize}
        shadow-mapSize-height={profile.shadowMapSize}
        shadow-camera-near={1}
        shadow-camera-far={200}
        shadow-camera-left={-58}
        shadow-camera-right={58}
        shadow-camera-top={58}
        shadow-camera-bottom={-58}
        shadow-bias={-0.0008}
        shadow-normalBias={0.05}
      />
    </>
  );
}
