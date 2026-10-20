import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Points } from 'three';
import { makeDustTexture } from './textures';

export function DustMotes({
  count,
  size = [16, 6, 16],
  center = [0, 3, 0],
  opacity = 0.42,
}: {
  count: number;
  size?: [number, number, number];
  center?: [number, number, number];
  opacity?: number;
}) {
  const ref = useRef<Points>(null);
  const texture = useMemo(() => makeDustTexture(), []);
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * size[0];
      positions[i * 3 + 1] = (Math.random() - 0.5) * size[1];
      positions[i * 3 + 2] = (Math.random() - 0.5) * size[2];
    }
    const buffer = new BufferGeometry();
    buffer.setAttribute('position', new BufferAttribute(positions, 3));
    return buffer;
  }, [count, size]);

  useEffect(
    () => () => {
      geometry.dispose();
      texture.dispose();
    },
    [geometry, texture],
  );

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.rotation.y = t * 0.008;
    ref.current.position.y = Math.sin(t * 0.16) * 0.22;
  });

  if (count <= 0) return null;

  return (
    <points ref={ref} position={center} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        map={texture}
        size={0.045}
        sizeAttenuation
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={AdditiveBlending}
        color={0xf6e4c4}
        toneMapped={false}
      />
    </points>
  );
}
