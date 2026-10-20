import { useEffect, useMemo, useRef, useState } from 'react';
import { audio } from '@/audio/audio';
import { playerView, type PlayerView } from '@/game/views';
import type { Role } from '@/game/types';
import { useGameStore } from '@/state/gameStore';
import { useSceneStore } from '@/state/sceneStore';
import { useSettingsStore } from '@/state/settingsStore';
import { Casebook } from './Casebook';
import { EndingScreen } from './EndingScreen';
import { MatchOverlays, type OverlayId } from './MatchOverlays';
import { PhasePanel } from './PhasePanels';
import { TitleFlow } from './TitleFlow';
import { Icon } from './Icon';
import { OpeningSequence } from './OpeningSequence';
import { SceneCue } from './SceneCue';
import { cueForAction, type CinematicCue } from './cinematics';

const PHASE_LABEL: Record<string, string> = {
  dawn: 'Dawn',
  day: 'Day',
  dusk: 'Dusk',
  council: 'Council',
  night: 'Night',
  judgment: 'Judgment',
  finale: 'The Finale',
  ending: 'Ending',
};

const ROLE_LABEL: Record<Role, string> = {
  shadow: 'Shadowed',
  keeper: 'Lantern Keeper',
  warden: 'Warden',
  oathkeeper: 'Oathkeeper',
};

export function GameShell() {
  const status = useGameStore((state) => state.status);
  const intro = useGameStore((state) => state.intro);
  const match = useGameStore((state) => state.match);
  const view = useMemo(() => (match ? playerView(match) : null), [match]);
  return (
    <div className="game">
      {status === 'title' || !view ? (
        <TitleFlow />
      ) : intro ? (
        <OpeningSequence view={view} />
      ) : view.phase === 'ending' ? (
        <EndingScreen view={view} />
      ) : (
        <MatchScreen />
      )}
      <Toast />
    </div>
  );
}

