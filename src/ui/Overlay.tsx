import { useEffect, useState } from 'react';
import { ROOM_LABELS } from '@/three/architecture/layout';
import { SCENE_CREDITS } from '@/three/assets/manifest';
import type { QualityTier, RoomId } from '@/three/assets/manifest';
import { usePalaceAssets } from '@/three/assets/AssetProvider';
import { useSceneStore } from '@/state/sceneStore';

const ROOMS: RoomId[] = ['aangan', 'gallery', 'archive', 'council'];

const QUALITY_LABEL: Record<QualityTier, string> = {
  high: 'High',
  medium: 'Balanced',
  low: 'Mobile',
};

export function Overlay() {
  const { loading, progress, failures, reload } = usePalaceAssets();
  const room = useSceneStore((state) => state.room);
  const setRoom = useSceneStore((state) => state.setRoom);
  const timeOfDay = useSceneStore((state) => state.timeOfDay);
  const setTimeOfDay = useSceneStore((state) => state.setTimeOfDay);
  const quality = useSceneStore((state) => state.quality);
  const setQuality = useSceneStore((state) => state.setQuality);
  const debug = useSceneStore((state) => state.debug);
  const toggleDebug = useSceneStore((state) => state.toggleDebug);
  const setMode = useSceneStore((state) => state.setMode);
  const [creditsOpen, setCreditsOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName)) {
        return;
      }
      const index = Number.parseInt(event.key, 10);
      if (index >= 1 && index <= ROOMS.length) setRoom(ROOMS[index - 1]);
      if (event.key.toLowerCase() === 'd') setTimeOfDay(timeOfDay === 'day' ? 'night' : 'day');
      if (event.key.toLowerCase() === 'c') setCreditsOpen((open) => !open);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setRoom, setTimeOfDay, timeOfDay]);

  const label = ROOM_LABELS[room];

  return (
    <div className="overlay">
      <header className="topbar">
        <div className="wordmark">
          <span className="wordmark__title">The Last Lantern</span>
          <span className="wordmark__place">Nimbagarh · the Aravalli edge</span>
        </div>
        <div className="topbar__actions" role="group" aria-label="View settings">
          <button type="button" className="button button--primary button--compact" onClick={() => setMode('game')}>
            Play the night
          </button>
          <div className="segmented" role="group" aria-label="Time of day">
            <button
              type="button"
              className={timeOfDay === 'day' ? 'segmented__item is-active' : 'segmented__item'}
              aria-pressed={timeOfDay === 'day'}
              onClick={() => setTimeOfDay('day')}
            >
              Day
            </button>
            <button
              type="button"
              className={timeOfDay === 'night' ? 'segmented__item is-active' : 'segmented__item'}
              aria-pressed={timeOfDay === 'night'}
              onClick={() => setTimeOfDay('night')}
            >
              Night
            </button>
          </div>
          <div className="segmented" role="group" aria-label="Quality">
            {(['high', 'medium', 'low'] as QualityTier[]).map((tier) => (
              <button
                key={tier}
                type="button"
                className={quality === tier ? 'segmented__item is-active' : 'segmented__item'}
                aria-pressed={quality === tier}
                onClick={() => setQuality(tier)}
              >
                {QUALITY_LABEL[tier]}
              </button>
            ))}
          </div>
          <button type="button" className="ghost-button" onClick={() => setCreditsOpen(true)}>
            Provenance
          </button>
          <button
            type="button"
            className={debug ? 'ghost-button is-active' : 'ghost-button'}
            aria-pressed={debug}
            onClick={toggleDebug}
          >
            Diagnostics
          </button>
        </div>
      </header>

      <section className="room-caption" aria-live="polite" key={room}>
        <p className="room-caption__kicker">{label.kicker}</p>
        <h1 className="room-caption__title">{label.title}</h1>
        <p className="room-caption__body">{label.caption}</p>
      </section>

      <nav className="room-nav" aria-label="Palace rooms">
        {ROOMS.map((id, index) => (
          <button
            key={id}
            type="button"
            className={id === room ? 'room-nav__item is-active' : 'room-nav__item'}
            aria-current={id === room ? 'true' : undefined}
            onClick={() => setRoom(id)}
          >
            <span className="room-nav__label">{ROOM_LABELS[id].title.replace(/^The /, '')}</span>
            <span className="room-nav__key" aria-hidden="true">
              {index + 1}
            </span>
          </button>
        ))}
      </nav>

      <p className="credit-line">
        Authored reconstruction · CC0 materials · an interpretation of Rajasthani palace architecture, not a survey
        of Suryagarh.
      </p>

      <p className="hint-line">
        Drag to look · scroll to move closer · <kbd>D</kbd> day / night · <kbd>1</kbd>–<kbd>4</kbd> rooms
      </p>

      {debug ? <Diagnostics /> : null}
      {creditsOpen ? <CreditsPanel onClose={() => setCreditsOpen(false)} /> : null}
      {failures.length > 0 ? (
        <div className="asset-warning" role="status">
          <p>
            {failures.length} asset{failures.length === 1 ? '' : 's'} could not be fetched. The palace falls back to
            flat stone for those surfaces.
          </p>
          <details>
            <summary>Details</summary>
            <ul>
              {failures.slice(0, 8).map((failure) => (
                <li key={failure.key}>
                  <code>{failure.key}</code> — {failure.message}
                </li>
              ))}
            </ul>
          </details>
          <button type="button" className="ghost-button" onClick={reload}>
            Retry assets
          </button>
        </div>
      ) : null}

      <LoadingVeil visible={loading} progress={progress} />
    </div>
  );
}

