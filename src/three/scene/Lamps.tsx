import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { AdditiveBlending, PointLight } from 'three';
import { cloneModel, usePalaceAssets } from '../assets/AssetProvider';
import { SCENE_COLORS } from '../materials';
import { makeGlowTexture } from './textures';

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function DiyaLamp({
  position,
  rotation,
  scale = 1,
  light = false,
  phase = 0,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  light?: boolean;
  phase?: number;
}) {
  const { models } = usePalaceAssets();
  const scene = useMemo(() => cloneModel(models.lanternDiya), [models.lanternDiya]);

  if (!scene) return null;
  return (
    <group position={position} rotation={rotation} scale={scale} name="diya-lamp">
      <primitive object={scene} dispose={null} />
      {light ? <LampLight phase={phase} position={[0, 0, 0]} distance={9} intensity={7} /> : null}
    </group>
  );
}

export function LampLight({
  position = [0, 0, 0],
  distance = 8,
  intensity = 8,
  phase = 0,
}: {
  position?: [number, number, number];
  distance?: number;
  intensity?: number;
  phase?: number;
}) {
  const ref = useRef<PointLight>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const motion = reduced() ? 0 : 1;
    const t = clock.elapsedTime + phase;
    ref.current.intensity =
      intensity * (0.9 + Math.sin(t * 8.3) * 0.05 * motion + Math.sin(t * 13.7) * 0.035 * motion);
  });
  return (
    <pointLight
      ref={ref}
      color={SCENE_COLORS.lamp}
      intensity={intensity}
      distance={distance}
      decay={2}
      position={position}
    />
  );
}

export function BrassVessel({
  position,
  scale = 1,
  rotation,
}: {
  position: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
}) {
  const { models } = usePalaceAssets();
  const scene = useMemo(() => cloneModel(models.vesselBrass), [models.vesselBrass]);
  if (!scene) return null;
  return <primitive object={scene} position={position} scale={scale} rotation={rotation} dispose={null} />;
}

export function Candlesticks({
  position,
  scale = 1,
  light = false,
}: {
  position: [number, number, number];
  scale?: number;
  light?: boolean;
}) {
  const { models } = usePalaceAssets();
  const scene = useMemo(() => cloneModel(models.candlesticks), [models.candlesticks]);
  if (!scene) return null;
  return (
    <group position={position} scale={scale} name="candlesticks">
      <primitive object={scene} dispose={null} />
      {light ? <LampLight position={[0, 0.5, 0]} distance={6} intensity={4} phase={1.7} /> : null}
    </group>
  );
}

export function GlowHalo({
  position,
  scale = 1,
  opacity = 0.5,
}: {
  position: [number, number, number];
  scale?: number;
  opacity?: number;
}) {
  const glow = useMemo(() => makeGlowTexture(), []);
  useEffect(() => () => glow.dispose(), [glow]);
  return (
    <sprite position={position} scale={[scale, scale, 1]}>
      <spriteMaterial
        map={glow}
        color={SCENE_COLORS.lamp}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={AdditiveBlending}
        toneMapped={false}
      />
    </sprite>
  );
}