function MatchScreen() {
  const match = useGameStore((state) => state.match);
  const notice = useGameStore((state) => state.notice);
  const act = useGameStore((state) => state.act);
  const goToRoom = useGameStore((state) => state.goToRoom);
  const restart = useGameStore((state) => state.restart);
  const actionSeq = useGameStore((state) => state.actionSeq);
  const phaseBefore = useGameStore((state) => state.phaseBefore);
  const lastEvents = useGameStore((state) => state.lastEvents);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [cue, setCue] = useState<CinematicCue | null>(null);
  const [overlay, setOverlay] = useState<OverlayId | null>(null);
  const shownSeq = useRef(0);
  const muted = useSettingsStore((state) => state.settings.muted);
  const setSettings = useSettingsStore((state) => state.set);

  const view = useMemo(() => (match ? playerView(match) : null), [match]);

  useEffect(() => {
    const start = () => {
      audio.start();
      audio.setNight(['dusk', 'council', 'night'].includes(view?.phase ?? ''));
    };
    window.addEventListener('pointerdown', start, { once: true });
    window.addEventListener('keydown', start, { once: true });
    return () => {
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
    };
  }, [view?.phase]);

  useEffect(() => {
    audio.setNight(['dusk', 'council', 'night'].includes(view?.phase ?? ''));
  }, [view?.phase]);

  useEffect(() => {
    if (!view || actionSeq === shownSeq.current || cue) return;
    shownSeq.current = actionSeq;
    if (actionSeq <= 0) return;
    const next = cueForAction(view, phaseBefore, lastEvents);
    if (next) setCue(next);
  }, [actionSeq, cue, lastEvents, phaseBefore, view]);

  if (!view || !match) return null;

  const setMode = useSceneStore.getState();
  const room = match.currentRoom;

  const restoreTime = ['dawn', 'day', 'judgment', 'ending'].includes(view.phase) ? 'day' : 'night';

  const toggleMute = () => {
    audio.start();
    setSettings({ muted: !muted });
  };

  return (
    <div className={cue ? 'match is-cueing' : 'match'}>
      <header className="match__bar" aria-hidden={cue ? true : undefined}>
        <div className="match__brand">
          <span className="match__title">The Last Lantern</span>
          <span className="match__place">Nimbagarh</span>
        </div>

        <div className="match__phase">
          <span className="match__phase-kicker">Night {view.round}</span>
          <span className="match__phase-name">{PHASE_LABEL[view.phase] ?? view.phase}</span>
        </div>

        <LanternMeter value={view.lantern} />

        <div className="match__tools" aria-label="Match tools">
          <button type="button" className="icon-button" onClick={() => setOverlay('dossier')} aria-label="Open dossiers" title="Dossiers">
            <Icon name="users" />
          </button>
          <button type="button" className="icon-button" onClick={() => setOverlay('casebook')} aria-label="Open casebook" title="Casebook">
            <Icon name="book" />
          </button>
          <button type="button" className="icon-button" onClick={() => setOverlay('missions')} aria-label="Open the work of the day" title="Work of the day">
            <Icon name="board" />
          </button>
          <button type="button" className="icon-button" onClick={() => setOverlay('transcript')} aria-label="Open the transcript" title="Transcript">
            <Icon name="archive" />
          </button>
          <button type="button" className="icon-button" onClick={() => setOverlay('help')} aria-label="How to play" title="How to play">
            <Icon name="mask" />
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={toggleMute}
            aria-label={muted ? 'Turn sound on' : 'Mute ambience'}
            title={muted ? 'Turn sound on' : 'Mute ambience'}
          >
            <Icon name={muted ? 'mute' : 'sound'} />
          </button>
          <button type="button" className="icon-button" onClick={() => setOverlay('settings')} aria-label="Settings" title="Settings">
            <Icon name="gear" />
          </button>
        </div>

        <div className="match__controls">
          <button type="button" className="ghost-button" onClick={() => setMode.setMode('explore')}>
            Walk the palace
          </button>
          {confirmRestart ? (
            <span className="match__confirm">
              <button type="button" className="ghost-button is-danger" onClick={() => restart()}>
                Restart
              </button>
              <button type="button" className="ghost-button" onClick={() => setConfirmRestart(false)}>
                Keep
              </button>
            </span>
          ) : (
            <button type="button" className="ghost-button" onClick={() => setConfirmRestart(true)}>
              Restart
            </button>
          )}
        </div>
      </header>

      <main className="match__grid" aria-hidden={cue ? true : undefined}>
        <aside className="rail rail--left" aria-label="The table">
          <div className="rail__head">
            <h2>The table</h2>
            <span className="rail__count">{view.contestants.filter((entry) => entry.alive).length} / 12</span>
          </div>

          <RoleCard view={view} />

          <ul className="roster">
            {[...view.contestants]
              .sort((a, b) => Number(b.isPlayer) - Number(a.isPlayer) || Number(b.alive) - Number(a.alive))
              .map((contestant) => (
                <li
                  key={contestant.id}
                  className={
                    contestant.alive
                      ? contestant.isPlayer
                        ? 'roster__item is-you'
                        : 'roster__item'
                      : 'roster__item is-dead'
                  }
                >
                  <span className="roster__dot" aria-hidden="true" />
                  <div className="roster__body">
                    <span className="roster__name">
                      {contestant.name}
                      {contestant.isPlayer ? <em> You</em> : null}
                    </span>
                    <span className="roster__meta">
                      {contestant.revealedRole
                        ? ROLE_LABEL[contestant.revealedRole]
                        : contestant.alive
                          ? contestant.socialTendency
                          : `Left on night ${contestant.eliminatedOn ?? '—'}`}
                    </span>
                  </div>
                  <span className="roster__ledger" title={`${contestant.embers} embers · ${contestant.shields} shields`}>
                    {contestant.shields > 0 ? <span className="pip">{contestant.shields}◈</span> : null}
                    <span className="embers">{contestant.embers}</span>
                  </span>
                </li>
              ))}
          </ul>

          <div className="rail__foot">
            <p className="rail__hint">{view.phaseHint}</p>
          </div>
        </aside>

        <section className="stage" aria-label="Your turn">
          <PhasePanel view={view} onAction={act} onRoom={goToRoom} />
        </section>

        <aside className="rail rail--right" aria-label="Casebook">
          <Casebook view={view} onAction={act} />
        </aside>
      </main>

      <footer className="match__foot" aria-hidden={cue ? true : undefined}>
        <span className="match__message" aria-live="polite">
          {notice ?? view.lastMessage}
        </span>
        <span className="match__room">In the {roomLabel(room)}</span>
      </footer>
      {cue ? (
        <SceneCue
          cue={cue}
          restoreRoom={match.currentRoom}
          restoreTime={restoreTime}
          onDone={() => setCue(null)}
        />
      ) : null}
      {overlay ? (
        <MatchOverlays
          overlay={overlay}
          view={view}
          onClose={() => setOverlay(null)}
          onAction={act}
          onRestart={() => {
            setOverlay(null);
            restart();
          }}
        />
      ) : null}
    </div>
  );
}

