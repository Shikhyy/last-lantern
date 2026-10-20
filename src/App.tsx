import { useCallback, useEffect, useState } from 'react';
import { AssetProvider } from './three/assets/AssetProvider';
import { isWebGLAvailable, PalaceCanvas } from './three/PalaceCanvas';
import { Overlay } from './ui/Overlay';
import { GameShell } from './ui/game/GameShell';
import { useSceneStore } from './state/sceneStore';

type WebGLState = 'checking' | 'yes' | 'no';

export function App() {
  const quality = useSceneStore((state) => state.quality);
  const mode = useSceneStore((state) => state.mode);
  const [webgl, setWebgl] = useState<WebGLState>('checking');
  const [contextLost, setContextLost] = useState(false);

  useEffect(() => {
    setWebgl(isWebGLAvailable() ? 'yes' : 'no');
  }, []);

  const onContextLost = useCallback(() => setContextLost(true), []);
  const onContextRestored = useCallback(() => setContextLost(false), []);

  if (webgl === 'no') return <WebGLFallback />;

  return (
    <AssetProvider quality={quality}>
      <div className="app">
        {webgl === 'yes' ? (
          <PalaceCanvas onContextLost={onContextLost} onContextRestored={onContextRestored} />
        ) : null}
        {webgl === 'yes' ? mode === 'game' ? <GameShell /> : <Overlay /> : null}
        {contextLost ? (
          <div className="notice" role="status">
            <span>The graphics context was lost and the flame went out.</span>
            <button type="button" className="ghost-button" onClick={() => window.location.reload()}>
              Reload the palace
            </button>
          </div>
        ) : null}
      </div>
    </AssetProvider>
  );
}

function WebGLFallback() {
  return (
    <div className="fallback-page">
      <div className="fallback-page__inner">
        <p className="wordmark__place">The Last Lantern</p>
        <h1>This palace is drawn with WebGL.</h1>
        <p>
          Nimbagarh is a real-time 3D environment. Your browser did not offer a WebGL context, so the palace cannot be
          raised on this machine.
        </p>
        <p>
          Try a current desktop browser (Chrome, Edge, Firefox or Safari), or enable hardware acceleration if it has
          been switched off.
        </p>
      </div>
    </div>
  );
}
