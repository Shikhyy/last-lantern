import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { AdditiveBlending, Mesh, PointLight, Shape, Vector2 } from 'three';
import { DETAIL, Kit } from '../architecture/kit';
import { MergedArchitecture } from '../architecture/MergedArchitecture';
import { SCENE_COLORS, usePalaceMaterials } from '../materials';
import { useSceneStore } from '@/state/sceneStore';
import { makeGlowTexture } from './textures';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function HeroLantern({ position }: { position: [number, number, number] }) {
  const quality = useSceneStore((state) => state.quality);
  const timeOfDay = useSceneStore((state) => state.timeOfDay);
  const night = timeOfDay === 'night';
  const materials = usePalaceMaterials();
  const glow = useMemo(() => makeGlowTexture(), []);
  const flame = useRef<Mesh>(null);
  const light = useRef<PointLight>(null);

  const buckets = useMemo(() => {
    const kit = new Kit(DETAIL[quality]);
    // Base.
    kit.cylinder('sandstonePale', [0.78, 0.9, 0.16, 8], [0, 0.08, 0]);
    kit.cylinder('brassDark', [0.72, 0.78, 0.14, 8], [0, 0.23, 0]);
    kit.cylinder('brass', [0.55, 0.6, 0.2, 8], [0, 0.4, 0]);
    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2;
      // Feet.
      kit.extrude('brassDark', scrollFoot(), 0.12, [Math.cos(angle) * 0.5, 0.24, Math.sin(angle) * 0.5], [0, -angle + Math.PI / 2, 0], [1, 1], 0.008);
    }
    // Frame posts.
    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2;
      const radius = 0.56;
      kit.box(
        'brass',
        [0.075, 1.85, 0.075],
        [Math.cos(angle) * radius, 1.48, Math.sin(angle) * radius],
        [0, -angle, 0],
      );
      kit.cylinder('brassDark', [0.05, 0.05, 0.12, 8], [Math.cos(angle) * radius, 0.55, Math.sin(angle) * radius]);
      kit.cylinder('brassDark', [0.05, 0.05, 0.12, 8], [Math.cos(angle) * radius, 2.42, Math.sin(angle) * radius]);
    }
    // Glass panels.
    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2;
      const radius = 0.53;
      kit.box(
        'glass',
        [0.33, 1.55, 0.025],
        [Math.cos(angle) * radius, 1.48, Math.sin(angle) * radius],
        [0, -angle + Math.PI / 2, 0],
      );
    }
    // Cornice and roof.
    kit.cylinder('brass', [0.68, 0.68, 0.16, 8], [0, 2.52, 0]);
    kit.cylinder('brassDark', [0.8, 0.72, 0.12, 8], [0, 2.66, 0]);
    kit.lathe(
      'brassDark',
      [
        new Vector2(0.78, 0),
        new Vector2(0.72, 0.16),
        new Vector2(0.5, 0.34),
        new Vector2(0.24, 0.48),
        new Vector2(0.08, 0.56),
        new Vector2(0.03, 0.62),
      ],
      8,
      [0, 2.7, 0],
    );
    kit.cylinder('brass', [0.05, 0.07, 0.34, 8], [0, 3.36, 0]);
    kit.sphere('brass', [0.16, 16, 12], [0, 3.58, 0]);
    kit.torus('brass', [0.18, 0.028, 6, 20], [0, 3.57, 0], [0, 0, 0]);
    // Side handles.
    for (const sign of [-1, 1] as const) {
      kit.torus('brassDark', [0.22, 0.03, 6, 18], [sign * 0.62, 1.45, 0], [Math.PI / 2, 0, 0]);
    }
    // Pierced crown band.
    kit.jaliPanel({
      width: 0.9,
      height: 0.22,
      position: [0, 2.49, 0.56],
      pattern: 'chevron',
      frame: false,
      depth: 0.06,
    });
    return kit.merge();
  }, [quality]);

  useEffect(() => () => glow.dispose(), [glow]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const motion = prefersReducedMotion() ? 0 : 1;
    const flicker =
      0.9 +
      Math.sin(t * 10.7) * 0.045 * motion +
      Math.sin(t * 17.3 + 1.1) * 0.03 * motion +
      Math.sin(t * 5.9 + 0.4) * 0.025 * motion;
    if (light.current) light.current.intensity = (night ? 22 : 0.7) * flicker;
    if (flame.current) {
      flame.current.scale.setScalar(night ? 0.92 + flicker * 0.1 : 0.5);
      const targetOpacity = night ? 1 : 0.42;
      const material = flame.current.material as { opacity?: number; transparent?: boolean };
      if (typeof material.opacity === 'number') {
        material.opacity = material.opacity + (targetOpacity - material.opacity) * 0.08;
      }
    }
  });

  return (
    <group position={position} name="the-last-lantern">
      <MergedArchitecture buckets={buckets} materials={materials} name="lantern-brass" castShadow />
      <mesh ref={flame} position={[0, 1.42, 0]} name="lantern-flame">
        <sphereGeometry args={[0.155, 18, 14]} />
        <meshBasicMaterial color={SCENE_COLORS.flame} transparent opacity={night ? 1 : 0.42} toneMapped={false} />
      </mesh>
      <sprite position={[0, 1.5, 0]} scale={night ? [2.2, 2.2, 1] : [0.75, 0.75, 1]}>
        <spriteMaterial
          map={glow}
          color={SCENE_COLORS.lamp}
          transparent
          opacity={night ? 0.6 : 0.1}
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
      <pointLight
        ref={light}
        color={SCENE_COLORS.lamp}
        intensity={night ? 40 : 0.7}
        distance={night ? 26 : 9}
        decay={2}
        position={[0, 1.5, 0]}
      />
    </group>
  );
}

function scrollFoot() {
  const shape = new Shape();
  shape.moveTo(0, 0);
  shape.lineTo(0.34, 0);
  shape.quadraticCurveTo(0.5, 0.14, 0.28, 0.2);
  shape.lineTo(0, 0.2);
  shape.closePath();
  return shape;
}
