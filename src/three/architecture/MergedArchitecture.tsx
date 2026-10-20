import { useEffect, useMemo, useRef } from 'react';
import type { Group, Material } from 'three';
import type { MergedBucket } from './kit';
import type { PalaceMaterials } from '../materials';

export function MergedArchitecture({
  buckets,
  materials,
  name,
  castShadow = true,
  receiveShadow = true,
  onStats,
}: {
  buckets: MergedBucket[];
  materials: PalaceMaterials;
  name: string;
  castShadow?: boolean;
  receiveShadow?: boolean;
  onStats?: (name: string, triangles: number, meshes: number) => void;
}) {
  const group = useRef<Group>(null);
  const owned = useMemo(() => buckets.map((bucket) => bucket.geometry), [buckets]);

  useEffect(() => {
    let triangles = 0;
    for (const geometry of owned) {
      triangles += geometry.index ? geometry.index.count / 3 : geometry.getAttribute('position').count / 3;
    }
    onStats?.(name, Math.round(triangles), buckets.length);
    if (typeof window !== 'undefined') {
      (window as unknown as { __nimbagarh?: string[] }).__nimbagarh ??= [];
      (window as unknown as { __nimbagarh?: string[] }).__nimbagarh?.push(
        `${name}: ${buckets.length} buckets, ${Math.round(triangles)} tris`,
      );
      console.info(`[nimbagarh] merged ${name}: ${buckets.length} buckets, ${Math.round(triangles)} triangles`);
    }
  }, [buckets, name, onStats, owned]);

  useEffect(
    () => () => {
      for (const geometry of owned) geometry.dispose();
    },
    [owned],
  );

  return (
    <group ref={group} name={name}>
      {buckets.map((bucket) => (
        <mesh
          key={bucket.material}
          name={`${name}:${bucket.material}`}
          geometry={bucket.geometry}
          material={materials[bucket.material] as Material}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
        />
      ))}
    </group>
  );
}
