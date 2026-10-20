import { useState } from 'react';
import { SABOTAGES } from '@/game/content';
import type {
  ConversationIntent,
  GameAction,
  PactTerm,
  RoomId,
  SpeechIntent,
} from '@/game/types';
import type { PlayerView } from '@/game/views';
import { useGameStore } from '@/state/gameStore';
import { nameIn } from './GameShell';

interface Props {
  view: PlayerView;
  onAction: (action: GameAction) => boolean;
  onRoom: (room: RoomId) => void;
}

const CONVERSATIONS: { id: ConversationIntent; label: string }[] = [
  { id: 'whereabouts', label: 'Ask where they were' },
  { id: 'opinion', label: 'Ask what they think of someone' },
  { id: 'shareEvidence', label: 'Share a piece of evidence' },
  { id: 'accuse', label: 'Accuse someone privately' },
  { id: 'defend', label: 'Defend someone privately' },
  { id: 'confide', label: 'Confide in them' },
  { id: 'pact', label: 'Offer a pact' },
  { id: 'deceive', label: 'Lie about someone' },
  { id: 'threaten', label: 'Threaten them' },
  { id: 'console', label: 'Sit with them' },
];

const SPEECHES: { id: SpeechIntent; label: string }[] = [
  { id: 'accuse', label: 'Accuse' },
  { id: 'defend', label: 'Defend' },
  { id: 'present', label: 'Present evidence' },
  { id: 'question', label: 'Question' },
  { id: 'silent', label: 'Say nothing' },
];

const PACT_TERMS: { id: PactTerm; label: string }[] = [
  { id: 'voteWithMe', label: 'Vote with me at the next count' },
  { id: 'shareInfo', label: 'Share what you learn' },
  { id: 'protect', label: 'Speak for me if I am named' },
  { id: 'keepSecret', label: 'Keep what I tell you' },
  { id: 'silence', label: 'Say nothing about me' },
];

const ROOMS: { id: RoomId; title: string; blurb: string }[] = [
  { id: 'aangan', title: 'The Aangan', blurb: 'The fountain court. Everything is heard here twice.' },
  { id: 'gallery', title: 'The Long Gallery', blurb: 'Mirrors, portraits, and a floor that keeps a route.' },
  { id: 'archive', title: 'The Archive', blurb: 'Sealed since the last steward. Water below.' },
  { id: 'council', title: 'The Council Chamber', blurb: 'The table, the chairs, the place a name is chosen.' },
];

export function PhasePanel({ view, onAction, onRoom }: Props) {
  switch (view.phase) {
    case 'dawn':
      return <DawnPanel view={view} onAction={onAction} />;
    case 'day':
      return <DayPanel view={view} onAction={onAction} onRoom={onRoom} />;
    case 'dusk':
      return <DuskPanel view={view} onAction={onAction} />;
    case 'council':
      return <CouncilPanel view={view} onAction={onAction} />;
    case 'night':
      return <NightPanel view={view} onAction={onAction} />;
    case 'judgment':
      return <JudgmentPanel view={view} onAction={onAction} />;
    case 'finale':
      return <FinalePanel view={view} onAction={onAction} />;
    case 'ending':
      return <EndingPanel view={view} />;
    default:
      return null;
  }
}