function RoleCard({ view }: { view: PlayerView }) {
  const me = view.contestants.find((entry) => entry.isPlayer);
  const allies = view.shadowAllies
    .map((id) => view.contestants.find((entry) => entry.id === id)?.name)
    .filter(Boolean);
  return (
    <section className={`role-card role-card--${view.ownRole}`}>
      <p className="role-card__kicker">Your seat</p>
      <h3>{me?.name ?? 'The Stranger'}</h3>
      <p className="role-card__role">{ROLE_LABEL[view.ownRole]}</p>
      {view.ownOathTitle ? <p className="role-card__oath">“{view.ownOathTitle}”</p> : null}
      {view.ownRole === 'shadow' ? (
        <p className="role-card__allies">
          Shadowed with you: <b>{allies.join(', ') || 'no one left'}</b>
        </p>
      ) : null}
      {view.ownRole === 'keeper' && view.intel.reads.length > 0 ? (
        <p className="role-card__allies">
          Last Read:{' '}
          <b>
            {nameIn(view, view.intel.reads[view.intel.reads.length - 1].targetId)} —{' '}
            {view.intel.reads[view.intel.reads.length - 1].faction === 'shadow' ? 'Shadowed' : 'Oathkeeper'}
          </b>
        </p>
      ) : null}
      {view.ownRole === 'warden' && view.intel.wards.length > 0 ? (
        <p className="role-card__allies">
          Last ward: <b>{nameIn(view, view.intel.wards[view.intel.wards.length - 1].targetId)}</b>
        </p>
      ) : null}
    </section>
  );
}

function LanternMeter({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(120, value));
  return (
    <div className={value <= 35 ? 'lantern-meter is-low' : 'lantern-meter'} aria-label={`Last Lantern ${value} of 120`}>
      <div className="lantern-meter__row">
        <span className="lantern-meter__label">The Last Lantern</span>
        <span className="lantern-meter__value">{value}</span>
      </div>
      <div className="lantern-meter__track">
        <span className="lantern-meter__fill" style={{ transform: `scaleX(${clamped / 120})` }} />
      </div>
    </div>
  );
}

function Toast() {
  const error = useGameStore((state) => state.error);
  const notice = useGameStore((state) => state.notice);
  const dismiss = useGameStore((state) => state.dismiss);
  const [visible, setVisible] = useState(false);
  const [shown, setShown] = useState<{ kind: 'error' | 'notice'; text: string } | null>(null);

  useEffect(() => {
    if (!error && !notice) return undefined;
    setShown(error ? { kind: 'error', text: error } : { kind: 'notice', text: notice! });
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), error ? 7000 : 3200);
    return () => window.clearTimeout(timer);
  }, [error, notice]);

  if (!shown) return null;
  return (
    <div className={visible ? `toast toast--${shown.kind} is-visible` : `toast toast--${shown.kind}`} role="status">
      <p>{shown.text}</p>
      {shown.kind === 'error' ? (
        <button type="button" className="toast__close" onClick={dismiss} aria-label="Dismiss">
          ×
        </button>
      ) : null}
    </div>
  );
}

export function nameIn(view: PlayerView, id: string | null): string {
  if (!id) return '—';
  return view.contestants.find((entry) => entry.id === id)?.name ?? id;
}

function roomLabel(room: string): string {
  switch (room) {
    case 'gallery':
      return 'Long Gallery';
    case 'archive':
      return 'Archive';
    case 'council':
      return 'Council Chamber';
    default:
      return 'Aangan';
  }
}
