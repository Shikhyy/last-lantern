import { useMemo } from 'react';
import { MergedArchitecture } from '../../architecture/MergedArchitecture';
import { DETAIL } from '../../architecture/kit';
import { buildCouncil } from '../../architecture/rooms/council';
import { usePalaceMaterials } from '../../materials';
import { profileFor } from '../../quality';
import { useSceneStore } from '@/state/sceneStore';
import { Candlesticks, DiyaLamp, GlowHalo, LampLight } from '../Lamps';

export default function CouncilRoom() {
  const materials = usePalaceMaterials();
  const quality = useSceneStore((state) => state.quality);
  const timeOfDay = useSceneStore((state) => state.timeOfDay);
  const profile = profileFor(quality);
  const buckets = useMemo(() => buildCouncil(DETAIL[quality]), [quality]);
  const night = timeOfDay === 'night';

  return (
    <group name="room-council">
      <MergedArchitecture buckets={buckets} materials={materials} name="council" />
      {/* Chandelier: a brass ring of diyas above the round table. */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <DiyaLamp
            key={i}
            position={[21.4 + Math.cos(angle) * 1.5, 4.55, Math.sin(angle) * 1.5]}
            scale={1.05}
            phase={i * 0.9}
            light={night && i < Math.max(1, Math.round(profile.lampLights / 2))}
          />
        );
      })}
      <GlowHalo position={[21.4, 4.4, 0]} scale={night ? 9 : 4} opacity={night ? 0.4 : 0.16} />
      <Candlesticks position={[29.2, 0.82, 0]} scale={1.2} light={night} />
      <Candlesticks position={[30.4, 0.82, -1.6]} scale={1.0} light={night && profile.lampLights > 1} />
      {night ? <LampLight position={[29.4, 3.4, 0]} distance={14} intensity={9} phase={1.3} /> : null}
      {night ? <LampLight position={[17.4, 4.2, 0]} distance={12} intensity={5} phase={2.4} /> : null}
    </group>
  );
}
