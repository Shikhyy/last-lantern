import { useMemo } from 'react';
import { MergedArchitecture } from '../../architecture/MergedArchitecture';
import { DETAIL } from '../../architecture/kit';
import { buildGallery } from '../../architecture/rooms/gallery';
import { usePalaceMaterials } from '../../materials';
import { profileFor } from '../../quality';
import { useSceneStore } from '@/state/sceneStore';
import { DustMotes } from '../Dust';
import { DiyaLamp } from '../Lamps';

export default function GalleryRoom() {
  const materials = usePalaceMaterials();
  const quality = useSceneStore((state) => state.quality);
  const timeOfDay = useSceneStore((state) => state.timeOfDay);
  const profile = profileFor(quality);
  const buckets = useMemo(() => buildGallery(DETAIL[quality]), [quality]);
  const night = timeOfDay === 'night';
  const lampZ = [-18, -25.2, -32.4, -39.6, -46.8, -53];

  return (
    <group name="room-gallery">
      <MergedArchitecture buckets={buckets} materials={materials} name="gallery" />
      {lampZ.map((z, index) => (
        <DiyaLamp
          key={z}
          position={[0.5, 4.05, z]}
          scale={1.15}
          phase={index * 0.7}
          light={night && index < profile.lampLights}
        />
      ))}
      {profile.dustMotes > 0 ? (
        <DustMotes count={profile.dustMotes} size={[5.4, 4.6, 42]} center={[0.6, 2.7, -34]} opacity={0.34} />
      ) : null}
    </group>
  );
}
