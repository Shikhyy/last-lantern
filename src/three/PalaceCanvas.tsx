import { Canvas, useThree } from '@react-three/fiber';
import { Component, Suspense, useEffect, useMemo, type ReactNode } from 'react';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import { profileFor } from './quality';
import { PalaceScene } from './scene/PalaceScene';
import { useSceneStore } from '@/state/sceneStore';

export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const context =
      canvas.getContext('webgl2') ??
      canvas.getContext('webgl') ??
      canvas.getContext('experimental-webgl');
    return Boolean(context);
  } catch {
    return false;
  }
}

export interface PalaceCanvasProps {
  onContextLost: () => void;
  onContextRestored: () => void;
}

export function PalaceCanvas({ onContextLost, onContextRestored }: PalaceCanvasProps) {
  const quality = useSceneStore((state) => state.quality);
  const profile = useMemo(() => profileFor(quality), [quality]);
  // `?capture=1` keeps the drawing buffer so the still-capture script can read
  // exact canvas pixels instead of a compositor screenshot.
  const capture = useMemo(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('capture'),
    [],
  );

  return (
    <Canvas
      className="palace-canvas"
      dpr={profile.dpr}
      shadows={profile.shadows}
      camera={{ fov: 38, near: 0.1, far: 1200, position: [-17.5, 8.2, 24.5] }}
      gl={{
        antialias: profile.tier !== 'low',
        powerPreference: 'high-performance',
        alpha: false,
        stencil: false,
        depth: true,
        preserveDrawingBuffer: capture,
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = profile.tier === 'low' ? 0.9 : 0.78;
        gl.outputColorSpace = SRGBColorSpace;
      }}
    >
      <ContextGuard onLost={onContextLost} onRestored={onContextRestored} />
      <SceneBoundary fallback={<SceneFallback />}>
        <Suspense fallback={null}>
          <PalaceScene />
        </Suspense>
      </SceneBoundary>
    </Canvas>
  );
}

function ContextGuard({ onLost, onRestored }: { onLost: () => void; onRestored: () => void }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    const handleLost = (event: Event) => {
      event.preventDefault();
      onLost();
    };
    const handleRestored = () => onRestored();
    canvas.addEventListener('webglcontextlost', handleLost);
    canvas.addEventListener('webglcontextrestored', handleRestored);
    return () => {
      canvas.removeEventListener('webglcontextlost', handleLost);
      canvas.removeEventListener('webglcontextrestored', handleRestored);
    };
  }, [gl, onLost, onRestored]);
  return null;
}

interface BoundaryState {
  failed: boolean;
}

export class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[nimbagarh] scene error', error);
  }

  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

/** Flat-stone degradation: geometry survives, expensive materials do not. */
function SceneFallback() {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[28, 0.3, 22]} />
        <meshStandardMaterial color={0x9a7a55} roughness={0.95} />
      </mesh>
      <mesh position={[0, 5, -11]}>
        <boxGeometry args={[28, 10, 0.7]} />
        <meshStandardMaterial color={0x8a6a45} roughness={0.95} />
      </mesh>
    </group>
  );
}
