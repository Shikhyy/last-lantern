import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { useLayoutEffect, useRef } from 'react';
import { Vector3 } from 'three';
import { useCinematicStore } from '@/state/cinematicStore';
import { motionReduced } from '@/state/settingsStore';

const prefersReducedMotion = () => motionReduced();

/**
 * Drives the camera during authored sequences. The rig resumes its own room
 * preset the moment a sequence closes, so a skipped scene never strands the
 * player inside a wall or in a control-less camera.
 */
export function CinematicCamera() {
  const camera = useThree((state) => state.camera);
  const active = useCinematicStore((state) => state.active);
  const shots = useCinematicStore((state) => state.shots);
  const index = useCinematicStore((state) => state.index);
  const target = useRef(new Vector3());
  const initialised = useRef(false);

  useLayoutEffect(() => {
    if (!initialised.current) {
      const direction = new Vector3();
      camera.getWorldDirection(direction);
      target.current.copy(camera.position).add(direction.multiplyScalar(12));
      initialised.current = true;
    }
    if (!active) return undefined;
    const shot = shots[index];
    if (!shot) return undefined;

    if (prefersReducedMotion()) {
      camera.position.set(...shot.position);
      target.current.set(...shot.target);
      camera.lookAt(target.current);
      if ('fov' in camera) {
        camera.fov = shot.fov;
        camera.updateProjectionMatrix();
      }
      return undefined;
    }

    const timeline = gsap.timeline();
    timeline.to(
      camera.position,
      {
        x: shot.position[0],
        y: shot.position[1],
        z: shot.position[2],
        duration: shot.duration,
        ease: shot.ease ?? 'power2.inOut',
      },
      0,
    );
    timeline.to(
      target.current,
      {
        x: shot.target[0],
        y: shot.target[1],
        z: shot.target[2],
        duration: shot.duration,
        ease: shot.ease ?? 'power2.inOut',
      },
      0,
    );
    if ('fov' in camera) {
      timeline.to(
        camera,
        {
          fov: shot.fov,
          duration: shot.duration,
          ease: shot.ease ?? 'power2.inOut',
          onUpdate: () => camera.updateProjectionMatrix(),
        },
        0,
      );
    }
    return () => {
      timeline.kill();
    };
  }, [active, camera, index, shots]);

  useFrame(() => {
    if (!active) return;
    camera.lookAt(target.current);
  });

  return null;
}
