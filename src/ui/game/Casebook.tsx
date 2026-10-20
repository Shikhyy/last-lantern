import { useState } from 'react';
import type { GameAction } from '@/game/types';
import type { PlayerView } from '@/game/views';
import { nameIn } from './GameShell';

export type CasebookTab = 'evidence' | 'board' | 'journal' | 'ledger' | 'notes';
type Tab = CasebookTab;

type ThreadKind = 'supports' | 'contradicts' | 'places' | 'suspects';

const THREADS: { id: ThreadKind; label: string }[] = [
  { id: 'supports', label: 'Supports' },
  { id: 'contradicts', label: 'Contradicts' },
  { id: 'places', label: 'Places at' },
  { id: 'suspects', label: 'Suspicion' },
];

const TABS: { id: Tab; label: string }[] = [
  { id: 'evidence', label: 'Evidence' },
  { id: 'board', label: 'Board' },
  { id: 'journal', label: 'Journal' },
  { id: 'ledger', label: 'Ledger' },
  { id: 'notes', label: 'Intel' },
];

export function Casebook({
  view,
  onAction,
  initialTab = 'evidence',
}: {
  view: PlayerView;
  onAction: (action: GameAction) => boolean;
  initialTab?: CasebookTab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [threadFrom, setThreadFrom] = useState('');
  const [threadTo, setThreadTo] = useState('');
  const [threadKind, setThreadKind] = useState<ThreadKind>('supports');
  const [threadError, setThreadError] = useState<string | null>(null);
  const openClaims = view.claims.length;

  const nodes = [
    ...view.contestants.map((person) => ({ id: `person:${person.id}`, label: person.name, group: 'People' })),
    ...view.clues.map((clue) => ({ id: `clue:${clue.id}`, label: clue.title, group: 'Evidence' })),
    ...['aangan', 'gallery', 'archive', 'council'].map((room) => ({ id: `room:${room}`, label: roomName(room), group: 'Places' })),
  ];

  const nodeLabel = (id: string) => nodes.find((node) => node.id === id)?.label ?? id.replace(/^[a-z]+:/, '');

  const linkThread = () => {
    setThreadError(null);
    if (!threadFrom || !threadTo || threadFrom === threadTo) {
      setThreadError('Choose two different pins.');
      return;
    }
    const accepted = onAction({ type: 'BOARD_LINK', from: threadFrom, to: threadTo, kind: threadKind });
    if (!accepted) {
      setThreadError('That thread could not be pinned.');
      return;
    }
    setThreadFrom('');
    setThreadTo('');
  };

  const pin = (nodeId: string) => {
    setThreadError(null);
    if (!threadFrom) {
      setThreadFrom(nodeId);
      return;
    }
    if (threadFrom === nodeId) {
      setThreadFrom('');
      return;
    }
    setThreadTo(nodeId);
  };

  return (
    <div className="casebook">
      <div className="casebook__tabs" role="tablist" aria-label="Casebook">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={tab === entry.id}
            className={tab === entry.id ? 'casebook__tab is-active' : 'casebook__tab'}
            onClick={() => setTab(entry.id)}
          >
            {entry.label}
            {entry.id === 'evidence' && view.clues.length > 0 ? (
              <span className="casebook__badge">{view.clues.length}</span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="casebook__body">
        {tab === 'evidence' ? (
          <>
            {view.clues.length === 0 ? (
              <p className="casebook__empty">
                Nothing in your hands yet. Search a room; evidence is found, not given.
              </p>
            ) : (
              <ul className="clue-list">
                {view.clues.map((clue) => (
                  <li key={clue.id} className="clue">
                    <div className="clue__head">
                      <h3>{clue.title}</h3>
                      <span className="clue__type">{clue.type}</span>
                    </div>
                    <p className="clue__body">{clue.body}</p>
                    {clue.tell ? (
                      <p className="clue__tell">
                        <b>Tell.</b> {clue.tell}
                      </p>
                    ) : (
                      <button
                        type="button"
                        className="button button--quiet"
                        onClick={() => onAction({ type: 'EXAMINE', clueId: clue.id })}
                      >
                        Look again
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className="casebook__section">
              <h3>What has been said</h3>
              {openClaims === 0 ? (
                <p className="casebook__empty">No testimony recorded.</p>
              ) : (
                <ul className="claim-list">
                  {[...view.claims]
                    .slice(-14)
                    .reverse()
                    .map((claim) => (
                      <li key={claim.id}>
                        <span className="claim__who">
                          {nameIn(view, claim.speakerId)}
                          {claim.aboutId ? ` on ${nameIn(view, claim.aboutId)}` : ''}
                        </span>
                        <span className="claim__text">{claim.text}</span>
                        <span className="claim__night">Night {claim.night}</span>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </>
        ) : null}

        {tab === 'board' ? (
          <>
            <p className="casebook__note">
              The board is yours alone. Pin a person, a clue, or a room, then pin a second to draw a thread. Nothing
              here changes what the court knows.
            </p>
            <div className="board-pins" role="group" aria-label="Evidence pins">
              {['People', 'Evidence', 'Places'].map((group) => (
                <div key={group} className="board-pins__group">
                  <h4>{group}</h4>
                  <div className="board-pins__grid">
                    {nodes
                      .filter((node) => node.group === group)
                      .map((node) => (
                        <button
                          key={node.id}
                          type="button"
                          className={
                            threadFrom === node.id
                              ? 'board-pin is-from'
                              : threadTo === node.id
                                ? 'board-pin is-to'
                                : 'board-pin'
                          }
                          aria-pressed={threadFrom === node.id || threadTo === node.id}
                          onClick={() => pin(node.id)}
                        >
                          {node.label}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="board-thread-maker">
              <div className="board-thread-maker__pair">
                <span>{threadFrom ? nodeLabel(threadFrom) : 'First pin'}</span>
                <b>{threadKind === 'contradicts' ? '≠' : threadKind === 'supports' ? '→' : threadKind === 'places' ? '@' : '?'}</b>
                <span>{threadTo ? nodeLabel(threadTo) : 'Second pin'}</span>
              </div>
              <div className="segmented segmented--wide board-thread-maker__kinds">
                {THREADS.map((thread) => (
                  <button
                    key={thread.id}
                    type="button"
                    className={threadKind === thread.id ? 'segmented__item is-active' : 'segmented__item'}
                    aria-pressed={threadKind === thread.id}
                    onClick={() => setThreadKind(thread.id)}
                  >
                    {thread.label}
                  </button>
                ))}
              </div>
              <button type="button" className="button button--primary" disabled={!threadFrom || !threadTo} onClick={linkThread}>
                Pin the thread
              </button>
              <button type="button" className="text-button" onClick={() => { setThreadFrom(''); setThreadTo(''); setThreadError(null); }}>
                Clear pins
              </button>
            </div>
            {threadError ? <p className="form-error" role="alert">{threadError}</p> : null}
            <div className="casebook__section">
              <div className="board-thread-head">
                <h3>Threads</h3>
                {view.boardLinks.length > 0 ? (
                  <button type="button" className="text-button text-button--danger" onClick={() => onAction({ type: 'BOARD_CLEAR' })}>
                    Clear the board
                  </button>
                ) : null}
              </div>
              {view.boardLinks.length === 0 ? (
                <p className="casebook__empty">No threads yet. Pin two things that do not sit easily together.</p>
              ) : (
                <ul className="board-threads">
                  {[...view.boardLinks].reverse().map((link) => (
                    <li key={link.id} className={`board-thread is-${link.kind}`}>
                      <span className="board-thread__kind">{THREADS.find((thread) => thread.id === link.kind)?.label ?? link.kind}</span>
                      <span className="board-thread__names">
                        {nodeLabel(link.from)} <b>·</b> {nodeLabel(link.to)}
                      </span>
                      <span className="quiet">Night {link.round}</span>
                      <button type="button" className="toast__close" aria-label="Remove thread" onClick={() => onAction({ type: 'BOARD_UNLINK', id: link.id })}>
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : null}

        {tab === 'journal' ? (
          <ol className="journal">
            {[...view.journal].reverse().map((entry) => (
              <li key={entry.id} className={`journal__item journal__item--${entry.kind}`}>
                <span className="journal__night">Night {entry.round}</span>
                <h3>{entry.title}</h3>
                <p>{entry.text}</p>
              </li>
            ))}
          </ol>
        ) : null}

        {tab === 'ledger' ? (
          <>
            <p className="casebook__note">
              Every point of the Lantern is accounted for. At zero, the palace goes dark.
            </p>
            <ul className="ledger">
              {[...view.ledger].reverse().map((entry, index) => (
                <li key={`${entry.round}-${index}`}>
                  <span className="ledger__night">N{entry.round}</span>
                  <span className="ledger__reason">{entry.reason}</span>
                  <span className={entry.delta < 0 ? 'ledger__delta is-loss' : 'ledger__delta is-gain'}>
                    {entry.delta > 0 ? '+' : ''}
                    {entry.delta}
                  </span>
                  <span className="ledger__after">{entry.after}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {tab === 'notes' ? (
          <>
            <div className="casebook__section">
              <h3>Private pacts</h3>
              {view.pacts.length === 0 ? (
                <p className="casebook__empty">You have promised nothing.</p>
              ) : (
                <ul className="pact-list">
                  {view.pacts.map((pact) => (
                    <li key={pact.id}>
                      <span>{nameIn(view, pact.a === view.contestants.find((c) => c.isPlayer)?.id ? pact.b : pact.a)}</span>
                      <span className={`pact__status is-${pact.status}`}>{pact.status}</span>
                      <span className="pact__term">{pact.term}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {view.intel.reads.length > 0 ? (
              <div className="casebook__section">
                <h3>Readings</h3>
                <ul className="intel-list">
                  {view.intel.reads.map((read, index) => (
                    <li key={`${read.targetId}-${index}`}>
                      <span>Night {read.night}</span>
                      <b>{nameIn(view, read.targetId)}</b>
                      <em>{read.faction === 'shadow' ? 'Shadowed' : 'Oathkeeper'}</em>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {view.intel.wards.length > 0 ? (
              <div className="casebook__section">
                <h3>Wards</h3>
                <ul className="intel-list">
                  {view.intel.wards.map((ward, index) => (
                    <li key={`${ward.targetId}-${index}`}>
                      <span>Night {ward.night}</span>
                      <b>{nameIn(view, ward.targetId)}</b>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {view.ownRole === 'shadow' && view.intel.channel.length > 0 ? (
              <div className="casebook__section">
                <h3>The Shadowed channel</h3>
                <ul className="channel">
                  {view.intel.channel.map((message) => (
                    <li key={message.id}>
                      <span>Night {message.night}</span>
                      <p>{message.text}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="casebook__section">
              <h3>Your dossier</h3>
              <p className="casebook__note">
                {view.contestants.find((entry) => entry.isPlayer)?.tell ?? 'You keep your own counsel.'}
              </p>
              <p className="casebook__note">
                {view.contestants.find((entry) => entry.isPlayer)?.socialTendency}
              </p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function roomName(room: string): string {
  switch (room) {
    case 'gallery':
      return 'The Long Gallery';
    case 'archive':
      return 'The Archive';
    case 'council':
      return 'The Council Chamber';
    default:
      return 'The Aangan';
  }
}
