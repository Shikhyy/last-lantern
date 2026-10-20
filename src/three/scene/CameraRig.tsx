import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { ROOM_LABELS } from '../architecture/layout';
import { useSceneStore } from '@/state/sceneStore';

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function CameraRig() {
  const room = useSceneStore((state) => state.room);
  const cameraOverride = useSceneStore((state) => state.cameraOverride);
  const camera = useThree((state) => state.camera);
  const controls = useRef<OrbitControlsImpl>(null);
  const desiredPosition = useRef(new Vector3());
  const desiredTarget = useRef(new Vector3());
  const currentTarget = useRef(new Vector3());
  const transition = useRef(1);
  const dragging = useRef(false);

  const preset = cameraOverride ?? ROOM_LABELS[room].camera;

  // On mount, seat the camera instantly; after that, only presets move it.
  useEffect(() => {
    camera.position.set(preset.position[0], preset.position[1], preset.position[2]);
    currentTarget.current.set(preset.target[0], preset.target[1], preset.target[2]);
    camera.lookAt(currentTarget.current);
    if (controls.current) controls.current.target.copy(currentTarget.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera]);

  useEffect(() => {
    desiredPosition.current.set(preset.position[0], preset.position[1], preset.position[2]);
    desiredTarget.current.set(preset.target[0], preset.target[1], preset.target[2]);
    if ('fov' in camera && typeof preset.fov === 'number') {
      camera.fov = preset.fov;
      camera.updateProjectionMatrix();
    }
    transition.current = 0;
  }, [room, camera, preset]);

  useFrame(({ clock, pointer }, delta) => {
    const dt = Math.min(delta, 0.05);
    const motion = reducedMotion() ? 0 : 1;

    if (transition.current < 1) {
      transition.current = Math.min(1, transition.current + dt / 2.4);
      const k = 1 - Math.exp(-dt * 3.4);
      camera.position.lerp(desiredPosition.current, k);
      currentTarget.current.lerp(desiredTarget.current, k);
    } else if (!dragging.current) {
      // A slow, restrained drift keeps the room feeling alive without orbiting.
      const t = clock.elapsedTime;
      const drift = new Vector3(Math.sin(t * 0.09) * 0.42 * motion, Math.sin(t * 0.061) * 0.18 * motion, 0);
      camera.position.lerp(desiredPosition.current.clone().add(drift), 1 - Math.exp(-dt * 1.2));
      currentTarget.current.lerp(desiredTarget.current, 1 - Math.exp(-dt * 1.6));
    }

    if (controls.current) {
      controls.current.target.copy(currentTarget.current);
      controls.current.update();
    }
    void pointer;
  });

  useEffect(() => {
    const instance = controls.current;
    if (!instance) return;
    const onStart = () => {
      dragging.current = true;
      transition.current = 1;
    };
    const onEnd = () => {
      dragging.current = false;
      desiredPosition.current.copy(instance.object.position);
      desiredTarget.current.copy(instance.target);
    };
    instance.addEventListener('start', onStart);
    instance.addEventListener('end', onEnd);
    return () => {
      instance.removeEventListener('start', onStart);
      instance.removeEventListener('end', onEnd);
    };
  }, []);

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableDamping={false}
      minDistance={3}
      maxDistance={90}
      minPolarAngle={0.12}
      maxPolarAngle={Math.PI / 2 - 0.015}
    />
  );
}
