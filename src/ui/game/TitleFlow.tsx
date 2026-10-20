import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useEffect, useRef, useState } from 'react';
import { OATHS } from '@/game/cast';
import { loadMatch } from '@/game/save';
import type { Difficulty, MatchOptions, PlayerOath } from '@/game/types';
import { audio } from '@/audio/audio';
import { useArchiveStore, type ArchiveEntry } from '@/state/archiveStore';
import { SAVE_KEY, useGameStore } from '@/state/gameStore';
import { useSceneStore } from '@/state/sceneStore';
import { useSettingsStore } from '@/state/settingsStore';
import { SCENE_CREDITS } from '@/three/assets/manifest';
import { Icon } from './Icon';
import { SettingsFields } from './SettingsFields';

gsap.registerPlugin(useGSAP);

type GateScreen = 'menu' | 'new' | 'continue' | 'archive' | 'settings' | 'credits';

const PRONOUNS = ['they/them', 'she/her', 'he/him'] as const;

const PHASE_NAMES: Record<string, string> = {
  dawn: 'Dawn',
  day: 'Day',
  dusk: 'Dusk',
  council: 'Council',
  night: 'Night',
  judgment: 'Judgment',
  finale: 'Finale',
  ending: 'Ending',
};

function randomSeed(): number {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return buffer[0] || 1;
  }
  return 1;
}

function beginAudio() {
  audio.start();
  audio.sfx('click');
}

export function TitleFlow() {
  const [screen, setScreen] = useState<GateScreen>('menu');
  const reduceMotion = useSettingsStore((state) => state.settings.reducedMotion);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = useSceneStore.getState();
    scene.setRoom('aangan');
    scene.setTimeOfDay('night');
    scene.setCameraOverride({
      position: [-9.5, 4.2, 6.6],
      target: [-1.9, 2.0, -0.9],
      fov: 44,
    });
    scene.enableRoom('gallery');
    return () => {
      useSceneStore.getState().setCameraOverride(null);
      useSceneStore.getState().setTimeOfDay('day');
      useSceneStore.getState().setRoom('aangan');
    };
  }, []);

  useGSAP(
    () => {
      if (reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
      timeline
        .from('.gate__brand > *', { y: 22, autoAlpha: 0, duration: 0.9, stagger: 0.12 })
        .from('.gate__item', { x: -18, autoAlpha: 0, duration: 0.7, stagger: 0.08 }, '-=0.35')
        .from('.gate__aside > *', { y: 16, autoAlpha: 0, duration: 0.8, stagger: 0.1 }, '-=0.55');
      return () => timeline.kill();
    },
    { scope: root, dependencies: [reduceMotion] },
  );

  const go = (next: GateScreen) => {
    beginAudio();
    setScreen(next);
  };

  return (
    <div className="gate" ref={root}>
      <div className="gate__veil" aria-hidden="true" />
      {screen === 'menu' ? <Menu onGo={go} /> : null}
      {screen === 'new' ? <NewMatch onBack={() => go('menu')} /> : null}
      {screen === 'continue' ? <ContinueMatch onBack={() => go('menu')} /> : null}
      {screen === 'archive' ? <ArchiveScreen onBack={() => go('menu')} /> : null}
      {screen === 'settings' ? <SettingsScreen onBack={() => go('menu')} /> : null}
      {screen === 'credits' ? <CreditsScreen onBack={() => go('menu')} /> : null}
      <button
        type="button"
        className="gate__sound"
        onClick={() => {
          beginAudio();
          const settings = useSettingsStore.getState();
          settings.set({ muted: !settings.settings.muted });
        }}
        aria-label={useSettingsStore.getState().settings.muted ? 'Turn sound on' : 'Mute ambience'}
      >
        <Icon name={useSettingsStore((state) => (state.settings.muted ? 'mute' : 'sound'))} />
      </button>
    </div>
  );
}

