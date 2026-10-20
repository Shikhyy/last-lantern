import { useMemo } from 'react';
import { MergedArchitecture } from '../../architecture/MergedArchitecture';
import { DETAIL } from '../../architecture/kit';
import { LAYOUT } from '../../architecture/layout';
import { buildArchive } from '../../architecture/rooms/archive';
import { usePalaceMaterials } from '../../materials';
import { profileFor } from '../../quality';
import { useSceneStore } from '@/state/sceneStore';
import { DustMotes } from '../Dust';
import { BrassVessel, Candlesticks, DiyaLamp, LampLight } from '../Lamps';

export default function ArchiveRoom() {
  const materials = usePalaceMaterials();
  const quality = useSceneStore((state) => state.quality);
  const timeOfDay = useSceneStore((state) => state.timeOfDay);
  const profile = profileFor(quality);
  const buckets = useMemo(() => buildArchive(DETAIL[quality]), [quality]);
  const night = timeOfDay === 'night';
  const { archive } = LAYOUT;

  return (
    <group name="room-archive">
      <MergedArchitecture buckets={buckets} materials={materials} name="archive" />
      <DiyaLamp position={[-22, 3.6, 0]} scale={1.1} light={night} phase={0.4} />
      <DiyaLamp position={[-27.5, 3.6, -3.5]} scale={1.1} light={night && profile.lampLights > 1} phase={2.1} />
      <Candlesticks position={[-22, 0.9, 0]} scale={1.05} light={night} />
      <BrassVessel position={[-28.4, 0.0, 4.6]} scale={1.1} />
      <BrassVessel position={[archive.minX + 3.15, 0.0, archive.maxZ - 1.4]} scale={0.9} rotation={[0, 0.6, 0]} />
      <Candlesticks position={[-19.4, 0.9, -2.6]} scale={0.9} light={night && profile.lampLights > 2} />
      {night ? <LampLight position={[-24, 3.2, 0]} distance={12} intensity={5} phase={0.9} /> : null}
      {profile.dustMotes > 0 ? (
        <DustMotes count={Math.round(profile.dustMotes * 0.7)} size={[14, 4.6, 10]} center={[-22, 2.6, 0]} opacity={0.5} />
      ) : null}
    </group>
  );
}
