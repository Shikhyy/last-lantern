import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CAST } from '@/game/cast';
import type { PlayerView } from '@/game/views';
import type { Role } from '@/game/types';
import { audio } from '@/audio/audio';
import { useCinematicStore, type CameraShot } from '@/state/cinematicStore';
import { useGameStore } from '@/state/gameStore';
import { useSceneStore } from '@/state/sceneStore';
import { useSettingsStore } from '@/state/settingsStore';
import { Icon } from './Icon';

gsap.registerPlugin(useGSAP);

const SHOTS: CameraShot[] = [
  { position: [0, 27, 66], target: [0, 9, 0], fov: 39, duration: 0 },
  { position: [-38, 19, 86], target: [0, 8.5, 2], fov: 36, duration: 0 },
  { position: [0, 7.4, 35], target: [0, 5.6, 13.5], fov: 40, duration: 5.5, ease: 'power2.inOut' },
  { position: [-8.8, 4.6, 8.4], target: [0, 1.9, -0.8], fov: 44, duration: 5.5, ease: 'power2.inOut' },
  { position: [1.2, 1.95, -12.6], target: [0.05, 2.15, -46], fov: 44, duration: 7, ease: 'sine.inOut' },
  { position: [-2.5, 2.05, 5.1], target: [0, 1.75, 0], fov: 40, duration: 4, ease: 'power2.inOut' },
  { position: [-8.6, 4.4, 7], target: [0, 1.6, -0.4], fov: 46, duration: 4, ease: 'power2.inOut' },
];

const ROLE_COPY: Record<Role, { kicker: string; title: string; text: string; charge: string }> = {
  shadow: {
    kicker: 'The sealed card · Shadowed',
    title: 'You are Shadowed.',
    text: 'You are one of the three who want the flame to die. You may veil one person on Nights 1, 3, and 5, and you may slip a mechanism during the day. You are not a villain in the fiction; you are a person with a reason the oath could not hold.',
    charge: 'Your allies know you. The Keeper may Read you. Keep the channel private.',
  },
  keeper: {
    kicker: 'The sealed card · Lantern Keeper',
    title: 'You are the Keeper.',
    text: 'Once each night you may Read one living contestant and learn their faction exactly. A Read is private; no one is told it happened. You keep the flame’s oldest record, and the Shadowed know what that means.',
    charge: 'Your Read is exact: Shadowed or Oathkeeper. It is not a guess and it cannot be shared safely.',
  },
  warden: {
    kicker: 'The sealed card · Warden',
    title: 'You are the Warden.',
    text: 'Once each night you may ward one living contestant. The Veil cannot take them that night. You may not ward the same person on consecutive nights. The ward is spent whether or not the Veil comes.',
    charge: 'A ward protects against the Veil, not against the council. You cannot ward yourself.',
  },
  oathkeeper: {
    kicker: 'The sealed card · Oathkeeper',
    title: 'You are an Oathkeeper.',
    text: 'You have no night action. Your work is the day: search, speak, remember, and vote. Seven of the twelve began as Oathkeepers. The flame needs at least one of you to still be in the room at the end.',
    charge: 'No secret power. No private channel. Only what you can prove and who believes you.',
  },
};

const STAGE_DURATION = [3200, 5600, 5200, 5400];