function Menu({ onGo }: { onGo: (screen: GateScreen) => void }) {
  const hasSave = useGameStore((state) => state.hasSave);
  const saveStatus = useGameStore((state) => state.saveStatus);
  const saveReason = useGameStore((state) => state.saveReason);
  const resume = useGameStore((state) => state.resume);

  return (
    <div className="gate__inner">
      <div className="gate__brand">
        <p className="eyebrow">Nimbagarh · the festival of the last lantern</p>
        <h1>
          The Last
          <br />
          Lantern
        </h1>
        <p className="gate__line">Every oath has a shadow.</p>
      </div>

      <nav className="gate__menu" aria-label="Main menu">
        <button type="button" className="gate__item" onClick={() => onGo('new')}>
          <span className="gate__num">I</span>
          <span className="gate__label">
            New game
            <small>Twelve strangers. Five nights. One flame.</small>
          </span>
          <Icon name="arrow" />
        </button>
        <button
          type="button"
          className="gate__item"
          onClick={() => {
            beginAudio();
            resume();
          }}
          disabled={!hasSave}
        >
          <span className="gate__num">II</span>
          <span className="gate__label">
            Continue
            <small>{hasSave ? 'Return to the table in progress' : 'No session is waiting'}</small>
          </span>
          <Icon name="arrow" />
        </button>
        <button type="button" className="gate__item" onClick={() => onGo('continue')}>
          <span className="gate__num">III</span>
          <span className="gate__label">
            Sessions
            <small>Inspect, export, or import a saved night</small>
          </span>
          <Icon name="archive" />
        </button>
        <button type="button" className="gate__item" onClick={() => onGo('archive')}>
          <span className="gate__num">IV</span>
          <span className="gate__label">
            The archive
            <small>Endings you have reached</small>
          </span>
          <Icon name="book" />
        </button>
        <button type="button" className="gate__item" onClick={() => onGo('settings')}>
          <span className="gate__num">V</span>
          <span className="gate__label">
            Settings
            <small>Motion, quality, contrast, sound</small>
          </span>
          <Icon name="gear" />
        </button>
        <button type="button" className="gate__item" onClick={() => onGo('credits')}>
          <span className="gate__num">VI</span>
          <span className="gate__label">
            Credits
            <small>Materials, references, and the limits of the reconstruction</small>
          </span>
          <Icon name="seal" />
        </button>
      </nav>

      <aside className="gate__aside">
        <div className="gate__seal" aria-hidden="true">
          <Icon name="flame" />
          <span>3</span>
        </div>
        <p>
          Three of the twelve are Shadowed. The Lantern is the only clock. At dawn, the dead are named; at dusk, the
          living choose.
        </p>
        <dl>
          <div>
            <dt>Seats</dt>
            <dd>12</dd>
          </div>
          <div>
            <dt>Shadowed</dt>
            <dd>3</dd>
          </div>
          <div>
            <dt>Nights</dt>
            <dd>5</dd>
          </div>
          <div>
            <dt>Endings</dt>
            <dd>6</dd>
          </div>
        </dl>
        {saveStatus === 'corrupt' ? (
          <p className="gate__damage" role="status">
            <Icon name="warning" />
            A saved session is damaged: {saveReason ?? 'the seal is broken'}. It can be inspected under Sessions.
          </p>
        ) : null}
        <p className="gate__fine">
          A fiction of Nimbagarh. No account, no network, no model. Every line is authored; every draw is local.
        </p>
      </aside>

      <footer className="gate__foot">
        <span>Warm sandstone · desert noir · one flame</span>
        <span>Best with sound, never required</span>
      </footer>
    </div>
  );
}