function DawnPanel({ view, onAction }: { view: PlayerView; onAction: Props['onAction'] }) {
  const dead = view.contestants.filter((entry) => !entry.alive);
  return (
    <article className="panel">
      <header className="panel__head">
        <p className="eyebrow">Night {view.round} · the Judgment</p>
        <h2>Dawn over Nimbagarh</h2>
        <p className="panel__lede">
          {view.nightNarration.length > 0
            ? view.nightNarration.join(' ')
            : 'The corridors give up nothing this morning.'}
        </p>
      </header>

      <div className="panel__columns">
        <section>
          <h3>The dead, read aloud</h3>
          {dead.length === 0 ? (
            <p className="quiet">No one has left the table.</p>
          ) : (
            <ul className="reveal-list">
              {dead.map((entry) => (
                <li key={entry.id}>
                  <span>{entry.name}</span>
                  <b className={`role-tag role-tag--${entry.revealedRole ?? 'unknown'}`}>
                    {roleLabel(entry.revealedRole)}
                  </b>
                  <em>Night {entry.eliminatedOn ?? '—'}</em>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h3>The flame</h3>
          <p className="quiet">
            The Lantern stands at <b>{view.lantern}</b>. The night has already been charged to it.
          </p>
          <ul className="ledger ledger--compact">
            {view.ledger
              .slice(-4)
              .reverse()
              .map((entry, index) => (
                <li key={`${entry.round}-${index}`}>
                  <span className="ledger__reason">{entry.reason}</span>
                  <span className={entry.delta < 0 ? 'ledger__delta is-loss' : 'ledger__delta is-gain'}>
                    {entry.delta > 0 ? '+' : ''}
                    {entry.delta}
                  </span>
                </li>
              ))}
          </ul>
        </section>
      </div>

      <footer className="panel__foot">
        <button type="button" className="button button--primary" onClick={() => onAction({ type: 'ADVANCE' })}>
          Take the day
        </button>
      </footer>
    </article>
  );
}

function DayPanel({ view, onAction, onRoom }: Props) {
  const me = view.contestants.find((entry) => entry.isPlayer);
  const [targetId, setTargetId] = useState('');
  const [intent, setIntent] = useState<ConversationIntent>('opinion');
  const [subjectId, setSubjectId] = useState('');
  const [clueId, setClueId] = useState('');
  const [lie, setLie] = useState('');
  const [pactTarget, setPactTarget] = useState('');
  const [pactTerm, setPactTerm] = useState<PactTerm>('voteWithMe');

  const others = view.contestants.filter((entry) => entry.alive && !entry.isPlayer);
  const effectiveTarget = others.some((entry) => entry.id === targetId) ? targetId : (others[0]?.id ?? '');
  const subjects = view.contestants.filter((entry) => entry.alive && !entry.isPlayer);
  const effectiveSubject = subjects.some((entry) => entry.id === subjectId)
    ? subjectId
    : (subjects[0]?.id ?? '');
  const effectiveClue = view.clues.some((clue) => clue.id === clueId) ? clueId : (view.clues[0]?.id ?? '');
  const effectivePactTarget = others.some((entry) => entry.id === pactTarget)
    ? pactTarget
    : (others[0]?.id ?? '');

  return (
    <article className="panel">
      <header className="panel__head">
        <p className="eyebrow">Day {view.round}</p>
        <h2>Search, speak, promise</h2>
        <p className="panel__lede">
          Every room is open. Evidence changes what people believe; promises change how they vote. Nothing here is
          free.
        </p>
      </header>

      <section className="panel__section">
        <h3>The palace</h3>
        <div className="room-grid">
          {ROOMS.map((room) => {
            const state = view.rooms.find((entry) => entry.room === room.id);
            return (
              <div key={room.id} className="room-card">
                <div className="room-card__head">
                  <h4>{room.title}</h4>
                  {state?.visited ? <span className="room-card__tag">Searched</span> : null}
                </div>
                <p>{room.blurb}</p>
                <p className="room-card__state">
                  {room.id === 'archive'
                    ? state?.archiveOpen
                      ? state.archiveDrained
                        ? 'The seal is cut. The lower shelves are dry.'
                        : 'The seal is cut. Water still covers the lower shelves.'
                      : 'The seal is intact.'
                    : state?.visited
                      ? 'You have walked it once.'
                      : 'Unvisited.'}
                </p>
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    onRoom(room.id);
                    onAction({ type: 'EXPLORE', room: room.id });
                  }}
                >
                  {room.id === 'archive' && !state?.archiveOpen ? 'Break the seal' : 'Search'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel__section">
        <h3>Work of the day</h3>
        {view.missions.length === 0 ? (
          <p className="quiet">No work is posted. The palace is waiting.</p>
        ) : (
          <div className="mission-list">
            {view.missions.map((mission) => {
              const total = Object.values(mission.contributions).reduce((sum, value) => sum + value, 0);
              const mine = mission.contributions[me?.id ?? ''] ?? 0;
              const percent = Math.min(100, Math.round((total / Math.max(1, mission.threshold)) * 100));
              return (
                <div key={mission.id} className="mission">
                  <div className="mission__head">
                    <h4>{mission.title}</h4>
                    <span className="mission__count">
                      {total} / {mission.threshold}
                    </span>
                  </div>
                  <p>{mission.objective}</p>
                  {view.shadowObjectives[mission.id] ? (
                    <p className="mission__shadow">
                      <b>Shadow objective.</b> {view.shadowObjectives[mission.id]}
                    </p>
                  ) : null}
                  <div className="bar">
                    <span className="bar__fill" style={{ transform: `scaleX(${percent / 100})` }} />
                  </div>
                  <ul className="mission__crew">
                    {Object.entries(mission.contributions)
                      .filter(([, amount]) => amount > 0)
                      .map(([id, amount]) => (
                        <li key={id}>
                          {nameIn(view, id)} <b>{amount}</b>
                        </li>
                      ))}
                  </ul>
                  <p className="mission__status">
                    {mission.status === 'resolved'
                      ? mission.success
                        ? mission.resolvedText ?? 'The work holds.'
                        : 'The work failed. The palace paid for it.'
                      : 'Unresolved.'}
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
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="panel__section">
        <h3>A private word</h3>
        <div className="form-grid">
          <label className="field">
            <span>Speak with</span>
            <select value={effectiveTarget} onChange={(event) => setTargetId(event.target.value)}>
              {others.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Approach</span>
            <select value={intent} onChange={(event) => setIntent(event.target.value as ConversationIntent)}>
              {CONVERSATIONS.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
          {intent === 'accuse' || intent === 'defend' || intent === 'deceive' || intent === 'opinion' ? (
            <label className="field">
              <span>About</span>
              <select value={effectiveSubject} onChange={(event) => setSubjectId(event.target.value)}>
                {subjects.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {intent === 'shareEvidence' ? (
            <label className="field">
              <span>Evidence</span>
              <select value={effectiveClue} onChange={(event) => setClueId(event.target.value)}>
                {view.clues.length === 0 ? <option value="">Nothing in hand</option> : null}
                {view.clues.map((clue) => (
                  <option key={clue.id} value={clue.id}>
                    {clue.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {intent === 'deceive' ? (
            <label className="field field--wide">
              <span>The lie</span>
              <input
                value={lie}
                maxLength={140}
                placeholder="They were in the archive when the seal was cut."
                onChange={(event) => setLie(event.target.value)}
              />
            </label>
          ) : null}
        </div>
        <div className="button-row">
          <button
            type="button"
            className="button"
            onClick={() =>
              onAction({
                type: 'CONVERSE',
                targetId: effectiveTarget,
                intent,
                subjectId:
                  intent === 'accuse' || intent === 'defend' || intent === 'deceive' || intent === 'opinion'
                    ? effectiveSubject
                    : undefined,
                clueId: intent === 'shareEvidence' ? effectiveClue : undefined,
                text: intent === 'deceive' ? lie.trim() || undefined : undefined,
              })
            }
          >
            Speak privately
          </button>
        </div>
      </section>

      <section className="panel__section">
        <h3>A promise</h3>
        <div className="form-grid">
          <label className="field">
            <span>With</span>
            <select value={effectivePactTarget} onChange={(event) => setPactTarget(event.target.value)}>
              {others.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Term</span>
            <select value={pactTerm} onChange={(event) => setPactTerm(event.target.value as PactTerm)}>
              {PACT_TERMS.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
          <div className="field field--action">
            <button
              type="button"
              className="button"
              onClick={() => onAction({ type: 'PROPOSE_PACT', targetId: effectivePactTarget, term: pactTerm })}
            >
              Offer the pact
            </button>
          </div>
        </div>
      </section>

      <footer className="panel__foot">
        <button type="button" className="button button--primary" onClick={() => onAction({ type: 'ADVANCE' })}>
          Ring the dusk bell
        </button>
      </footer>
    </article>
  );
}

function DuskPanel({ view, onAction }: { view: PlayerView; onAction: Props['onAction'] }) {
  const others = view.contestants.filter((entry) => entry.alive && !entry.isPlayer);
  const [targetId, setTargetId] = useState('');
  const effective = others.some((entry) => entry.id === targetId) ? targetId : (others[0]?.id ?? '');
  return (
    <article className="panel">
      <header className="panel__head">
        <p className="eyebrow">Dusk {view.round}</p>
        <h2>The lamps are lit</h2>
        <p className="panel__lede">
          The day is closed. One last private word is possible before the table convenes; after the bell, everything
          said is public.
        </p>
      </header>

      <section className="panel__section">
        <h3>One last word</h3>
        <div className="form-grid">
          <label className="field">
            <span>With</span>
            <select value={effective} onChange={(event) => setTargetId(event.target.value)}>
              {others.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
          <div className="field field--action">
            <button
              type="button"
              className="button"
              onClick={() => onAction({ type: 'CONVERSE', targetId: effective, intent: 'confide' })}
            >
              Speak quietly
            </button>
          </div>
          <div className="field field--action">
            <button
              type="button"
              className="button"
              onClick={() => onAction({ type: 'PROPOSE_PACT', targetId: effective, term: 'voteWithMe' })}
            >
              Ask them to vote with you
            </button>
          </div>
        </div>
      </section>

      <footer className="panel__foot">
        <button type="button" className="button button--primary" onClick={() => onAction({ type: 'ADVANCE' })}>
          Call the council
        </button>
      </footer>
    </article>
  );
}

function CouncilPanel({ view, onAction }: { view: PlayerView; onAction: Props['onAction'] }) {
  const council = view.council;
  const me = view.contestants.find((entry) => entry.isPlayer);
  const [intent, setIntent] = useState<SpeechIntent>('accuse');
  const [targetId, setTargetId] = useState('');
  const [clueId, setClueId] = useState('');
  const [voteId, setVoteId] = useState('');

  if (!council) return null;
  const living = view.contestants.filter((entry) => entry.alive && !entry.isPlayer);
  const eligible = council.round === 2 ? living.filter((entry) => council.tiedIds.includes(entry.id)) : living;
  const effectiveTarget = living.some((entry) => entry.id === targetId) ? targetId : (living[0]?.id ?? '');
  const effectiveVote = eligible.some((entry) => entry.id === voteId) ? voteId : (eligible[0]?.id ?? '');
  const effectiveClue = view.clues.some((clue) => clue.id === clueId) ? clueId : (view.clues[0]?.id ?? '');

  return (
    <article className="panel">
      <header className="panel__head">
        <p className="eyebrow">{council.round === 2 ? 'The Lantern’s Riddle' : `Council · night ${view.round}`}</p>
        <h2>{council.step === 'speech' ? 'The floor is open' : council.step === 'vote' ? 'The count' : 'The result'}</h2>
        <p className="panel__lede">
          {council.step === 'speech'
            ? 'Take the floor once. Every living contestant hears it, and every one of them will take a turn after you.'
            : council.step === 'vote'
              ? council.round === 2
                ? 'The table is tied. Only the tied may be named. A second tie leaves the oath unfinished.'
                : 'Votes are private and locked together. No one sees yours until every vote is fixed.'
              : council.resultText}
        </p>
      </header>

      {council.step === 'speech' ? (
        <section className="panel__section">
          <h3>Your turn</h3>
          <div className="form-grid">
            <label className="field">
              <span>Speech</span>
              <select value={intent} onChange={(event) => setIntent(event.target.value as SpeechIntent)}>
                {SPEECHES.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>
            {intent !== 'silent' && intent !== 'present' ? (
              <label className="field">
                <span>Name</span>
                <select value={effectiveTarget} onChange={(event) => setTargetId(event.target.value)}>
                  {living.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {intent === 'present' ? (
              <label className="field">
                <span>Evidence</span>
                <select value={effectiveClue} onChange={(event) => setClueId(event.target.value)}>
                  {view.clues.length === 0 ? <option value="">Nothing in hand</option> : null}
                  {view.clues.map((clue) => (
                    <option key={clue.id} value={clue.id}>
                      {clue.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
          <div className="button-row">
            <button
              type="button"
              className="button button--primary"
              onClick={() =>
                onAction({
                  type: 'SPEECH',
                  intent,
                  targetId: intent === 'accuse' || intent === 'defend' || intent === 'question' ? effectiveTarget : undefined,
                  clueId: intent === 'present' ? effectiveClue : undefined,
                })
              }
            >
              Take the floor
            </button>
          </div>
        </section>
      ) : null}

      {council.step === 'vote' ? (
        <section className="panel__section">
          <h3>{council.round === 2 ? 'Name one of the tied' : 'Lock your vote'}</h3>
          <div className="target-grid">
            {eligible.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={effectiveVote === entry.id ? 'target is-selected' : 'target'}
                aria-pressed={effectiveVote === entry.id}
                onClick={() => setVoteId(entry.id)}
              >
                <span>{entry.name}</span>
                <small>{entry.revealedRole ? roleLabel(entry.revealedRole) : entry.socialTendency}</small>
              </button>
            ))}
          </div>
          <div className="button-row">
            {me && me.shields > 0 ? (
              <button type="button" className="button" onClick={() => onAction({ type: 'SPEND_SHIELD' })}>
                Spend an Oath Shield ({me.shields})
              </button>
            ) : (
              <span className="quiet">No Oath Shield in hand.</span>
            )}
            <button
              type="button"
              className="button button--primary"
              onClick={() =>
                onAction(
                  council.round === 2
                    ? { type: 'RIDDLE_VOTE', targetId: effectiveVote }
                    : { type: 'VOTE', targetId: effectiveVote },
                )
              }
            >
              {council.round === 2 ? 'Answer the Riddle' : 'Lock the vote'}
            </button>
          </div>
        </section>
      ) : null}

      <section className="panel__section">
        <h3>The room</h3>
        {council.speeches.length === 0 ? (
          <p className="quiet">No one has spoken.</p>
        ) : (
          <ul className="speech-list">
            {council.speeches.map((speech, index) => (
              <li key={`${speech.speakerId}-${index}`}>
                <span className="speech__who">{nameIn(view, speech.speakerId)}</span>
                <span className="speech__intent">{speech.intent}</span>
                <p>{speech.text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {council.step === 'reveal' ? (
        <section className="panel__section">
          <h3>The tally</h3>
          <ul className="tally">
            {(council.tally ?? []).map((entry) => (
              <li key={entry.contestantId}>
                <span>{nameIn(view, entry.contestantId)}</span>
                <span className="tally__bar">
                  <span
                    className="tally__fill"
                    style={{ transform: `scaleX(${Math.min(1, entry.votes / 6)})` }}
                  />
                </span>
                <b>{entry.votes}</b>
              </li>
            ))}
          </ul>
          <p className="council__result">{council.resultText}</p>
        </section>
      ) : null}

      <footer className="panel__foot">
        {council.step === 'reveal' ? (
          <button type="button" className="button button--primary" onClick={() => onAction({ type: 'ADVANCE' })}>
            Leave for the night
          </button>
        ) : (
          <span className="quiet">The night waits on the count.</span>
        )}
      </footer>
    </article>
  );
}

function NightPanel({ view, onAction }: { view: PlayerView; onAction: Props['onAction'] }) {
  const night = view.night;
  const me = view.contestants.find((entry) => entry.isPlayer);
  const [veilTarget, setVeilTarget] = useState('');
  const [readTarget, setReadTarget] = useState('');
  const [wardTarget, setWardTarget] = useState('');
  const [sabotage, setSabotage] = useState('');

  if (!night || !me) return null;
  const living = view.contestants.filter((entry) => entry.alive);
  const veilOptions = living.filter(
    (entry) => !view.shadowAllies.includes(entry.id) && !entry.isPlayer && entry.id !== me.id,
  );
  const readOptions = living.filter((entry) => !entry.isPlayer);
  const lastWard = view.intel.wards[view.intel.wards.length - 1]?.targetId ?? null;
  const wardOptions = living.filter((entry) => !entry.isPlayer && entry.id !== lastWard);

  const effectiveVeil = veilOptions.some((entry) => entry.id === veilTarget)
    ? veilTarget
    : (veilOptions[0]?.id ?? '');
  const effectiveRead = readOptions.some((entry) => entry.id === readTarget)
    ? readTarget
    : (readOptions[0]?.id ?? '');
  const effectiveWard = wardOptions.some((entry) => entry.id === wardTarget)
    ? wardTarget
    : (wardOptions[0]?.id ?? '');

  const needsChoice = night.canVeil || night.canRead || night.canWard;
  const blocked = night.canVeil && !effectiveVeil;

  return (
    <article className="panel">
      <header className="panel__head">
        <p className="eyebrow">Night {view.round}</p>
        <h2>The palace keeps its own counsel</h2>
        <p className="panel__lede">
          {view.ownRole === 'shadow'
            ? 'Choose what the dark will do. Your allies have left advice in the channel; the choice is yours.'
            : view.ownRole === 'keeper'
              ? 'A Keeper may Read one person and learn their faction exactly. No one will know you did.'
              : view.ownRole === 'warden'
                ? 'A Warden may ward one person. The Veil cannot take them tonight.'
                : 'You hold no night action. Wait, listen, and remember who is missing at dawn.'}
        </p>
      </header>

      {night.proposals.length > 0 ? (
        <section className="panel__section">
          <h3>The Shadowed channel</h3>
          <ul className="proposals">
            {night.proposals.map((proposal) => (
              <li key={proposal.speakerId}>
                <span>{nameIn(view, proposal.speakerId)}</span>
                <p>proposes {nameIn(view, proposal.targetId)} for the Veil.</p>
              </li>
            ))}
          </ul>
          {view.intel.channel.length > 0 ? (
            <ul className="channel channel--inline">
              {view.intel.channel.slice(-4).map((message) => (
                <li key={message.id}>{message.text}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {night.canVeil ? (
        <section className="panel__section">
          <h3>Draw the Veil</h3>
          <div className="target-grid">
            {veilOptions.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={effectiveVeil === entry.id ? 'target is-selected is-lethal' : 'target is-lethal'}
                aria-pressed={effectiveVeil === entry.id}
                onClick={() => setVeilTarget(entry.id)}
              >
                <span>{entry.name}</span>
                <small>{entry.socialTendency}</small>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {night.canRead ? (
        <section className="panel__section">
          <h3>Read a faction</h3>
          <div className="target-grid">
            {readOptions.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={effectiveRead === entry.id ? 'target is-selected' : 'target'}
                aria-pressed={effectiveRead === entry.id}
                onClick={() => setReadTarget(entry.id)}
              >
                <span>{entry.name}</span>
                <small>{entry.socialTendency}</small>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {night.canWard ? (
        <section className="panel__section">
          <h3>Set the ward</h3>
          {wardOptions.length === 0 ? (
            <p className="quiet">There is no one left you can ward tonight.</p>
          ) : (
            <div className="target-grid">
              {wardOptions.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={effectiveWard === entry.id ? 'target is-selected is-ward' : 'target is-ward'}
                  aria-pressed={effectiveWard === entry.id}
                  onClick={() => setWardTarget(entry.id)}
                >
                  <span>{entry.name}</span>
                  <small>{entry.socialTendency}</small>
                </button>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {night.canSabotage ? (
        <section className="panel__section">
          <h3>Work a small ruin</h3>
          <div className="sabotage-list">
            <button
              type="button"
              className={sabotage === '' ? 'target is-selected' : 'target'}
              aria-pressed={sabotage === ''}
              onClick={() => setSabotage('')}
            >
              <span>Nothing tonight</span>
            </button>
            {SABOTAGES.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={sabotage === entry.id ? 'target is-selected is-lethal' : 'target is-lethal'}
                aria-pressed={sabotage === entry.id}
                onClick={() => setSabotage(entry.id)}
              >
                <span>{entry.label}</span>
                <small>{entry.text}</small>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <footer className="panel__foot">
        <button
          type="button"
          className="button button--primary"
          disabled={blocked}
          onClick={() =>
            onAction({
              type: 'NIGHT_ACTION',
              veilTarget: night.canVeil ? effectiveVeil : undefined,
              readTarget: night.canRead ? effectiveRead : undefined,
              wardTarget: night.canWard && effectiveWard ? effectiveWard : undefined,
              sabotage: night.canSabotage && sabotage ? sabotage : undefined,
            })
          }
        >
          {needsChoice ? 'Close the night' : 'Wait for the Judgment'}
        </button>
        {blocked ? <span className="quiet">Choose whom the Veil takes.</span> : null}
      </footer>
    </article>
  );
}

function JudgmentPanel({ view, onAction }: { view: PlayerView; onAction: Props['onAction'] }) {
  const dead = view.contestants.filter((entry) => entry.revealedRole !== null);
  return (
    <article className="panel">
      <header className="panel__head">
        <p className="eyebrow">The Judgment of the Flame</p>
        <h2>{view.outcome ? 'The palace has decided' : 'The roles of the dead'}</h2>
        <p className="panel__lede">{view.nightNarration.join(' ') || 'The flame is read; the room is silent.'}</p>
      </header>

      <section className="panel__section">
        <ul className="reveal-list reveal-list--large">
          {dead.map((entry) => (
            <li key={entry.id}>
              <span>{entry.name}</span>
              <b className={`role-tag role-tag--${entry.revealedRole ?? 'unknown'}`}>
                {roleLabel(entry.revealedRole)}
              </b>
              <em>{entry.alive ? 'living' : `night ${entry.eliminatedOn ?? '—'}`}</em>
            </li>
          ))}
        </ul>
      </section>

      <footer className="panel__foot">
        <button type="button" className="button button--primary" onClick={() => onAction({ type: 'ADVANCE' })}>
          {view.outcome ? 'Read the last page' : 'Break the dawn'}
        </button>
      </footer>
    </article>
  );
}

function FinalePanel({ view, onAction }: { view: PlayerView; onAction: Props['onAction'] }) {
  const finale = view.finale;
  const [testimony, setTestimony] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [voteId, setVoteId] = useState('');

  if (!finale) return null;
  const living = view.contestants.filter((entry) => entry.alive && !entry.isPlayer);
  const eligible = finale.round === 2 ? living.filter((entry) => finale.tiedIds.includes(entry.id)) : living;
  const effectiveVote = eligible.some((entry) => entry.id === voteId) ? voteId : (eligible[0]?.id ?? '');
  const me = view.contestants.find((entry) => entry.isPlayer);

  return (
    <article className="panel">
      <header className="panel__head">
        <p className="eyebrow">The finale · night {view.round}</p>
        <h2>
          {finale.step === 'reckoning'
            ? 'The reckoning'
            : finale.step === 'question'
              ? 'The last question'
              : finale.step === 'vote'
                ? 'One name'
                : 'The final unmasking'}
        </h2>
        <p className="panel__lede">
          {finale.step === 'reckoning'
            ? 'Every living contestant gives a final testimony. Then the Lantern asks you one question.'
            : finale.step === 'question'
              ? finale.question
              : finale.step === 'vote'
                ? finale.round === 2
                  ? 'The first naming tied. The Riddle is open: only the tied may be named. A second tie leaves the oath unlit.'
                  : 'The table names one person. If they are Shadowed, the Oathkeepers take the flame. If not, the Shadowed do.'
                : finale.resultText}
        </p>
      </header>

      <section className="panel__section">
        <h3>Testimony</h3>
        <ul className="speech-list">
          {finale.testimonies.map((entry, index) => (
            <li key={`${entry.contestantId}-${index}`}>
              <span className="speech__who">{nameIn(view, entry.contestantId)}</span>
              <p>{entry.text}</p>
            </li>
          ))}
        </ul>
        {finale.answers.length > 0 ? (
          <>
            <h3>Answers</h3>
            <ul className="speech-list">
              {finale.answers.map((entry, index) => (
                <li key={`${entry.contestantId}-${index}`}>
                  <span className="speech__who">{nameIn(view, entry.contestantId)}</span>
                  <p>{entry.text}</p>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>

      {!me?.alive ? (
        <footer className="panel__foot">
          <button type="button" className="button button--primary" onClick={() => onAction({ type: 'ADVANCE' })}>
            Let the table finish
          </button>
        </footer>
      ) : null}

      {me?.alive && finale.step === 'reckoning' ? (
        <section className="panel__section">
          <label className="field field--wide">
            <span>Your final testimony</span>
            <textarea
              value={testimony}
              maxLength={320}
              rows={3}
              placeholder="Say the thing you have not said."
              onChange={(event) => setTestimony(event.target.value)}
            />
          </label>
          <div className="button-row">
            <button
              type="button"
              className="button button--primary"
              disabled={testimony.trim().length < 2}
              onClick={() => onAction({ type: 'FINAL_TESTIMONY', text: testimony })}
            >
              Give your testimony
            </button>
          </div>
        </section>
      ) : null}

      {me?.alive && finale.step === 'question' ? (
        <section className="panel__section">
          <label className="field field--wide">
            <span>{finale.question}</span>
            <textarea
              value={answerText}
              maxLength={280}
              rows={3}
              onChange={(event) => setAnswerText(event.target.value)}
            />
          </label>
          <div className="button-row">
            <button
              type="button"
              className="button button--primary"
              disabled={answerText.trim().length < 2}
              onClick={() => onAction({ type: 'FINAL_ANSWER', text: answerText })}
            >
              Answer the Lantern
            </button>
          </div>
        </section>
      ) : null}

      {me?.alive && finale.step === 'vote' ? (
        <section className="panel__section">
          <div className="target-grid">
            {eligible.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={effectiveVote === entry.id ? 'target is-selected is-lethal' : 'target is-lethal'}
                aria-pressed={effectiveVote === entry.id}
                onClick={() => setVoteId(entry.id)}
              >
                <span>{entry.name}</span>
                <small>{entry.socialTendency}</small>
              </button>
            ))}
          </div>
          <div className="button-row">
            <button
              type="button"
              className="button button--primary"
              onClick={() => onAction({ type: 'FINAL_VOTE', targetId: effectiveVote })}
            >
              {finale.round === 2 ? 'Answer the Riddle' : 'Name them'}
            </button>
          </div>
        </section>
      ) : null}

      {finale.step === 'reveal' ? (
        <footer className="panel__foot">
          <button type="button" className="button button--primary" onClick={() => onAction({ type: 'ADVANCE' })}>
            Unmask the court
          </button>
        </footer>
      ) : null}
    </article>
  );
}

function EndingPanel({ view }: { view: PlayerView }) {
  const restart = useGameStore((state) => state.restart);
  const abandon = useGameStore((state) => state.abandon);
  const ending = view.ending;
  if (!ending) return null;

  return (
    <article className={`panel panel--ending is-${ending.faction}`}>
      <header className="panel__head">
        <p className="eyebrow">{ending.faction === 'oathkeeper' ? 'The flame holds' : 'The flame is taken'}</p>
        <h2>{ending.title}</h2>
        <p className="ending__epilogue">{ending.epilogue}</p>
      </header>

      <div className="ending__stats">
        <div>
          <span>{ending.playerSurvived ? 'You survived' : 'You did not survive'}</span>
        </div>
        <div>
          <span>Pacts kept</span>
          <b>{ending.pactsKept}</b>
        </div>
        <div>
          <span>Pacts broken</span>
          <b>{ending.pactsBroken}</b>
        </div>
      </div>

      <section className="panel__section">
        <h3>The unmasking</h3>
        <ul className="unmask">
          {ending.unmasking.roles.map((entry) => (
            <li key={entry.contestantId} className={entry.alive ? '' : 'is-dead'}>
              <span>{entry.name}</span>
              <b className={`role-tag role-tag--${entry.role}`}>{roleLabel(entry.role)}</b>
              <em>{entry.alive ? 'survived' : 'lost'}</em>
            </li>
          ))}
        </ul>
      </section>

      {ending.unmasking.lies.length > 0 ? (
        <section className="panel__section">
          <h3>What was not true</h3>
          <ul className="lies">
            {ending.unmasking.lies.map((lie, index) => (
              <li key={index}>
                <b>{nameIn(view, lie.speakerId)}</b>
                <p>{lie.text}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="panel__section">
        <h3>Decisions that mattered</h3>
        <ul className="decisions">
          {ending.unmasking.decisions.map((decision, index) => (
            <li key={index}>{decision}</li>
          ))}
        </ul>
      </section>

      <footer className="panel__foot">
        <button type="button" className="button button--primary" onClick={restart}>
          Play again
        </button>
        <button type="button" className="button" onClick={abandon}>
          Return to the title
        </button>
      </footer>
    </article>
  );
}

function roleLabel(role: string | null): string {
  switch (role) {
    case 'shadow':
      return 'Shadowed';
    case 'keeper':
      return 'Lantern Keeper';
    case 'warden':
      return 'Warden';
    case 'oathkeeper':
      return 'Oathkeeper';
    default:
      return 'Unread';
  }
}