function LoadingVeil({ visible, progress }: { visible: boolean; progress: number }) {
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (!visible) {
      const timer = window.setTimeout(() => setDismissed(true), 900);
      return () => window.clearTimeout(timer);
    }
    setDismissed(false);
    return undefined;
  }, [visible]);

  if (dismissed && !visible) return null;
  const percent = Math.round(progress * 100);
  return (
    <div className={visible ? 'loading-veil is-visible' : 'loading-veil'} aria-live="polite" aria-busy={visible}>
      <p className="loading-veil__eyebrow">Nimbagarh</p>
      <p className="loading-veil__title">Raising the palace</p>
      <div className="loading-veil__track" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <span className="loading-veil__fill" style={{ transform: `scaleX(${Math.max(0.02, progress)})` }} />
      </div>
      <p className="loading-veil__count">{percent}%</p>
    </div>
  );
}

function Diagnostics() {
  const stats = useSceneStore((state) => state.stats);
  const quality = useSceneStore((state) => state.quality);
  return (
    <dl className="diagnostics" aria-label="Render diagnostics">
      <div>
        <dt>Profile</dt>
        <dd>{QUALITY_LABEL[quality]}</dd>
      </div>
      <div>
        <dt>FPS</dt>
        <dd>{stats.fps}</dd>
      </div>
      <div>
        <dt>Draw calls</dt>
        <dd>{stats.drawCalls}</dd>
      </div>
      <div>
        <dt>Triangles</dt>
        <dd>{stats.triangles.toLocaleString()}</dd>
      </div>
      <div>
        <dt>Geometries</dt>
        <dd>{stats.meshes}</dd>
      </div>
      <div>
        <dt>Textures</dt>
        <dd>{stats.textures}</dd>
      </div>
      <div>
        <dt>Camera</dt>
        <dd>
          {stats.camera[0]}, {stats.camera[1]}, {stats.camera[2]}
        </dd>
      </div>
    </dl>
  );
}

function CreditsPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Provenance and credits">
      <div className="sheet__inner">
        <header className="sheet__header">
          <h2>{SCENE_CREDITS.title}</h2>
          <button type="button" className="ghost-button" onClick={onClose}>
            Close
          </button>
        </header>
        <section>
          <h3>Architecture</h3>
          <p>{SCENE_CREDITS.architecture}</p>
        </section>
        <section>
          <h3>Photographic study references</h3>
          <ul>
            {SCENE_CREDITS.references.map((reference) => (
              <li key={reference}>{reference}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3>Materials, sky and props</h3>
          <p>{SCENE_CREDITS.materials}</p>
          <p>{SCENE_CREDITS.props}</p>
        </section>
        <section>
          <h3>Known limitation</h3>
          <p>{SCENE_CREDITS.limitation}</p>
        </section>
      </div>
    </div>
  );
}