function NewMatch({ onBack }: { onBack: () => void }) {
  const start = useGameStore((state) => state.start);
  const [name, setName] = useState('The Stranger');
  const [pronouns, setPronouns] = useState<string>(PRONOUNS[0]);
  const [oath, setOath] = useState<PlayerOath>('keep_promise');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [seed, setSeed] = useState(() => String(randomSeed()));
  const [busy, setBusy] = useState(false);

  const submit = () => {
    if (busy) return;
    beginAudio();
    setBusy(true);
    start({
      seed: Number(seed) || randomSeed(),
      playerName: name.trim() || 'The Stranger',
      pronouns,
      oath,
      difficulty,
    });
    window.setTimeout(() => setBusy(false), 600);
  };

  return (
    <div className="sheet">
      <header className="sheet__bar">
        <button type="button" className="text-button" onClick={onBack}>
          <Icon name="arrow" className="is-back" /> Back
        </button>
        <span className="sheet__step">The oath · i</span>
      </header>
      <div className="sheet__body oath-layout">
        <section className="oath-copy">
          <p className="eyebrow">Before the gate</p>
          <h2>Twelve names are read. Yours is the one not written.</h2>
          <p className="lede">
            The Dewan will ask for a name, a pronoun, and one promise. The promise is social, not mechanical: people
            remember what you said you would do.
          </p>
          <blockquote>
            “The flame does not care who is good. It cares who is still in the room when the counting is done.”
            <cite>— Dewan Rudra Pratap</cite>
          </blockquote>
          <dl className="oath-facts">
            <div>
              <dt>Drawn privately</dt>
              <dd>Oathkeeper, Keeper, Warden, or Shadowed</dd>
            </div>
            <div>
              <dt>Playable roles</dt>
              <dd>Any of the four, at random</dd>
            </div>
            <div>
              <dt>Length</dt>
              <dd>25–50 minutes; five nights</dd>
            </div>
          </dl>
        </section>

        <form
          className="oath-form"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <label className="field">
            <span>Name at the table</span>
            <input value={name} maxLength={28} onChange={(event) => setName(event.target.value)} autoFocus />
          </label>

          <fieldset className="field field--choice">
            <legend>Pronouns</legend>
            <div className="segmented segmented--wide">
              {PRONOUNS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={pronouns === option ? 'segmented__item is-active' : 'segmented__item'}
                  aria-pressed={pronouns === option}
                  onClick={() => setPronouns(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="oath-choices">
            <legend>Your oath</legend>
            {OATHS.map((option) => (
              <label key={option.id} className={oath === option.id ? 'oath-choice is-active' : 'oath-choice'}>
                <input
                  type="radio"
                  name="oath"
                  value={option.id}
                  checked={oath === option.id}
                  onChange={() => setOath(option.id)}
                />
                <span className="oath-choice__mark" aria-hidden="true">
                  <Icon name="seal" />
                </span>
                <span>
                  <b>{option.title}</b>
                  <small>{option.description}</small>
                </span>
              </label>
            ))}
          </fieldset>

          <fieldset className="field field--choice">
            <legend>The table</legend>
            <div className="segmented segmented--wide">
              {(['easy', 'normal', 'hard'] as Difficulty[]).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  className={difficulty === tier ? 'segmented__item is-active' : 'segmented__item'}
                  aria-pressed={difficulty === tier}
                  onClick={() => setDifficulty(tier)}
                >
                  {tier === 'easy' ? 'Forgiving' : tier === 'normal' ? 'Balanced' : 'Exacting'}
                </button>
              ))}
            </div>
            <small className="field__note">
              Difficulty changes how quickly the table suspects and how hard it is to recover the Lantern.
            </small>
          </fieldset>

          <details className="seed-field">
            <summary>Reproducible draw</summary>
            <div className="seed-field__row">
              <input
                value={seed}
                inputMode="numeric"
                aria-label="Seed"
                onChange={(event) => setSeed(event.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
              />
              <button type="button" className="button button--quiet" onClick={() => setSeed(String(randomSeed()))}>
                Redraw
              </button>
            </div>
            <small className="field__note">The same seed produces the same cast, roles, and mission draws.</small>
          </details>

          <div className="oath-form__actions">
            <button type="submit" className="button button--primary button--large" disabled={busy}>
              <Icon name="flame" />
              {busy ? 'Sealing the oath…' : 'Swear the oath'}
            </button>
            <p>No account. The session saves to this browser after every decision.</p>
          </div>
        </form>
      </div>
    </div>
  );
}

interface SavedSummary {
  options: MatchOptions;
  name: string;
  phase: string;
  round: number;
  lantern: number;
  living: number;
  savedAt: number | null;
  raw: string;
}

function readSaved(): { summary: SavedSummary | null; reason: string | null } {
  if (typeof window === 'undefined') return { summary: null, reason: null };
  const raw = window.localStorage.getItem(SAVE_KEY);
  if (!raw) return { summary: null, reason: null };
  const loaded = loadMatch(raw);
  if (loaded.status !== 'ok' || !loaded.state) return { summary: null, reason: loaded.reason };
  let savedAt: number | null = null;
  try {
    const parsed = JSON.parse(raw) as { savedAt?: number };
    savedAt = typeof parsed.savedAt === 'number' ? parsed.savedAt : null;
  } catch {
    savedAt = null;
  }
  const player = loaded.state.contestants.find((entry) => entry.isPlayer);
  return {
    summary: {
      options: {
        seed: loaded.state.seed,
        playerName: player?.name ?? 'The Stranger',
        pronouns: player?.pronouns ?? 'they/them',
        oath: player?.oath ?? 'keep_promise',
        difficulty: loaded.state.difficulty,
      },
      name: player?.name ?? 'The Stranger',
      phase: loaded.state.phase,
      round: loaded.state.round,
      lantern: loaded.state.lantern,
      living: loaded.state.contestants.filter((entry) => entry.alive).length,
      savedAt,
      raw,
    },
    reason: null,
  };
}

function ContinueMatch({ onBack }: { onBack: () => void }) {
  const resume = useGameStore((state) => state.resume);
  const refreshSave = useGameStore((state) => state.refreshSave);
  const [saved, setSaved] = useState(() => readSaved());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSaved(readSaved());
  }, []);

  const exportSave = () => {
    if (!saved.summary) return;
    const blob = new Blob([saved.summary.raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `nimbagarh-${saved.summary.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importSave = async (file: File | null) => {
    if (!file) return;
    setError(null);
    try {
      const raw = await file.text();
      const loaded = loadMatch(raw);
      if (loaded.status !== 'ok' || !loaded.state) {
        setError(loaded.reason ?? 'That file is not a valid session.');
        return;
      }
      window.localStorage.setItem(SAVE_KEY, raw);
      refreshSave();
      setSaved(readSaved());
    } catch {
      setError('That file could not be read.');
    }
  };

  return (
    <div className="sheet">
      <header className="sheet__bar">
        <button type="button" className="text-button" onClick={onBack}>
          <Icon name="arrow" className="is-back" /> Back
        </button>
        <span className="sheet__step">Sessions</span>
      </header>
      <div className="sheet__body session-layout">
        <section>
          <p className="eyebrow">The saved night</p>
          <h2>{saved.summary ? 'A session is waiting.' : 'No session at this table.'}</h2>
          <p className="lede">
            The game saves after every decision, in this browser only. Export a session if you want to carry it to
            another machine; no server ever sees it.
          </p>

          {saved.summary ? (
            <article className="session-card">
              <div className="session-card__seal">
                <Icon name="flame" />
                <span>{saved.summary.lantern}</span>
              </div>
              <div>
                <p className="eyebrow">
                  {PHASE_NAMES[saved.summary.phase] ?? saved.summary.phase} · night {saved.summary.round}
                </p>
                <h3>{saved.summary.name}</h3>
                <p>
                  {saved.summary.living} still at the table · {saved.summary.options.difficulty} · seed{' '}
                  {saved.summary.options.seed}
                </p>
                {saved.summary.savedAt ? (
                  <p className="quiet">
                    Saved {new Date(saved.summary.savedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                ) : null}
              </div>
            </article>
          ) : (
            <div className="empty">
              <Icon name="archive" />
              <p>No save is stored. Begin a new match to write one.</p>
            </div>
          )}

          {error || saved.reason ? (
            <p className="form-error" role="alert">
              <Icon name="warning" /> {error ?? saved.reason}
            </p>
          ) : null}

          <div className="sheet__actions">
            <button
              type="button"
              className="button button--primary"
              disabled={!saved.summary}
              onClick={() => {
                beginAudio();
                resume();
              }}
            >
              Continue the night
            </button>
            <button type="button" className="button" disabled={!saved.summary} onClick={exportSave}>
              Export JSON
            </button>
            <button type="button" className="button" onClick={() => fileRef.current?.click()}>
              Import JSON
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(event) => void importSave(event.target.files?.[0] ?? null)}
            />
          </div>

          {saved.summary ? (
            <div className="session-danger">
              {confirmDelete ? (
                <>
                  <p>Delete this saved session? The archive of finished endings is kept.</p>
                  <button
                    type="button"
                    className="button button--danger"
                    onClick={() => {
                      window.localStorage.removeItem(SAVE_KEY);
                      refreshSave();
                      setSaved(readSaved());
                      setConfirmDelete(false);
                    }}
                  >
                    Delete session
                  </button>
                  <button type="button" className="button" onClick={() => setConfirmDelete(false)}>
                    Keep it
                  </button>
                </>
              ) : (
                <button type="button" className="text-button text-button--danger" onClick={() => setConfirmDelete(true)}>
                  Delete this session
                </button>
              )}
            </div>
          ) : null}
        </section>

        <aside className="session-note">
          <Icon name="seal" />
          <h3>One session, one truth</h3>
          <p>
            Loading a session never re-deals roles. If a file was edited by hand, its checksum fails and the palace
            refuses it rather than guessing what changed.
          </p>
          <p>
            A new match replaces the current save. Finished endings go to the Archive and are never overwritten by a
            restart.
          </p>
        </aside>
      </div>
    </div>
  );
}

function ArchiveScreen({ onBack }: { onBack: () => void }) {
  const entries = useArchiveStore((state) => state.entries);
  const remove = useArchiveStore((state) => state.remove);
  const clear = useArchiveStore((state) => state.clear);
  const start = useGameStore((state) => state.start);
  const [confirmClear, setConfirmClear] = useState(false);

  const replay = (entry: ArchiveEntry) => {
    beginAudio();
    start({ ...entry.options, seed: entry.seed });
  };

  return (
    <div className="sheet">
      <header className="sheet__bar">
        <button type="button" className="text-button" onClick={onBack}>
          <Icon name="arrow" className="is-back" /> Back
        </button>
        <span className="sheet__step">The archive · {entries.length}</span>
      </header>
      <div className="sheet__body archive-layout">
        <section>
          <p className="eyebrow">What the palace remembers</p>
          <h2>Endings</h2>
          <p className="lede">
            Every finished match leaves one page. Replay an old draw to test a different argument, or read how the
            court unmasked itself.
          </p>

          {entries.length === 0 ? (
            <div className="empty empty--large">
              <Icon name="book" />
              <h3>The archive is empty.</h3>
              <p>Finish a match and the last page will be kept here.</p>
              <button type="button" className="button" onClick={onBack}>
                Return to the gate
              </button>
            </div>
          ) : (
            <ul className="archive-list">
              {entries.map((entry) => (
                <li key={entry.id} className={`archive-entry is-${entry.faction}`}>
                  <div className="archive-entry__head">
                    <span className="eyebrow">
                      {entry.faction === 'oathkeeper' ? 'The flame holds' : 'The flame is taken'} · night {entry.night}
                    </span>
                    <span className="archive-entry__lantern">{entry.lantern} lantern</span>
                  </div>
                  <h3>{entry.endingTitle}</h3>
                  <p>
                    {entry.playerName} · {entry.playerRole} · {entry.survived ? 'survived' : 'lost'} · pacts kept{' '}
                    {entry.pactsKept}, broken {entry.pactsBroken}
                  </p>
                  <p className="quiet">
                    {new Date(entry.recordedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })} · seed{' '}
                    {entry.seed}
                  </p>
                  <div className="button-row">
                    <button type="button" className="button" onClick={() => replay(entry)}>
                      Play this draw again
                    </button>
                    <button
                      type="button"
                      className="button button--quiet"
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(entry, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const anchor = document.createElement('a');
                        anchor.href = url;
                        anchor.download = `nimbagarh-${entry.endingId}-${entry.seed}.json`;
                        anchor.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Export
                    </button>
                    <button type="button" className="text-button text-button--danger" onClick={() => remove(entry.id)}>
                      Forget
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {entries.length > 0 ? (
          <aside className="archive-side">
            <Icon name="archive" />
            <h3>One archive, many courts</h3>
            <p>
              The archive stores only finished matches: the ending, the role map, the pacts, and the decisions. A saved
              session in progress is kept separately.
            </p>
            {confirmClear ? (
              <div className="archive-side__confirm">
                <p>Erase every ending in this archive?</p>
                <button type="button" className="button button--danger" onClick={clear}>
                  Erase the archive
                </button>
                <button type="button" className="button" onClick={() => setConfirmClear(false)}>
                  Keep it
                </button>
              </div>
            ) : (
              <button type="button" className="text-button text-button--danger" onClick={() => setConfirmClear(true)}>
                Erase the archive
              </button>
            )}
          </aside>
        ) : null}
      </div>
    </div>
  );
}

function SettingsScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="sheet">
      <header className="sheet__bar">
        <button type="button" className="text-button" onClick={onBack}>
          <Icon name="arrow" className="is-back" /> Back
        </button>
        <span className="sheet__step">Settings</span>
      </header>
      <div className="sheet__body settings-layout">
        <section>
          <p className="eyebrow">The instrument</p>
          <h2>How the palace meets you</h2>
          <p className="lede">These settings are saved on this device. None of them changes the rules of the match.</p>
          <SettingsFields />
        </section>

        <aside className="settings-note">
          <Icon name="eye" />
          <h3>You can stop the camera</h3>
          <p>
            Every cinematic has a Skip action and every camera move honours reduced motion. The game is fully playable
            with both turned on.
          </p>
          <p>Keyboard: Tab moves, Enter chooses, Escape closes. Focus is never trapped without a visible way out.</p>
        </aside>
      </div>
    </div>
  );
}

function CreditsScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="sheet">
      <header className="sheet__bar">
        <button type="button" className="text-button" onClick={onBack}>
          <Icon name="arrow" className="is-back" /> Back
        </button>
        <span className="sheet__step">Credits</span>
      </header>
      <div className="sheet__body credits-layout">
        <section>
          <p className="eyebrow">Built objects, borrowed light</p>
          <h2>{SCENE_CREDITS.title}</h2>
          <p className="lede">{SCENE_CREDITS.architecture}</p>

          <div className="credits-block">
            <h3>Architecture &amp; writing</h3>
            <p>Original code, geometry, cast, dialogue, rules, and interface for The Last Lantern.</p>
          </div>
          <div className="credits-block">
            <h3>Materials</h3>
            <p>{SCENE_CREDITS.materials}</p>
            <p>{SCENE_CREDITS.props}</p>
            <p>
              Ambient sound is generated in the browser with the Web Audio API. No recordings or music are shipped.
            </p>
          </div>
          <div className="credits-block">
            <h3>Study references</h3>
            <ul>
              {SCENE_CREDITS.references.map((reference) => (
                <li key={reference}>{reference}</li>
              ))}
            </ul>
          </div>
          <div className="credits-block">
            <h3>Type</h3>
            <p>Fraunces and Public Sans, served under the SIL Open Font License.</p>
          </div>
          <div className="credits-block credits-block--limit">
            <h3>The limitation</h3>
            <p>{SCENE_CREDITS.limitation}</p>
          </div>
          <div className="credits-block">
            <h3>Sources</h3>
            <p>
              <a href="https://polyhaven.com" target="_blank" rel="noreferrer">
                Poly Haven
              </a>{' '}
              for CC0 textures, HDRIs, and brass props. Wikimedia Commons for the photographic studies listed in the
              asset ledger. Neither organisation endorses this game.
            </p>
          </div>
        </section>
        <aside className="credits-seal">
          <Icon name="flame" />
          <p>THE LAST LANTERN</p>
          <small>Every oath has a shadow.</small>
        </aside>
      </div>
    </div>
  );
}