export function OpeningSequence({ view }: { view: PlayerView }) {
  const [stage, setStage] = useState(0);
  const [selected, setSelected] = useState(0);
  const [sealBroken, setSealBroken] = useState(false);
  const [paused, setPaused] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const finished = useRef(false);
  const finishIntro = useGameStore((state) => state.finishIntro);
  const begin = useCinematicStore((state) => state.begin);
  const setIndex = useCinematicStore((state) => state.setIndex);
  const end = useCinematicStore((state) => state.end);
  const settingReducedMotion = useSettingsStore((state) => state.settings.reducedMotion);
  const reduce =
    settingReducedMotion ||
    (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const roster = useMemo(
    () => view.contestants.filter((entry) => !entry.isPlayer),
    [view.contestants],
  );

  useEffect(() => {
    begin(SHOTS);
    useSceneStore.getState().enableRoom('gallery');
    useSceneStore.getState().enableRoom('archive');
    useSceneStore.getState().enableRoom('council');
    return () => end();
  }, [begin, end]);

  useEffect(() => {
    setIndex(Math.min(stage, SHOTS.length - 1));
    if (stage === 0) {
      useSceneStore.getState().setTimeOfDay('night');
      useSceneStore.getState().setRoom('aangan');
    } else if (stage <= 2) {
      useSceneStore.getState().setTimeOfDay('day');
      useSceneStore.getState().setRoom('aangan');
    } else if (stage === 3) {
      useSceneStore.getState().setTimeOfDay('night');
      useSceneStore.getState().setRoom('aangan');
    } else if (stage === 4) {
      useSceneStore.getState().setTimeOfDay('day');
      useSceneStore.getState().setRoom('gallery');
    } else if (stage === 5) {
      useSceneStore.getState().setTimeOfDay('night');
      useSceneStore.getState().setRoom('aangan');
    } else {
      useSceneStore.getState().setTimeOfDay('day');
      useSceneStore.getState().setRoom('aangan');
    }
  }, [stage, setIndex]);

  useEffect(() => {
    if (stage > 3 || paused || reduce) return undefined;
    const timer = window.setTimeout(() => setStage((current) => current + 1), STAGE_DURATION[stage]);
    return () => window.clearTimeout(timer);
  }, [paused, reduce, stage]);

  useGSAP(
    () => {
      if (reduce) return;
      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
      timeline
        .from('.opening__copy > *', { y: 18, autoAlpha: 0, duration: 0.9, stagger: 0.11 })
        .from('.opening__foot', { autoAlpha: 0, duration: 0.8 }, '-=0.35');
      return () => timeline.kill();
    },
    { scope: root, dependencies: [stage] },
  );

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    audio.sfx('seal');
    end();
    useCinematicStore.getState().end();
    useSceneStore.getState().setTimeOfDay('day');
    useSceneStore.getState().setRoom('aangan');
    finishIntro();
  };

  const skip = () => {
    audio.sfx('click');
    finish();
  };

  const next = () => {
    audio.sfx('click');
    setStage((current) => Math.min(6, current + 1));
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        skip();
      }
      if (event.key === 'Enter' && !event.shiftKey && stage !== 4 && stage !== 5) {
        event.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="opening" ref={root}>
      <div className={`opening__shade ${stage === 0 ? 'is-black' : ''}`} aria-hidden="true" />
      <header className="opening__bar">
        <span className="opening__mark">
          <Icon name="flame" /> Nimbagarh
        </span>
        <div className="opening__bar-actions">
          {stage <= 3 ? (
            <button type="button" className="text-button" onClick={() => setPaused((value) => !value)}>
              {paused ? 'Play' : 'Pause'}
            </button>
          ) : null}
          <button type="button" className="text-button" onClick={skip}>
            Skip the arrival
          </button>
        </div>
      </header>

      {stage === 0 ? (
        <div className="opening__center opening__copy">
          <p className="eyebrow">A bell, once, across the Thar</p>
          <h1>
            The Last
            <br />
            Lantern
          </h1>
          <p className="opening__whisper">Every oath has a shadow.</p>
        </div>
      ) : null}

      {stage === 1 ? (
        <div className="opening__lower opening__copy">
          <p className="eyebrow">The edge of the desert</p>
          <h2>The heat stays in the stone long after the sun has gone.</h2>
          <p>
            At the end of a road that is not on every map, Nimbagarh keeps one light burning. Tonight, twelve people
            have been asked to keep it.
          </p>
        </div>
      ) : null}

      {stage === 2 ? (
        <div className="opening__lower opening__copy">
          <p className="eyebrow">The gate</p>
          <h2>No one remembers opening it.</h2>
          <p>
            The brass is warm. The studs are worn smooth by hands that came before. Above the door, an emblem that is
            not heraldry: a flame, held in a bowl.
          </p>
        </div>
      ) : null}

      {stage === 3 ? (
        <div className="opening__lower opening__copy">
          <p className="eyebrow">The Aangan</p>
          <h2>The Last Lantern is already lit.</h2>
          <p>
            Twelve seats face the fountain. Eleven are occupied. The twelfth waits for the name you gave at the gate.
          </p>
        </div>
      ) : null}

      {stage === 4 ? (
        <div className="opening__cast">
          <div className="opening__cast-head opening__copy">
            <p className="eyebrow">The Long Gallery · eleven niches</p>
            <h2>The people who will decide what you are.</h2>
            <p>Read a face. Nothing here tells you what they are. That is the point.</p>
          </div>
          <div className="cast-rail" role="list" aria-label="Contestants">
            {roster.map((contestant, index) => {
              const member = CAST.find((entry) => entry.name === contestant.name);
              return (
                <button
                  key={contestant.id}
                  type="button"
                  role="listitem"
                  className={index === selected ? 'niche is-selected' : 'niche'}
                  onClick={() => {
                    audio.sfx('click');
                    setSelected(index);
                  }}
                >
                  <span className="niche__arch" aria-hidden="true" />
                  <span className="niche__monogram">{initials(contestant.name)}</span>
                  <span className="niche__name">{contestant.name}</span>
                  <span className="niche__city">{member?.city ?? 'Nimbagarh'}</span>
                </button>
              );
            })}
            <div className="niche niche--you" role="listitem">
              <span className="niche__arch" aria-hidden="true" />
              <span className="niche__monogram">{initials(view.contestants.find((entry) => entry.isPlayer)?.name ?? 'You')}</span>
              <span className="niche__name">{view.contestants.find((entry) => entry.isPlayer)?.name ?? 'You'}</span>
              <span className="niche__city">the twelfth niche</span>
            </div>
          </div>
          <CastDossier contestant={roster[selected]} />
          <div className="opening__cast-foot">
            <p>All eleven will remember what you say. None of them knows your card.</p>
            <button type="button" className="button button--primary" onClick={next}>
              Go to the oath <Icon name="arrow" />
            </button>
          </div>
        </div>
      ) : null}

      {stage === 5 ? (
        <div className="oath-reveal">
          <div className={sealBroken ? 'seal-card is-open' : 'seal-card'}>
            <div className="seal-card__face">
              <span className="seal-card__wax" aria-hidden="true">
                <Icon name="seal" />
              </span>
              <p className="eyebrow">The Dewan’s hand</p>
              <h2>Your oath is sealed.</h2>
              <p>
                No one else may read it. Break the wax when you are ready to know what the palace has made of you.
              </p>
              <button
                type="button"
                className="button button--primary button--large"
                onClick={() => {
                  audio.sfx('seal');
                  setSealBroken(true);
                  gsap.fromTo(
                    '.seal-card__role > *',
                    { y: 18, autoAlpha: 0 },
                    { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.09, ease: 'power3.out' },
                  );
                }}
              >
                Break the seal
              </button>
            </div>
            {sealBroken ? <RoleCard view={view} /> : null}
          </div>
          {sealBroken ? (
            <button type="button" className="button button--primary button--large oath-reveal__go" onClick={finish}>
              Take your seat <Icon name="arrow" />
            </button>
          ) : null}
        </div>
      ) : null}

      {stage === 6 ? (
        <div className="opening__lower opening__copy">
          <p className="eyebrow">Dawn · the first day</p>
          <h2>The palace is open.</h2>
          <p>
            Search the Aangan, the Long Gallery, the Archive, and the Council Chamber. The first count is at dusk.
          </p>
          <button type="button" className="button button--primary button--large" onClick={finish}>
            Take the first day <Icon name="arrow" />
          </button>
        </div>
      ) : null}

      <footer className="opening__foot">
        <span className="opening__progress" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((step) => (
            <i key={step} className={step <= stage ? 'is-on' : ''} />
          ))}
        </span>
        <span>
          {stage <= 3 ? 'An authored arrival · skip at any time' : stage === 4 ? 'The gallery' : 'The sealed oath'}
        </span>
      </footer>
    </div>
  );
}

