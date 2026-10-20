import { Suspense, lazy, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Raycaster, Vector2, type Mesh } from 'three';
import { profileFor } from '../quality';
import { useSceneStore } from '@/state/sceneStore';
import { Atmosphere } from './Atmosphere';
import { CameraRig } from './CameraRig';
import { HeroLantern } from './HeroLantern';
import { Lighting } from './Lighting';
import { Post } from './Post';

const ShellRoom = lazy(() => import('./rooms/ShellRoom'));
const AanganRoom = lazy(() => import('./rooms/AanganRoom'));
const GalleryRoom = lazy(() => import('./rooms/GalleryRoom'));
const ArchiveRoom = lazy(() => import('./rooms/ArchiveRoom'));
const CouncilRoom = lazy(() => import('./rooms/CouncilRoom'));

export function PalaceScene() {
  const quality = useSceneStore((state) => state.quality);
  const room = useSceneStore((state) => state.room);
  const enabledRooms = useSceneStore((state) => state.enabledRooms);
  const enableRoom = useSceneStore((state) => state.enableRoom);
  const profile = profileFor(quality);

  // Stream the two heavy interiors in after first paint, and preload their
  // chunks so a room change never stalls on the network.
  useEffect(() => {
    const preload = () => {
      enableRoom('archive');
      enableRoom('council');
      void import('./rooms/ArchiveRoom');
      void import('./rooms/CouncilRoom');
    };
    const handle =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback(preload, { timeout: 2500 })
        : window.setTimeout(preload, 1400);
    return () => {
      if (typeof window.cancelIdleCallback === 'function' && typeof handle === 'number') {
        window.cancelIdleCallback(handle);
      } else {
        window.clearTimeout(handle);
      }
    };
  }, [enableRoom]);

  useEffect(() => {
    enableRoom(room);
  }, [room, enableRoom]);

  return (
    <>
      <Atmosphere />
      <Lighting />
      <CameraRig />
      <HeroLantern position={[0, 1.63, 0]} />
      <Suspense fallback={null}>
        <ShellRoom />
        {enabledRooms.includes('aangan') ? <AanganRoom /> : null}
        {enabledRooms.includes('gallery') ? <GalleryRoom /> : null}
        {enabledRooms.includes('archive') ? <ArchiveRoom /> : null}
        {enabledRooms.includes('council') ? <CouncilRoom /> : null}
      </Suspense>
      <Post profile={profile} />
      <StatsReporter />
    </>
  );
}

function StatsReporter() {
  const setStats = useSceneStore((state) => state.setStats);
  const debug = useSceneStore((state) => state.debug);
  const gl = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera);
  const scene = useThree((state) => state.scene);
  const frames = useRef(0);
  const last = useRef(0);

  // Debug probe: cast a few rays from the camera and publish what they hit, so
  // an unexpected surface can be identified without guessing from a screenshot.
  useEffect(() => {
    if (!debug) return;
    const raycaster = new Raycaster();
    const timer = window.setInterval(() => {
      const merged = (window as unknown as { __nimbagarh?: string[] }).__nimbagarh;
      if ((merged?.length ?? 0) < 5) return;
      window.clearInterval(timer);
      const probes = [];
      for (const [nx, ny] of [
        [0, 0],
        [-0.33, 0],
        [0.33, 0],
        [0, 0.33],
        [0, -0.4],
      ] as const) {
        raycaster.setFromCamera(new Vector2(nx, ny), camera);
        const hit = raycaster
          .intersectObjects(scene.children, true)
          .find((candidate) => (candidate.object as Mesh).isMesh);
        if (!hit) continue;
        probes.push({
          at: [nx, ny],
          distance: Math.round(hit.distance * 100) / 100,
          point: hit.point.toArray().map((value) => Math.round(value * 100) / 100),
          name: hit.object.name,
          parent: hit.object.parent?.name ?? null,
        });
      }
      (window as unknown as { __nimbagarhProbe?: unknown }).__nimbagarhProbe = probes;
    }, 500);
    return () => window.clearInterval(timer);
  }, [camera, debug, scene]);

  useFrame(({ clock }) => {
    frames.current += 1;
    const time = clock.elapsedTime;
    if (time - last.current < 0.5) return;
    const fps = Math.round(frames.current / (time - last.current));
    setStats({
      fps,
      triangles: gl.info.render.triangles,
      drawCalls: gl.info.render.calls,
      meshes: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      camera: [
        Math.round(camera.position.x * 10) / 10,
        Math.round(camera.position.y * 10) / 10,
        Math.round(camera.position.z * 10) / 10,
      ],
    });
    frames.current = 0;
    last.current = time;
  });

  return null;
}
