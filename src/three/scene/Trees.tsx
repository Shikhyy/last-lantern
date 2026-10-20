import { useMemo } from 'react';
import { MeshStandardMaterial } from 'three';
import { usePalaceMaterials } from '../materials';
import { useSceneStore } from '@/state/sceneStore';

const TREE_POSITIONS: [number, number, number][] = [
  [-15, 0, 24],
  [15, 0, 24],
  [-26, 0, 34],
  [26, 0, 34],
  [-9, 0, 38],
  [9, 0, 38],
  [0, 0, 44],
];

export function Trees() {
  const quality = useSceneStore((state) => state.quality);
  const materials = usePalaceMaterials();
  const foliage = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#5b6a3d',
        roughness: 0.92,
        metalness: 0,
      }),
    [],
  );

  if (quality === 'low') return null;

  return (
    <group name="approach-trees">
      {TREE_POSITIONS.map(([x, y, z], index) => (
        <group key={index} position={[x, y, z]}>
          <mesh castShadow receiveShadow position={[0, 1.35, 0]}>
            <cylinderGeometry args={[0.18, 0.28, 2.7, 8]} />
            <primitive object={materials.woodDark} attach="material" />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 3.35, 0]}>
            <sphereGeometry args={[1.55 + (index % 2) * 0.25, 10, 8]} />
            <primitive object={foliage} attach="material" />
          </mesh>
          <mesh castShadow receiveShadow position={[0.6, 3.9, 0.2]}>
            <sphereGeometry args={[1.05, 8, 6]} />
            <primitive object={foliage} attach="material" />
          </mesh>
          <mesh castShadow receiveShadow position={[-0.7, 3.7, -0.3]}>
            <sphereGeometry args={[0.95, 8, 6]} />
            <primitive object={foliage} attach="material" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
