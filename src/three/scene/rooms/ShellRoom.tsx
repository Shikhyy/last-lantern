import { useMemo } from 'react';
import { MergedArchitecture } from '../../architecture/MergedArchitecture';
import { DETAIL } from '../../architecture/kit';
import { buildShell } from '../../architecture/rooms/shell';
import { usePalaceMaterials } from '../../materials';
import { useSceneStore } from '@/state/sceneStore';

export default function ShellRoom() {
  const materials = usePalaceMaterials();
  const quality = useSceneStore((state) => state.quality);
  const buckets = useMemo(() => buildShell(DETAIL[quality]), [quality]);

  return <MergedArchitecture buckets={buckets} materials={materials} name="shell" castShadow={false} receiveShadow />;
}
