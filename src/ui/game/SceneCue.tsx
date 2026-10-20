import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useEffect, useRef } from 'react';
import type { RoomId } from '@/game/types';
import { audio } from '@/audio/audio';
import { useCinematicStore } from '@/state/cinematicStore';
import { useSceneStore } from '@/state/sceneStore';
import { useSettingsStore } from '@/state/settingsStore';
import type { CinematicCue } from './cinematics';
import { Icon } from './Icon';

gsap.registerPlugin(useGSAP);

interface Props {
  cue: CinematicCue;
  restoreRoom: RoomId;
  restoreTime: 'day' | 'night';
  onDone: () => void;
}

export function SceneCue({ cue, restoreRoom, restoreTime, onDone }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const closed = useRef(false);
  const begin = useCinematicStore((state) => state.begin);
  const setIndex = useCinematicStore((state) => state.setIndex);
  const end = useCinematicStore((state) => state.end);
  const settingReducedMotion = useSettingsStore((state) => state.settings.reducedMotion);
  const reduce =
    settingReducedMotion ||
    (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const close = (sound = true) => {
    if (closed.current) return;
    closed.current = true;
    if (sound) audio.sfx('click');
    end();
    useSceneStore.getState().setRoom(restoreRoom);
    useSceneStore.getState().setTimeOfDay(restoreTime);
    onDone();
  };

  useEffect(() => {
    useSceneStore.getState().setRoom(cue.room);
    useSceneStore.getState().setTimeOfDay(cue.time);
    begin(cue.shots);
    if (cue.tone === 'judgment') audio.sfx('bell');
    else if (cue.tone === 'council' || cue.tone === 'finale') audio.sfx('seal');
    else if (cue.tone === 'evidence') audio.sfx('reveal');
    const timer = window.setTimeout(() => setIndex(1), reduce ? 0 : 2400);
    return () => {
      window.clearTimeout(timer);
      end();
    };
  }, [begin, cue, end, reduce, setIndex]);

  useGSAP(
    () => {
      if (reduce) return;
      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
      timeline
        .from('.cue__bar', { autoAlpha: 0, y: -12, duration: 0.6 })
        .from('.cue__panel', { autoAlpha: 0, x: -28, duration: 0.9 }, '-=0.35')
        .from('.cue__panel > *', { autoAlpha: 0, y: 16, duration: 0.7, stagger: 0.08 }, '-=0.5')
        .from('.cue__facts > *', { autoAlpha: 0, y: 12, duration: 0.55, stagger: 0.06 }, '-=0.25')
        .from('.cue__foot', { autoAlpha: 0, y: 10, duration: 0.6 }, '-=0.3');
      return () => timeline.kill();
    },
    { scope: root },
  );

  useEffect(() => {
    const primary = root.current?.querySelector<HTMLButtonElement>('.cue__continue');
    primary?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
      if (event.key === 'Enter' && event.target === document.body) {
        event.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className={`cue is-${cue.tone}`} ref={root} role="dialog" aria-modal="true" aria-labelledby="cue-title">
      <div className="cue__scrim" aria-hidden="true" />
      <header className="cue__bar">
        <span className="eyebrow">{cue.kicker}</span>
        <button type="button" className="text-button" onClick={() => close()}>
          Skip <Icon name="close" />
        </button>
      </header>
      <section className="cue__panel">
        <p className="eyebrow">A scene from the palace</p>
        <h2 id="cue-title">{cue.title}</h2>
        <div className="cue__lines">
          {cue.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        {cue.facts && cue.facts.length > 0 ? (
          <dl className="cue__facts">
            {cue.facts.map((fact) => (
              <div key={`${fact.label}-${fact.value}`}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <div className="cue__foot">
          <button type="button" className="button button--primary cue__continue" onClick={() => close()}>
            {cue.continueLabel} <Icon name="arrow" />
          </button>
          <span className="quiet">The camera returns when you do.</span>
        </div>
      </section>
      <div className="cue__corner cue__corner--tl" aria-hidden="true" />
      <div className="cue__corner cue__corner--br" aria-hidden="true" />
    </div>
  );
}
