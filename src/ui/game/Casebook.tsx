import { useState } from 'react';
import type { GameAction } from '@/game/types';
import type { PlayerView } from '@/game/views';
import { nameIn } from './GameShell';

type Tab = 'evidence' | 'journal' | 'ledger' | 'notes';

const TABS: { id: Tab; label: string }[] = [
  { id: 'evidence', label: 'Evidence' },
  { id: 'journal', label: 'Journal' },
  { id: 'ledger', label: 'Ledger' },
  { id: 'notes', label: 'Intel' },
];

export function Casebook({
  view,
  onAction,
}: {
  view: PlayerView;
  onAction: (action: GameAction) => boolean;
}) {
  const [tab, setTab] = useState<Tab>('evidence');
  const openClaims = view.claims.length;

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
