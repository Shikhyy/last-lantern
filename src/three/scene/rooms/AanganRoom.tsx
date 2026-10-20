import { useMemo } from 'react';
import { MergedArchitecture } from '../../architecture/MergedArchitecture';
import { DETAIL } from '../../architecture/kit';
import { LAYOUT } from '../../architecture/layout';
import { buildAangan } from '../../architecture/rooms/aangan';
import { usePalaceMaterials } from '../../materials';
import { useSceneStore } from '@/state/sceneStore';
import { RippleSurface } from '../Water';

export default function AanganRoom() {
  const materials = usePalaceMaterials();
  const quality = useSceneStore((state) => state.quality);
  const buckets = useMemo(() => buildAangan(DETAIL[quality]), [quality]);
  const channelStart = 2.9;
  const channelLength = LAYOUT.courtyard.openHalfX - channelStart - 0.6;

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
    </group>
  );
}