function CastDossier({ contestant }: { contestant: (PlayerView['contestants'][number] | undefined) }) {
  if (!contestant) return null;
  const member = CAST.find((entry) => entry.name === contestant.name);
  const axes = [
    ['Warmth', contestant.personality.warmth],
    ['Candor', contestant.personality.candor],
    ['Nerve', contestant.personality.nerve],
    ['Guile', contestant.personality.guile],
    ['Composure', contestant.personality.composure],
    ['Curiosity', contestant.personality.curiosity],
  ] as const;
  return (
    <aside className="cast-dossier" aria-live="polite">
      <p className="eyebrow">
        {member?.city ?? 'Nimbagarh'} · {member?.age ?? '—'}
      </p>
      <h3>{contestant.name}</h3>
      <p className="cast-dossier__tendency">{contestant.socialTendency}</p>
      <dl className="cast-axes">
        {axes.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              <span style={{ width: `${value}%` }} />
            </dd>
            <b>{value}</b>
          </div>
        ))}
      </dl>
      <p className="cast-dossier__tell">
        <b>Tell.</b> {contestant.tell}
      </p>
      {member ? <p className="cast-dossier__voice">{member.voice}</p> : null}
    </aside>
  );
}

function RoleCard({ view }: { view: PlayerView }) {
  const copy = ROLE_COPY[view.ownRole];
  const allies = view.shadowAllies
    .map((id) => view.contestants.find((entry) => entry.id === id)?.name)
    .filter(Boolean);
  const me = view.contestants.find((entry) => entry.isPlayer);
  return (
    <div className={`seal-card__role is-${view.ownRole}`}>
      <p className="eyebrow">{copy.kicker}</p>
      <h2>{copy.title}</h2>
      <p className="seal-card__name">{me?.name ?? 'The Stranger'}</p>
      <p>{copy.text}</p>
      {view.ownRole === 'shadow' ? (
        <div className="seal-card__allies">
          <span>The Shadowed</span>
          <b>{allies.join(' · ') || 'No ally remains.'}</b>
        </div>
      ) : null}
      <p className="seal-card__charge">
        <Icon name="flame" /> {copy.charge}
      </p>
    </div>
  );
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
