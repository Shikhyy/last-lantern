import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useEffect, useRef, useState } from 'react';
import { audio } from '@/audio/audio';
import type { PactTerm, Role } from '@/game/types';
import type { PlayerView } from '@/game/views';
import { useArchiveStore } from '@/state/archiveStore';
import { useGameStore } from '@/state/gameStore';
import { useSceneStore } from '@/state/sceneStore';
import { useSettingsStore } from '@/state/settingsStore';
import { Icon } from './Icon';

gsap.registerPlugin(useGSAP);

const ROLE_LABEL: Record<Role, string> = {
  shadow: 'Shadowed',
  keeper: 'Lantern Keeper',
  warden: 'Warden',
  oathkeeper: 'Oathkeeper',
};

const PACT_LABEL: Record<PactTerm, string> = {
  voteWithMe: 'Vote with me',
  shareInfo: 'Share what you learn',
  protect: 'Speak for me',
  keepSecret: 'Keep what I tell you',
  silence: 'Say nothing about me',
};

export function EndingScreen({ view }: { view: PlayerView }) {
  const ending = view.ending;
  const match = useGameStore((state) => state.match);
  const lastOptions = useGameStore((state) => state.lastOptions);
  const restart = useGameStore((state) => state.restart);
  const abandon = useGameStore((state) => state.abandon);
  const record = useArchiveStore((state) => state.record);
  const reducedMotion = useSettingsStore((state) => state.settings.reducedMotion);
  const [unmasked, setUnmasked] = useState(false);
  const [confirm, setConfirm] = useState<'restart' | 'title' | null>(null);
  const root = useRef<HTMLDivElement>(null);

  const me = view.contestants.find((entry) => entry.isPlayer);

  useEffect(() => {
    if (match) record(match, lastOptions);
  }, [lastOptions, match, record]);

  useEffect(() => {
    useSceneStore.getState().setRoom('aangan');
    useSceneStore.getState().setTimeOfDay(ending?.faction === 'shadow' ? 'night' : 'day');
    audio.sfx('reveal');
    audio.setNight(ending?.faction === 'shadow');
  }, [ending?.faction]);

  useGSAP(
    () => {
      if (reducedMotion) return;
      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
      timeline
        .from('.ending__head > *', { y: 18, autoAlpha: 0, duration: 0.8, stagger: 0.1 })
        .from('.ending__verdict > *', { y: 22, autoAlpha: 0, duration: 0.9, stagger: 0.1 }, '-=0.3')
        .from('.ending__foot', { autoAlpha: 0, duration: 0.7 }, '-=0.2');
      return () => timeline.kill();
    },
    { scope: root, dependencies: [] },
  );

  useGSAP(
    () => {
      if (!unmasked || reducedMotion) return;
      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
      timeline
        .from('.ending__stat', { y: 14, autoAlpha: 0, duration: 0.55, stagger: 0.06 })
        .from('.ending__role', { y: 14, autoAlpha: 0, duration: 0.45, stagger: 0.035 }, '-=0.2')
        .from('.ending__record > *', { y: 16, autoAlpha: 0, duration: 0.6, stagger: 0.08 }, '-=0.2');
      return () => timeline.kill();
    },
    { scope: root, dependencies: [unmasked] },
  );

  if (!ending) return null;

  const unmask = () => {
    audio.sfx('seal');
    setUnmasked(true);
  };

  const exportRecord = () => {
    const record = {
      ending: ending.title,
      faction: ending.faction,
      seed: match?.seed ?? null,
      night: view.round,
      lantern: view.lantern,
      player: me?.name ?? 'The Stranger',
      roles: ending.unmasking.roles,
      pacts: ending.unmasking.pacts,
      decisions: ending.unmasking.decisions,
      lies: ending.unmasking.lies,
    };
    const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `nimbagarh-${ending.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div ref={root} className={`ending-screen is-${ending.faction}`}>
      <div className="ending__scrim" aria-hidden="true" />
      <header className="ending__head">
        <div className="ending__mark">
          <Icon name="flame" />
          <span>Nimbagarh · the last page</span>
        </div>
        <span className="ending__archive-note">This ending has been written to the archive.</span>
      </header>

      <main className="ending__scroll">
        <section className="ending__verdict">
          <p className="eyebrow">{ending.faction === 'oathkeeper' ? 'The flame holds' : 'The flame is taken'}</p>
          <h1>{ending.title}</h1>
          <p className="ending__epilogue">{ending.epilogue}</p>
          <p className={`ending__player-role is-${view.ownRole}`}>
            You were <b>{ROLE_LABEL[view.ownRole]}</b>
            {view.ownOath ? ` · the oath “${oathLabel(view.ownOath)}”` : ''}
          </p>
        </section>

        {!unmasked ? (
          <section className="ending__unmask-prompt">
            <div className="ending__seal" aria-hidden="true">
              <Icon name="seal" />
            </div>
            <div>
              <p className="eyebrow">The court is still masked</p>
              <h2>Read what the palace kept.</h2>
              <p>
                Every role, every broken promise, every decision that moved the Lantern. Once you open this page, the
                court has no more secrets from you.
              </p>
            </div>
            <button type="button" className="button button--primary button--large" onClick={unmask}>
              Unmask the court <Icon name="arrow" />
            </button>
          </section>
        ) : (
          <div className="ending__unmasked" aria-live="polite">
            <section className="ending__stats" aria-label="Ending summary">
              <div className="ending__stat">
                <span>You</span>
                <b>{ending.playerSurvived ? 'survived' : 'lost'}</b>
              </div>
              <div className="ending__stat">
                <span>Lantern</span>
                <b>{view.lantern}</b>
              </div>
              <div className="ending__stat">
                <span>Pacts kept</span>
                <b>{ending.pactsKept}</b>
              </div>
              <div className="ending__stat">
                <span>Pacts broken</span>
                <b>{ending.pactsBroken}</b>
              </div>
              <div className="ending__stat">
                <span>Nights</span>
                <b>{view.round}</b>
              </div>
            </section>

            <section className="ending__roles">
              <div className="ending__section-head">
                <p className="eyebrow">The unmasking</p>
                <h2>The whole table, read aloud.</h2>
              </div>
              <ul className="ending__role-grid">
                {ending.unmasking.roles.map((entry) => (
                  <li key={entry.contestantId} className={`ending__role is-${entry.role}${entry.alive ? '' : ' is-dead'}`}>
                    <span className="ending__monogram" aria-hidden="true">
                      {initials(entry.name)}
                    </span>
                    <span className="ending__role-copy">
                      <b>{entry.name}</b>
                      <em>{ROLE_LABEL[entry.role]}</em>
                    </span>
                    <span className="ending__role-state">{entry.alive ? 'survived' : 'lost'}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="ending__record">
              <div className="ending__record-col">
                <h3>What was not true</h3>
                {ending.unmasking.lies.length === 0 ? (
                  <p className="quiet">No recorded lie survived to the last page.</p>
                ) : (
                  <ul className="ending__lies">
                    {ending.unmasking.lies.map((lie, index) => (
                      <li key={`${lie.speakerId}-${index}`}>
                        <b>{nameOf(view, lie.speakerId)}</b>
                        <p>{lie.text}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="ending__record-col">
                <h3>Promises at the table</h3>
                {ending.unmasking.pacts.length === 0 ? (
                  <p className="quiet">No promise was recorded.</p>
                ) : (
                  <ul className="ending__pacts">
                    {ending.unmasking.pacts.map((pact, index) => (
                      <li key={`${pact.a}-${pact.b}-${index}`} className={`is-${pact.status}`}>
                        <span>{nameOf(view, pact.a)}</span>
                        <b>{PACT_LABEL[pact.term]}</b>
                        <span>{nameOf(view, pact.b)}</span>
                        <em>{pact.status}</em>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section className="ending__decisions">
              <p className="eyebrow">The decisions that mattered</p>
              <ol>
                {ending.unmasking.decisions.map((decision, index) => (
                  <li key={`${decision}-${index}`}>{decision}</li>
                ))}
              </ol>
            </section>
          </div>
        )}
      </main>

      <footer className="ending__foot">
        <div className="ending__foot-note">
          <span>
            {me?.alive ? 'You are still in the room.' : 'The room goes on without you.'} The archive keeps the page.
          </span>
          <button type="button" className="text-button" onClick={exportRecord}>
            Export this record
          </button>
        </div>
        <div className="ending__actions">
          {confirm === 'restart' ? (
            <>
              <span className="ending__confirm">Begin a new draw with the same oath?</span>
              <button type="button" className="button button--danger" onClick={restart}>
                Restart
              </button>
              <button type="button" className="button" onClick={() => setConfirm(null)}>
                Keep reading
              </button>
            </>
          ) : confirm === 'title' ? (
            <>
              <span className="ending__confirm">Leave the page and return to the gate?</span>
              <button type="button" className="button button--danger" onClick={abandon}>
                Return to the gate
              </button>
              <button type="button" className="button" onClick={() => setConfirm(null)}>
                Stay
              </button>
            </>
          ) : (
            <>
              <button type="button" className="button button--primary" onClick={() => setConfirm('restart')}>
                Play again
              </button>
              <button type="button" className="button" onClick={() => setConfirm('title')}>
                Return to the title
              </button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}

function nameOf(view: PlayerView, id: string): string {
  return view.contestants.find((entry) => entry.id === id)?.name ?? id;
}

function oathLabel(oath: string): string {
  switch (oath) {
    case 'keep_promise':
      return 'I keep what I promise';
    case 'ask_before_accuse':
      return 'I ask before I accuse';
    case 'watch_room':
      return 'I watch the room';
    case 'speak_last':
      return 'I speak last';
    case 'owe_no_one':
      return 'I owe no one';
    case 'remember_everything':
      return 'I remember everything';
    default:
      return oath;
  }
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part.replace(/[^A-Za-z]/g, '')[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
