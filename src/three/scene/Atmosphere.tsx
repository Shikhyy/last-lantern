import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { FogExp2 } from 'three';
import { usePalaceAssets } from '../assets/AssetProvider';
import { useSceneStore } from '@/state/sceneStore';

/**
 * Applies the chosen HDRI as both image-based lighting and the visible sky.
 * The two Dubrovnik/desert HDRIs are pure-sky, so our own desert plane stays
 * the ground and the horizon never fights the palace.
 */
export function Atmosphere() {
  const { hdri } = usePalaceAssets();
  const timeOfDay = useSceneStore((state) => state.timeOfDay);
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    const map = hdri[timeOfDay];
    scene.environment = map;
    scene.background = map;
    scene.environmentIntensity = timeOfDay === 'night' ? 0.32 : 0.76;
    scene.backgroundIntensity = timeOfDay === 'night' ? 0.64 : 0.9;
    scene.backgroundBlurriness = timeOfDay === 'night' ? 0.22 : 0.1;
    scene.backgroundRotation.set(0, timeOfDay === 'night' ? 0.7 : 2.5, 0);
    scene.environmentRotation.set(0, timeOfDay === 'night' ? 0.7 : 2.5, 0);
    scene.fog = new FogExp2(timeOfDay === 'night' ? 0x0b1424 : 0xcaa277, timeOfDay === 'night' ? 0.0028 : 0.0017);
    return () => {
      if (scene.environment === map) scene.environment = null;
      if (scene.background === map) scene.background = null;
      scene.fog = null;
    };
  }, [hdri, timeOfDay, scene]);

  return null;
}
