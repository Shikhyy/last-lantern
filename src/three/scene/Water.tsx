import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { CircleGeometry, PlaneGeometry } from 'three';
import { usePalaceMaterials } from '../materials';
import { makeWaterNormalTexture } from './textures';

export interface RippleSurfaceProps {
  size?: [number, number];
  radius?: number;
  shape?: 'plane' | 'circle';
  position: [number, number, number];
  rotation?: [number, number, number];
  repeat?: number;
  speed?: number;
  opacity?: number;
  normalScale?: number;
}

/**
 * Still water with a moving, generated ripple normal map. Cheap, physically
 * lit, and it picks up the HDRI, which is what sells still water.
 */
export function RippleSurface({
  size = [1, 1],
  radius = 1,
  shape = 'plane',
  position,
  rotation = [-Math.PI / 2, 0, 0],
  repeat = 3,
  speed = 0.018,
  opacity,
  normalScale = 0.4,
}: RippleSurfaceProps) {
  const water = usePalaceMaterials().water;
  const geometry = useMemo(
    () => (shape === 'circle' ? new CircleGeometry(radius, 64) : new PlaneGeometry(size[0], size[1], 1, 1)),
    [shape, radius, size],
  );
  const material = useMemo(() => {
    const clone = water.clone();
    const normal = makeWaterNormalTexture();
    normal.repeat.set(repeat, repeat);
    clone.normalMap = normal;
    clone.normalScale.set(normalScale, normalScale);
    if (opacity !== undefined) clone.opacity = opacity;
    return clone;
  }, [water, repeat, normalScale, opacity]);

  useEffect(
    () => () => {
      material.normalMap?.dispose();
      material.dispose();
      geometry.dispose();
    },
    [material, geometry],
  );

  useFrame((_, delta) => {
    const normal = material.normalMap;
    if (!normal) return;
    const step = Math.min(delta, 0.05) * speed;
    normal.offset.x += step;
    normal.offset.y += step * 0.63;
  });

  return <mesh geometry={geometry} material={material} position={position} rotation={rotation} />;
}
