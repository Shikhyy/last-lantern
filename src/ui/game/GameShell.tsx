import { useEffect, useMemo, useState } from 'react';
import { OATHS } from '@/game/cast';
import { playerView, type PlayerView } from '@/game/views';
import type { Difficulty, PlayerOath, Role } from '@/game/types';
import { useGameStore } from '@/state/gameStore';
import { useSceneStore } from '@/state/sceneStore';
import { Casebook } from './Casebook';
import { PhasePanel } from './PhasePanels';

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

const PRONOUNS = ['they/them', 'she/her', 'he/him'];

export function GameShell() {
  const status = useGameStore((state) => state.status);
  return (
    <div className="game">
      {status === 'title' ? <TitleScreen /> : <MatchScreen />}
      <Toast />
    </div>
  );
}

function TitleScreen() {
  const start = useGameStore((state) => state.start);
  const resume = useGameStore((state) => state.resume);
  const hasSave = useGameStore((state) => state.hasSave);
  const saveStatus = useGameStore((state) => state.saveStatus);
  const saveReason = useGameStore((state) => state.saveReason);
  const [name, setName] = useState('The Stranger');
  const [pronouns, setPronouns] = useState(PRONOUNS[0]);
  const [oath, setOath] = useState<PlayerOath>('keep_promise');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [seed, setSeed] = useState(() => randomSeed().toString());

  const chosenOath = OATHS.find((entry) => entry.id === oath) ?? OATHS[0];

  return (
    <div className="title-screen">
      <div className="title-screen__inner">
        <header className="title-screen__head">
          <p className="eyebrow">Nimbagarh · a palace at the edge of the Aravalli</p>
          <h1>The Last Lantern</h1>
          <p className="title-screen__lede">
            Twelve are sealed inside. Three are Shadowed. The flame is the only clock, and every night it burns
            lower. Keep your oath, read the room, and name what you find before the dark does.
          </p>
        </header>

        <div className="title-screen__grid">
          <section className="title-screen__premise">
            <h2>How the night is kept</h2>
            <ol>
              <li>
                <b>By day</b> search the Aangan, the Long Gallery, the Archive and the Council Chamber. Evidence is
                physical and specific, never a label.
              </li>
              <li>
                <b>By dusk</b> make one last promise. At the council, take the floor, then lock a private vote. Votes
                are counted together; a tie opens the Lantern’s Riddle.
              </li>
              <li>
                <b>By night</b> the Keeper Reads, the Warden wards, the Shadowed draw the Veil. At dawn the dead are
                named and their roles are read.
              </li>
              <li>
                <b>At four</b> the finale begins: a reckoning, one question, one name. The last unmasking shows every
                role and every broken pact.
              </li>
            </ol>
            <p className="title-screen__note">
              A complete match runs five days and nights. No account, no network, no model — every line is authored and
              every decision is local.
            </p>
          </section>

          <section className="title-screen__form" aria-label="Begin a match">
            <h2>Take a seat</h2>
            <label className="field">
              <span>Name at the table</span>
              <input value={name} maxLength={28} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className="field">
              <span>Pronouns</span>
              <select value={pronouns} onChange={(event) => setPronouns(event.target.value)}>
                {PRONOUNS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Your oath</span>
              <select value={oath} onChange={(event) => setOath(event.target.value as PlayerOath)}>
                {OATHS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.title}
                  </option>
                ))}
              </select>
              <small>{chosenOath.description}</small>
            </label>

            <fieldset className="field field--choice">
              <legend>Table difficulty</legend>
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
            </fieldset>

            <details className="seed-field">
              <summary>Seed</summary>
              <label className="field">
                <span>Reproducible draw</span>
                <input
                  value={seed}
                  inputMode="numeric"
                  onChange={(event) => setSeed(event.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                />
              </label>
            </details>

            <div className="title-screen__actions">
              <button
                type="button"
                className="button button--primary"
                onClick={() =>
                  start({
                    seed: Number(seed) || randomSeed(),
                    playerName: name.trim() || 'The Stranger',
                    pronouns,
                    oath,
                    difficulty,
                  })
                }
              >
                Enter Nimbagarh
              </button>
              {hasSave ? (
                <button type="button" className="button" onClick={resume}>
                  Continue the night
                </button>
              ) : null}
            </div>
            {saveStatus === 'corrupt' ? (
              <p className="title-screen__damage">
                A saved session could not be restored: {saveReason ?? 'the file is damaged'}. It has been left where it
                is; beginning a new match will replace it.
              </p>
            ) : null}
          </section>
        </div>

        <footer className="title-screen__foot">
          <p>
            12 contestants · 3 Shadowed · 1 Keeper · 1 Warden · 7 Oathkeepers · six authored endings
          </p>
          <p className="title-screen__limitation">
            Fictional palace. Materials are CC0; photographic references are study only. This is an interpretation of
            Rajasthani palace architecture, not a survey of Suryagarh.
          </p>
        </footer>
      </div>
    </div>
  );
}

function MatchScreen() {
  const match = useGameStore((state) => state.match);
  const notice = useGameStore((state) => state.notice);
  const act = useGameStore((state) => state.act);
  const goToRoom = useGameStore((state) => state.goToRoom);
  const restart = useGameStore((state) => state.restart);
  const [confirmRestart, setConfirmRestart] = useState(false);

  const view = useMemo(() => (match ? playerView(match) : null), [match]);
  if (!view || !match) return null;

  const setMode = useSceneStore.getState();
  const room = match.currentRoom;

  return (
    <div className="match">
      <header className="match__bar">
        <div className="match__brand">
          <span className="match__title">The Last Lantern</span>
          <span className="match__place">Nimbagarh</span>
        </div>

        <div className="match__phase">
          <span className="match__phase-kicker">Night {view.round}</span>
          <span className="match__phase-name">{PHASE_LABEL[view.phase] ?? view.phase}</span>
        </div>

        <LanternMeter value={view.lantern} />

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

      <main className="match__grid">
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

      <footer className="match__foot">
        <span className="match__message" aria-live="polite">
          {notice ?? view.lastMessage}
        </span>
        <span className="match__room">In the {roomLabel(room)}</span>
      </footer>
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

function randomSeed(): number {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return buffer[0] || 1;
  }
  return Math.floor(Date.now() % 2147483647) || 1;
}
