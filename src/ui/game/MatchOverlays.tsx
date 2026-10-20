import { useEffect, useMemo, useRef, useState } from 'react';
import { CAST } from '@/game/cast';
import type { GameAction, Role } from '@/game/types';
import type { PlayerView } from '@/game/views';
import { Casebook, type CasebookTab } from './Casebook';
import { Icon } from './Icon';
import { SettingsFields } from './SettingsFields';

export type OverlayId = 'dossier' | 'casebook' | 'journal' | 'missions' | 'transcript' | 'settings' | 'help';

const TITLES: Record<OverlayId, { eyebrow: string; title: string }> = {
  dossier: { eyebrow: 'The table · public dossiers', title: 'Who is in the room' },
  casebook: { eyebrow: 'Your casebook · evidence and inference', title: 'What you can prove' },
  journal: { eyebrow: 'The journal · what happened', title: 'The record of the nights' },
  missions: { eyebrow: 'The work of the day', title: 'What the palace needs' },
  transcript: { eyebrow: 'The room · public speech and record', title: 'What was said' },
  settings: { eyebrow: 'The instrument', title: 'How the palace meets you' },
  help: { eyebrow: 'The rules of Nimbagarh', title: 'How to keep the flame' },
};

export function MatchOverlays({
  overlay,
  view,
  onClose,
  onAction,
  onRestart,
}: {
  overlay: OverlayId;
  view: PlayerView;
  onClose: () => void;
  onAction: (action: GameAction) => boolean;
  onRestart: () => void;
}) {
  const panel = useRef<HTMLElement>(null);
  const heading = useMemo(() => TITLES[overlay], [overlay]);
  const [confirmRestart, setConfirmRestart] = useState(false);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const node = panel.current;
    const first = node?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    window.requestAnimationFrame(() => first?.focus({ preventScroll: true }));

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !node) return;
      const focusable = [...node.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )].filter((entry) => entry.offsetParent !== null);
      if (focusable.length === 0) return;
      const firstEntry = focusable[0];
      const lastEntry = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === firstEntry) {
        event.preventDefault();
        lastEntry.focus();
      } else if (!event.shiftKey && document.activeElement === lastEntry) {
        event.preventDefault();
        firstEntry.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previous?.focus?.({ preventScroll: true });
    };
  }, [onClose]);

  return (
    <div className="overlay" role="presentation">
      <section
        ref={panel}
        className={`overlay__panel overlay__panel--${overlay}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="overlay-title"
      >
        <header className="overlay__head">
          <div>
            <p className="eyebrow">{heading.eyebrow}</p>
            <h2 id="overlay-title">{heading.title}</h2>
          </div>
          <button type="button" className="overlay__close" onClick={onClose} aria-label={`Close ${heading.title}`}>
            <Icon name="close" />
          </button>
        </header>

        <div className="overlay__body">
          {overlay === 'dossier' ? <Dossier view={view} /> : null}
          {overlay === 'casebook' ? <Casebook view={view} onAction={onAction} initialTab="evidence" /> : null}
          {overlay === 'journal' ? <Journal view={view} onAction={onAction} /> : null}
          {overlay === 'missions' ? <Missions view={view} onAction={onAction} /> : null}
          {overlay === 'transcript' ? <Transcript view={view} /> : null}
          {overlay === 'settings' ? (
            <>
              <p className="overlay__lede">
                Saved on this device. Motion, contrast and sound never change the rules of the match.
              </p>
              <SettingsFields compact />
              <div className="overlay__danger">
                <div>
                  <h3>Restart this draw</h3>
                  <p>A new seed, the same oath and difficulty. The unfinished session is replaced; finished endings stay in the archive.</p>
                </div>
                {confirmRestart ? (
                  <div className="button-row">
                    <button type="button" className="button button--danger" onClick={onRestart}>
                      Restart the match
                    </button>
                    <button type="button" className="button" onClick={() => setConfirmRestart(false)}>
                      Keep playing
                    </button>
                  </div>
                ) : (
                  <button type="button" className="text-button text-button--danger" onClick={() => setConfirmRestart(true)}>
                    Restart…
                  </button>
                )}
              </div>
            </>
          ) : null}
          {overlay === 'help' ? <Help view={view} /> : null}
        </div>
      </section>
    </div>
  );
}

function Dossier({ view }: { view: PlayerView }) {
  const others = view.contestants.filter((entry) => !entry.isPlayer);
  const [selected, setSelected] = useState(others[0]?.id ?? '');
  const person = view.contestants.find((entry) => entry.id === selected) ?? others[0];
  const member = person ? CAST.find((entry) => entry.name === person.name) : undefined;
  const record = person
    ? view.recentEvents
        .filter((event) => event.actorId === person.id || event.subjectId === person.id)
        .slice(-8)
        .reverse()
    : [];
  const said = person
    ? view.claims
        .filter((claim) => claim.speakerId === person.id || claim.aboutId === person.id)
        .slice(-6)
        .reverse()
    : [];
  const axes = person
    ? ([
        ['Warmth', person.personality.warmth],
        ['Candor', person.personality.candor],
        ['Nerve', person.personality.nerve],
        ['Guile', person.personality.guile],
        ['Composure', person.personality.composure],
        ['Curiosity', person.personality.curiosity],
      ] as const)
    : [];

  return (
    <div className="dossier">
      <nav className="dossier__rail" aria-label="Contestants">
        {others.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={entry.id === person?.id ? 'dossier__tab is-active' : 'dossier__tab'}
            aria-pressed={entry.id === person?.id}
            onClick={() => setSelected(entry.id)}
          >
            <span className="dossier__monogram" aria-hidden="true">
              {initials(entry.name)}
            </span>
            <span>
              <b>{entry.name}</b>
              <small>
                {entry.alive ? (entry.revealedRole ? roleLabel(entry.revealedRole) : 'At the table') : `Gone · night ${entry.eliminatedOn ?? '—'}`}
              </small>
            </span>
          </button>
        ))}
      </nav>

      {person ? (
        <article className="dossier__page" aria-live="polite">
          <div className="dossier__portrait" aria-hidden="true">
            <span>{initials(person.name)}</span>
            <i />
          </div>
          <div className="dossier__copy">
            <p className="eyebrow">
              {member?.city ?? 'Nimbagarh'} · {member?.age ?? '—'} · {person.alive ? 'living' : 'lost'}
            </p>
            <h3>{person.name}</h3>
            <p className="dossier__tendency">{person.socialTendency}</p>
            {person.revealedRole ? (
              <p className={`role-tag role-tag--${person.revealedRole}`}>{roleLabel(person.revealedRole)}</p>
            ) : (
              <p className="quiet">No role has been read for this person.</p>
            )}
            <dl className="cast-axes dossier__axes">
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
            <p className="dossier__tell">
              <b>Tell.</b> {person.tell}
            </p>
            {member ? <p className="dossier__voice">{member.voice}</p> : null}
          </div>

          <section className="dossier__record">
            <h4>On the record</h4>
            {said.length === 0 ? (
              <p className="quiet">Nothing this person has said has reached your journal.</p>
            ) : (
              <ul className="dossier__events">
                {said.map((claim) => (
                  <li key={claim.id}>
                    <span>Night {claim.night}</span>
                    <p>{claim.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="dossier__record">
            <h4>In the palace</h4>
            {record.length === 0 ? (
              <p className="quiet">No public movement has been recorded.</p>
            ) : (
              <ul className="dossier__events">
                {record.map((event) => (
                  <li key={event.id}>
                    <span>
                      Night {event.round} · {event.phase}
                    </span>
                    <p>{event.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </article>
      ) : (
        <p className="overlay__empty">There is no one else at the table.</p>
      )}
    </div>
  );
}

function Journal({ view, onAction }: { view: PlayerView; onAction: (action: GameAction) => boolean }) {
  const [tab, setTab] = useState<CasebookTab>('journal');
  return (
    <div className="journal-sheet">
      <div className="segmented segmented--wide journal-sheet__tabs">
        {(
          [
            ['journal', 'Journal'],
            ['evidence', 'Evidence'],
            ['board', 'Board'],
            ['ledger', 'Lantern ledger'],
            ['notes', 'Private intel'],
          ] as [CasebookTab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? 'segmented__item is-active' : 'segmented__item'}
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <Casebook key={tab} view={view} onAction={onAction} initialTab={tab} />
    </div>
  );
}

function Missions({ view, onAction }: { view: PlayerView; onAction: (action: GameAction) => boolean }) {
  const me = view.contestants.find((entry) => entry.isPlayer);
  return (
    <div className="mission-sheet">
      <p className="overlay__lede">
        Each day the palace posts work. The table can contribute twice per mission; sealing it resolves the work and
        moves the Lantern. A Shadowed contestant may also sabotage it.
      </p>
      {view.missions.length === 0 ? (
        <p className="overlay__empty">No work is posted in this phase. Return at dawn.</p>
      ) : (
        <div className="mission-sheet__grid">
          {view.missions.map((mission) => {
            const total = Object.values(mission.contributions).reduce((sum, value) => sum + value, 0);
            const mine = mission.contributions[me?.id ?? ''] ?? 0;
            const percent = Math.min(100, Math.round((total / Math.max(1, mission.threshold)) * 100));
            return (
              <article key={mission.id} className={`mission-sheet__card is-${mission.status}`}>
                <header>
                  <div>
                    <p className="eyebrow">{mission.family.replace('_', ' ')}</p>
                    <h3>{mission.title}</h3>
                  </div>
                  <span className="mission__count">
                    {total} / {mission.threshold}
                  </span>
                </header>
                <p className="mission-sheet__objective">{mission.objective}</p>
                {view.shadowObjectives[mission.id] ? (
                  <p className="mission__shadow">
                    <b>Shadow objective.</b> {view.shadowObjectives[mission.id]}
                  </p>
                ) : null}
                <div className="bar" aria-label={`${percent}% of the threshold`}>
                  <span className="bar__fill" style={{ transform: `scaleX(${percent / 100})` }} />
                </div>
                <ul className="mission__crew">
                  {Object.entries(mission.contributions)
                    .filter(([, amount]) => amount > 0)
                    .map(([id, amount]) => (
                      <li key={id}>
                        {nameOf(view, id)} <b>{amount}</b>
                      </li>
                    ))}
                </ul>
                <p className="mission-sheet__status">
                  {mission.status === 'resolved'
                    ? mission.success
                      ? mission.resolvedText ?? 'The work holds.'
                      : 'The work failed. The palace paid for it.'
                    : 'Open · the table is still working.'}
                </p>
                {mission.status === 'open' ? (
                  <div className="button-row">
                    <button
                      type="button"
                      className="button"
                      disabled={mine >= 2}
                      onClick={() => onAction({ type: 'CONTRIBUTE', missionId: mission.id })}
                    >
                      Contribute {mine >= 2 ? '(spent)' : `(${2 - mine} left)`}
                    </button>
                    <button
                      type="button"
                      className="button button--primary"
                      onClick={() => onAction({ type: 'RESOLVE_MISSION', missionId: mission.id })}
                    >
                      Seal the work
                    </button>
                    {view.ownRole === 'shadow' ? (
                      <button
                        type="button"
                        className="button button--danger"
                        onClick={() => onAction({ type: 'SABOTAGE', missionId: mission.id })}
                      >
                        Slip the mechanism
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Transcript({ view }: { view: PlayerView }) {
  const speeches = view.council?.speeches ?? [];
  return (
    <div className="transcript">
      <section>
        <h3>The council floor</h3>
        {speeches.length === 0 ? (
          <p className="quiet">No one has taken the floor yet.</p>
        ) : (
          <ol className="transcript__list">
            {speeches.map((speech, index) => (
              <li key={`${speech.speakerId}-${index}`}>
                <span className="transcript__who">{nameOf(view, speech.speakerId)}</span>
                <span className="transcript__kind">{speech.intent}</span>
                <p>{speech.text}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
      <section>
        <h3>Testimony and accusation</h3>
        {view.claims.length === 0 ? (
          <p className="quiet">Nothing has been said in your hearing.</p>
        ) : (
          <ol className="transcript__list">
            {[...view.claims].reverse().map((claim) => (
              <li key={claim.id}>
                <span className="transcript__who">{nameOf(view, claim.speakerId)}</span>
                <span className="transcript__kind">Night {claim.night}</span>
                <p>{claim.text}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
      <section>
        <h3>The palace record</h3>
        {view.recentEvents.length === 0 ? (
          <p className="quiet">The record is empty.</p>
        ) : (
          <ol className="transcript__list">
            {[...view.recentEvents].reverse().map((event) => (
              <li key={event.id}>
                <span className="transcript__who">{event.phase}</span>
                <span className="transcript__kind">Night {event.round}</span>
                <p>{event.text}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Help({ view }: { view: PlayerView }) {
  return (
    <div className="help-sheet">
      <section>
        <h3>The shape of a night</h3>
        <ol className="help-steps">
          <li>
            <b>Dawn.</b> The dead are named and their roles read. The Lantern pays for the night.
          </li>
          <li>
            <b>Day.</b> Search rooms, speak privately, offer pacts, and work the palace missions.
          </li>
          <li>
            <b>Dusk.</b> One last private word before the council.
          </li>
          <li>
            <b>Council.</b> Take the floor once, then lock a private vote. A tie opens the Lantern’s Riddle.
          </li>
          <li>
            <b>Night.</b> The Shadowed may draw the Veil; the Keeper may Read; the Warden may ward.
          </li>
        </ol>
      </section>
      <section>
        <h3>What you are</h3>
        <p className={`help-role is-${view.ownRole}`}>
          <b>{roleLabel(view.ownRole)}</b>
          {view.ownOathTitle ? ` · “${view.ownOathTitle}”` : ''}
        </p>
        <p>
          Your role card is private. Other contestants never see it unless a Keeper Reads you, and the game never lets
          them act on information they have not been given.
        </p>
      </section>
      <section>
        <h3>The table</h3>
        <p>
          Twelve began. Three are Shadowed. The Oathkeepers win by naming them at the final count; the Shadowed win by
          extinguishing the Lantern or surviving the last vote. Evidence is found by searching rooms, not by guessing.
        </p>
        <p className="quiet">
          Keyboard: Tab moves, Enter chooses, Escape closes any sheet or cinematic. Motion and sound can be reduced in
          Settings at any time.
        </p>
      </section>
      <section>
        <h3>Your current state</h3>
        <dl className="help-state">
          <div>
            <dt>Night</dt>
            <dd>{view.round}</dd>
          </div>
          <div>
            <dt>Lantern</dt>
            <dd>{view.lantern}</dd>
          </div>
          <div>
            <dt>Living</dt>
            <dd>{view.contestants.filter((entry) => entry.alive).length}</dd>
          </div>
          <div>
            <dt>Your shields</dt>
            <dd>{view.contestants.find((entry) => entry.isPlayer)?.shields ?? 0}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

function nameOf(view: PlayerView, id: string): string {
  return view.contestants.find((entry) => entry.id === id)?.name ?? id;
}

function roleLabel(role: Role): string {
  switch (role) {
    case 'shadow':
      return 'Shadowed';
    case 'keeper':
      return 'Lantern Keeper';
    case 'warden':
      return 'Warden';
    default:
      return 'Oathkeeper';
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
