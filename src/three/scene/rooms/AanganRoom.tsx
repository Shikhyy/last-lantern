import { useMemo } from 'react';
import { MergedArchitecture } from '../../architecture/MergedArchitecture';
import { DETAIL } from '../../architecture/kit';
import { LAYOUT } from '../../architecture/layout';
import { buildAangan } from '../../architecture/rooms/aangan';
import { usePalaceMaterials } from '../../materials';
import { useSceneStore } from '@/state/sceneStore';
import { profileFor } from '../../quality';
import { DiyaLamp, GlowHalo } from '../Lamps';
import { RippleSurface } from '../Water';

export default function AanganRoom() {
  const materials = usePalaceMaterials();
  const quality = useSceneStore((state) => state.quality);
  const timeOfDay = useSceneStore((state) => state.timeOfDay);
  const profile = profileFor(quality);
  const night = timeOfDay === 'night';
  const buckets = useMemo(() => buildAangan(DETAIL[quality]), [quality]);
  const channelStart = 2.9;
  const channelLength = LAYOUT.courtyard.openHalfX - channelStart - 0.6;
  const lampPositions: [number, number][] = [
    [-7.3, -5.2],
    [7.3, -5.2],
    [-7.3, 5.2],
    [7.3, 5.2],
  ];

  return (
    <group name="room-aangan">
      <MergedArchitecture buckets={buckets} materials={materials} name="aangan" />
      <RippleSurface shape="circle" radius={2.26} position={[0, 0.47, 0]} repeat={2.4} speed={0.009} opacity={0.94} normalScale={0.55} />
      {([-1, 1] as const).map((sign) => (
        <RippleSurface
          key={sign}
          size={[channelLength, 0.8]}
          position={[sign * (channelStart + channelLength / 2), 0.07, 0]}
          repeat={3}
          speed={0.02}
          opacity={0.9}
        />
      ))}
      {lampPositions.map(([x, z], index) => (
        <group key={`${x}-${z}`} position={[x, 0, z]}>
          <mesh position={[0, 0.82, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.23, 0.34, 1.64, 10]} />
            <primitive object={materials.sandstonePale} attach="material" />
          </mesh>
          <mesh position={[0, 1.68, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.4, 0.28, 0.14, 10]} />
            <primitive object={materials.sandstonePale} attach="material" />
          </mesh>
          <DiyaLamp position={[0, 1.82, 0]} phase={index * 1.3} light={night && index < Math.max(1, profile.lampLights)} />
          <GlowHalo position={[0, 1.98, 0]} scale={night ? 1.55 : 0.7} opacity={night ? 0.5 : 0.1} />
        </group>
      ))}
    </group>
  );
}
