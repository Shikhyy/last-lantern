import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { type Group } from 'three';
import { useSceneStore } from '@/state/sceneStore';

const BIRD_COUNT = 14;

export function Birds() {
  const quality = useSceneStore((state) => state.quality);
  const refs = useRef<Array<Group | null>>([]);
  const birds = useMemo(
    () =>
      Array.from({ length: BIRD_COUNT }, (_, index) => ({
        radius: 78 + (index % 5) * 18 + (index % 3) * 7,
        height: 34 + (index % 6) * 4.5,
        speed: 0.018 + (index % 4) * 0.006,
        phase: index * 1.73,
        size: 0.45 + (index % 3) * 0.12,
        centerZ: -38 + (index % 4) * 12,
      })),
    [],
  );

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    birds.forEach((bird, index) => {
      const group = refs.current[index];
      if (!group) return;
      const angle = time * bird.speed + bird.phase;
      group.position.set(
        Math.cos(angle) * bird.radius,
        bird.height + Math.sin(angle * 2.3) * 3.2,
        bird.centerZ + Math.sin(angle) * bird.radius * 0.55,
      );
      group.rotation.y = -angle + Math.PI / 2;
      group.rotation.z = Math.sin(angle * 1.7) * 0.35;
    });
  });

  if (quality === 'low') return null;

  return (
    <group name="birds">
      {birds.map((bird, index) => (
        <group key={index} ref={(node) => (refs.current[index] = node)}>
          <mesh castShadow={false} receiveShadow={false}>
            <tetrahedronGeometry args={[bird.size, 0]} />
            <meshStandardMaterial
              color="#d8d1c0"
              roughness={0.9}
              metalness={0}
              emissive="#b9a888"
              emissiveIntensity={0.08}
            />
          </mesh>
          <mesh position={[bird.size * 0.7, 0, 0]} castShadow={false} receiveShadow={false}>
            <boxGeometry args={[bird.size * 2.4, bird.size * 0.08, bird.size * 0.7]} />
            <meshStandardMaterial color="#c8c1b0" roughness={0.95} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
