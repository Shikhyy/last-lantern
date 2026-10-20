# ACCEPTANCE CRITERIA — THE LAST LANTERN

> Depends on: `00-DESIGN_CANON.md` and the full document set.
> Status: **proposed release gate.** A build is not "done" because it runs; it is done when
> every criterion below has evidence. Nothing in this document authorises implementation before
> the owner approves `IMPLEMENTATION_PLAN.md` §13.

## 1. How to use this document

1. **Binary, not aspirational.** Each criterion is pass or fail. "Not run", "looks fine" and
   "works on my machine" are fails.
2. **One ID, one owner, one artifact.** Every check has an ID, a gate, a method and an evidence
   path. The evidence path is recorded in the gate report, not in chat.
3. **Evidence before assertion.** A pass requires a test report, trace, screenshot, video,
   signed review or exported manifest. A verbal claim is not evidence.
4. **Canon wins.** If a criterion and `00-DESIGN_CANON.md` disagree, the canon wins and this
   document is corrected before the gate is run.
5. **No silent waivers.** Only the owner may waive a Major or Minor item, in writing, with an
   expiry and a follow-up task. **Blockers are never waivable.**

### 1.1 Methods

| Code | Method | Typical evidence |
|---|---|---|
| **T** | Automated test (Vitest, React Testing Library, Playwright) | JUnit/JSON report, trace, screenshot |
| **S** | Headless simulation (1,000 seeds, fixed 20-seed regression set) | Simulation report with distributions |
| **M** | Manual review against a named document section | Signed checklist with screenshots |
| **P** | Playtest with a defined protocol | Session notes, recording, questionnaire |
| **X** | Accessibility audit (axe + keyboard + screen reader + manual) | axe JSON plus manual checklist |
| **L** | Legal / licence / provenance review | Manifest export, licence files, sign-off |

### 1.2 Severity

| Severity | Meaning | Release rule |
|---|---|---|
| **Blocker** | Corrupts rules, fairness, saves, legal provenance, or blocks a core path | Must be closed at every gate where it appears |
| **Major** | Visible quality or usability failure on a shipped surface | Must be closed before the gate passes |
| **Minor** | Polish, copy, or a non-blocking edge case | May ship with a written note and an owner-approved follow-up |

### 1.3 Environment matrix

Every gate is run in the following matrix, not only on the developer's machine:

| Dimension | Required coverage |
|---|---|
| Desktop browsers | Current Chrome, Edge, Firefox, Safari |
| Desktop sizes | 1440 × 900 and 1280 × 720 |
| Reference desktop GPU | Integrated graphics class (M-series MacBook Air or Intel Iris Xe) |
| Mobile browsers | iOS Safari (iPhone 13/14 class), Chrome (Pixel 7 class) |
| Mobile sizes | 390 × 844 and 360 × 800 |
| Low-tier mobile | One device or throttled profile at 4× CPU slowdown |
| Settings | Default; reduced motion; colourblind palette; text 175%; keyboard-only; untimed day |
| Failure modes | No WebGL; WebGL context loss; corrupt save; missing asset; audio blocked; LLM offline |
| Network | First load online; then offline reload and full play |
| Seeds | 1,000 simulation seeds; 20 fixed regression seeds; one fixed slice seed |

### 1.4 Evidence layout

```
artifacts/acceptance/<gate>/<criterion-id>/
  report.json | report.txt
  trace.zip | screenshot.png | recording.mp4
  checklist.md            # signed manual review
  manifest-export.json    # licence / asset checks
```

The gate report links every criterion to one of these paths. A gate with missing artifacts is
a failed gate.

## 2. Gate map

| Gate | Milestone | Question it answers | Pass condition |
|---|---|---|---|
| **G0 Canon** | M0 start | Is the design set approved, consistent and buildable? | Owner sign-off; zero canon conflicts; M0 plan accepted |
| **G1 Slice** | M1 | Can one night be played end to end and is the foundation honest? | All G1 criteria pass; slice report published |
| **G2 Loop** | M2 | Is the full 12-player loop playable, fair and saveable? | All G2 criteria pass; every screen reachable |
| **G3 Story** | M3 | Do the chapters, cast and endings land as authored? | Narrative review passed; all endings reachable |
| **G4 Look** | M4 | Does the palace read as built, not assembled? | Every room passes `ART_DIRECTION.md` §14 |
| **G5 Access** | M5 | Can everyone play it on desktop and mobile? | All accessibility and mobile gates pass |
| **G6 Release** | M6 | Is it safe, legal, fast, recoverable and complete? | All release gates pass; signed release candidate |

## 3. Functional and rules acceptance

| ID | Gate | Criterion | Method | Evidence |
|---|---|---|---|---|
| **F-01** | G1 | A New Game creates exactly 12 seats: one player and eleven AI; every character appears once; the player occupies one seat and can be any role. | T | `unit/match-create` |
| **F-02** | G2 | Role assignment is independent of character, dossier, personality and player oath: exactly 3 Shadowed, 1 Keeper, 1 Warden and 7 Oathkeepers. Over 10,000 seeds each of the 11 AI characters and the player seat receives each role within the statistical tolerance. The only character-specific input is the documented soft anti-repeat history on the same save (disabled by Fully Random); no dossier, personality, appearance or oath influences the draw. | T + M | `property/roles`, code review note |
| **F-03** | G1 | The phase machine enforces Dawn → Day → Dusk → Council → Night → Judgment → next Dawn; illegal transitions such as Day → Night are rejected without changing state. | T | `unit/machine` |
| **F-04** | G1 | The Lantern's −10 nightly tick is applied exactly once per Dawn. Every change is a ledger event with a reason; no mission, sabotage, shield or Veil change is applied twice. | T | `property/lantern-ledger` |
| **F-05** | G2 | The Lantern is clamped to 0–120. At 0 the match ends in The Long Dark; at 100+ from Dawn 2 onward the Radiant Lantern boon is offered once per match; the starting 100 does not grant it; the boon reveals one authored public truth and never a hidden role; every value 0–120 maps to exactly one display state from Radiant to Dark. | T + M | `property/lantern-bounds`, `manual/hud-states` |
| **F-06** | G2 | All three mission families and their three variants ship. Each has a public objective, a secret Shadow objective, an authored reward, a failure state and a discoverable tell. A contestant contributes at most twice per mission. | T + M | `mission-suite`, `manual/missions` |
| **F-07** | G1 | Night actions resolve in the documented order. A Ward blocks a Veil and the rite is spent. The Keeper's Read returns the true faction. A Shadowed Veil is legal only on Nights 1, 3 and 5; Nights 2 and 4 offer sabotage only; Night 6 has no Veil. | T | `unit/night`, `property/night` |
| **F-08** | G2 | The Warden cannot ward self, cannot ward the same contestant on consecutive nights, and invalid targets are visibly unavailable with a written reason. | T + M | `unit/ward`, `manual/ward-ui` |
| **F-09** | G2 | The Keeper's Read is exact in the baseline. `Clouded` appears only when the optional Smoke variant is enabled, and the result never leaks to another contestant or to the player's UI unless it is their own Read. | T | `unit/keeper`, `security/role-leak` |
| **F-10** | G1 | Council gives every living contestant one floor turn; the player can accuse, defend, present evidence, question or stay silent. Votes lock simultaneously; no AI changes a vote after seeing the player's locked vote. | T + M | `unit/council`, `e2e/council` |
| **F-11** | G1 | The count uses the highest remaining tally. Each shield cancels one vote against its holder, up to two. A zero tally means no elimination and −10 Lantern. A tie triggers the Lantern's Riddle; a second tie means no elimination and −15 Lantern. | T | `property/count` |
| **F-12** | G1 | The Judgment reveals every contestant eliminated since the previous Dawn, council and Veil alike, and reveals no role earlier. The Testament is recorded as a claim, not as truth. | T + M | `unit/judgment`, `manual/judgment` |
| **F-13** | G2 | Pacts can be proposed, accepted, refused, kept and broken. The Pact Ledger records terms, duration and breach; the ending calculation reads it; no third party sees a private Pact until it is used or revealed. | T + M | `unit/pacts`, `manual/pacts` |
| **F-14** | G2 | Embers are earned and spent correctly: Oath Shield 3, Private Note 1, Archive Pass 2, Lantern Oil 2. Shields cap at two, cannot be traded, and are public when spent. No currency goes negative. | T | `property/embers` |
| **F-15** | G2 | All five evidence types exist with a truth state known only to the engine. A clue is discoverable only in the correct room state. Each night places at least one clue that can point toward a Shadow and away from an Oathkeeper. At least one red herring has a discoverable tell. No clue is generated by an LLM. | T + M | `property/clues`, `manual/clue-audit` |
| **F-16** | G2 | The Evidence Board is player-built: nodes and links only, no auto-solve, no engine truth labels, no hidden correction. It persists across saves and is exported in the archive. | T + M | `unit/board`, `manual/board` |
| **F-17** | G2 | Conversations support the twelve intents, evidence attachment, claim recording, contradiction detection and memory. Free text is never required. An AI answer cites only facts it holds. | T + M | `unit/conversation`, `manual/dialogue` |
| **F-18** | G2 | Difficulty changes AI noise, memory length and clue count only. It never changes the rules, the truth, the role distribution or a clue's meaning. Guided mode is orthogonal and changes only player-facing help. | T + M | `property/difficulty`, `manual/difficulty` |
| **F-19** | G2 | The finale triggers at four or fewer survivors after a Judgment, or at Dawn 6 at the latest. It contains the Reckoning, the Last Question, the Final Vote, the Unmasking and the Epilogue, with no autoplay. | T + M | `e2e/finale`, `manual/finale` |
| **F-20** | G3 | All six endings exist with the canon triggers, a 20–45 second cinematic, a written epilogue, the final vote ledger and the oath ledger. A 1,000-seed simulation reaches every ending; no ending requires an impossible state. | S + M | `simulation/endings`, `manual/endings` |
| **F-21** | G2 | If the player is eliminated, Spectator Mode lets them watch the remaining match, keep their notes and see the ending they caused. The eliminated player takes no action and casts no vote. | T + M | `e2e/spectator` |
| **F-22** | G2 | New Game, Continue, Restart, Replay with same seed and Replay with same cast all work. Restart never leaks the previous match's roles, clues or AI knowledge. | T | `e2e/replay` |
| **F-23** | G1 | Save and load restore the exact phase, Lantern, seats, roles, clues, claims, pacts, votes and RNG cursor. Autosave occurs after every phase transition and every council. Manual save is offered only in Day, Dusk and Council, with a written reason when unavailable. | T | `e2e/save-roundtrip` |
| **F-24** | G1 | Pause is available in every play surface and offers Resume, Journal, Settings, Save, Accessibility and Quit to Title. Pausing never advances a timer or an AI decision. | T + M | `e2e/pause` |
| **F-25** | G2 | Every action is reachable by keyboard, mouse and touch. No pointer-only action exists. Keys are rebindable; invert-Y and sensitivity exist. No mission requires precision aiming or rapid tapping. | T + X | `e2e/input`, `manual/controls` |
| **F-26** | G2 | Every screen S01–S24 is reachable in a normal playthrough or from the stated menu, has a written empty state, and has a working back, close or escape path. No dead end exists. | T + M | `e2e/screen-reachability` |
| **F-27** | G2 | A typical match lasts 4–5 nights and 25–40 minutes; a full six-night match may run to about 60. One night cycle lasts 6–10 minutes. The simulation report shows the distribution, not a single cherry-picked run. | S + P | `simulation/pacing`, playtest notes |
| **F-28** | G1 | The game is deterministic: the same seed and input log produce a byte-identical event log and final state. No `Math.random()` exists in `src/game` or `src/ai`. | T | `property/replay` |
| **F-29** | G1 | No hidden role leaks through UI, logs, network payloads, LLM prompts, accessibility text, source maps or error messages. The player's own role is visible only to the player and, if the player is Shadowed, their two Shadowed teammates; it is never shown on a shared or public surface before the Judgment reveals it. | T + M | `security/role-leak`, `manual/leak-review` |
| **F-30** | G2 | An eliminated contestant casts no vote, makes no proposal, updates no state and appears in no new dialogue. They may appear only in Testament, flashback, archive and Unmasking. | T | `property/dead-dont-act` |
| **F-31** | G2 | The Lantern economy is not degenerate: over 1,000 seeds the meter does not pin at 0 or 120 for most matches, both Radiant and Long Dark are reachable, and mission/sabotage values produce a spread of outcomes rather than one dominant strategy. | S | `simulation/economy` |
| **F-32** | G2 | The baseline game is fully playable offline with templates. The LLM verbalizer is off by default, optional, behind an adapter, never decides facts, and falls back silently. No API key exists in the client bundle. | T + M | `e2e/offline`, `security/bundle-scan` |
| **F-33** | G6 | The Archive records seed, cast, roles, survivors, votes, pacts, ending and duration; supports filtering and JSON export; and never deletes a record without explicit confirmation. | T + M | `e2e/archive` |
| **F-34** | G6 | All player-facing strings are externalised; no string is assembled by concatenation in a way that breaks translation; numbers and dates use `Intl`; cultural terms stay with a glossary; proper names carry `translate="no"`. | T + M | `unit/i18n`, `manual/i18n` |
| **F-35** | G6 | A content warning appears before the first cinematic, naming betrayal, disappearance and confinement. Cinematics, missions and the finale are skippable, and every skip leaves a transcript or summary. | T + M | `e2e/content-warning` |

### 3.1 Critical Given/When/Then checks

**AC-01 — Role distribution and independence**

- **Given** a fresh save and any player name, pronouns and oath
- **When** a New Game is created with 10,000 seeds
- **Then** every match has exactly 3 Shadowed, 1 Keeper, 1 Warden and 7 Oathkeepers; the player
  is never a thirteenth seat; each of the 11 AI characters appears exactly once; the player seat
  receives each role within tolerance; the only character-specific input is the soft anti-repeat
  history; and no dossier, personality, appearance or oath influences the draw.
- **Fail if** any role count differs, any AI character is duplicated, the player seat is
  excluded from the distribution, or a character's dossier predicts their role across seeds.

**AC-02 — Night resolution and the Ward**

- **Given** a Night 1 state with a living Warden and three living Shadowed
- **When** the Shadowed veil contestant X and the Warden wards X
- **Then** X survives, the Veil rite is spent, the Shadowed learn that a Ward blocked them but
  not who cast it, and the Dawn narration reports a failed Veil without naming the Warden.
- **And when** the same state is replayed without the Ward
- **Then** X is eliminated and their role is revealed only at the Judgment.
- **Fail if** the Veil succeeds through a Ward, the Warden is named, the rite remains available,
  or the role leaks before Judgment.

**AC-03 — Vote count, shields and ties**

- **Given** a council with votes A=4, B=4, C=1 and A holds one shield
- **When** the vote locks and A spends the shield
- **Then** the tally is A=3, B=4, C=1; B is eliminated.
- **And given** A=4, B=4 with no shields
- **When** the count ties
- **Then** the Lantern's Riddle runs for 30 seconds; a second tie means no elimination and −15
  Lantern.
- **And given** every tally is reduced to zero by shields
- **Then** no one is eliminated and the Lantern loses 10; the zero-tally case is logged.
- **Fail if** a shield changes a vote rather than cancelling one, an AI changes a locked vote,
  or a second tie eliminates someone.

**AC-04 — Delayed Judgment**

- **Given** a council eliminates contestant X on Night 2, and Night 2 has no Veil
- **When** the Night phase and the Dawn Judgment resolve
- **Then** X's role is revealed only at that Judgment, and no UI, dialogue, dossier or AI
  knowledge contains X's role before it.
- **And given** a Veil eliminates Y on Night 3
- **Then** Y's role is revealed at the Dawn 4 Judgment, alongside any council elimination from
  Night 3, with both names and roles shown.
- **Fail if** a role appears in the Journal, dossier, evidence board, AI dialogue or source
  before the Judgment.

**AC-05 — No-omniscience**

- **Given** 1,000 seeded matches with scripted player policies (random, rational, adversarial)
- **When** every AI knowledge snapshot before and after every event is diffed
- **Then** no Oathkeeper AI's belief changes in response to a fact it did not observe, was not
  told, or could not infer from those; no AI reads the player's Journal or board; only Shadowed
  read the Shadow channel; dead AI do not act.
- **Fail if** any delta references engine truth, another AI's private knowledge, the player's
  private notes, or a post-elimination event. The failure report includes the seed, event index
  and the exact forbidden source.

**AC-06 — Save, reload and corrupt save**

- **Given** a match saved in the Council phase with five living contestants, two pacts, three
  clues and a locked vote
- **When** the page reloads and Continue is selected
- **Then** the phase, Lantern, seats, roles, clues, claims, pacts, votes and RNG cursor are
  identical; no vote is re-rolled; no AI re-decides.
- **And given** a save with a truncated JSON body
- **When** the game boots
- **Then** the raw save is preserved, an export is offered, and the game starts a new match
  without deleting the corrupt data.
- **Fail if** a reload changes state, loses a save, or silently discards corrupt data.

**AC-07 — Deterministic replay**

- **Given** a seed and an input log containing movement, examination, conversation, council
  and night decisions
- **When** the match is replayed headlessly and in the browser
- **Then** both produce a byte-identical event log and final state, including all AI choices,
  vote locks and ending selection.
- **Fail if** any AI decision, clue placement, vote or ending differs, or if `Math.random()`
  appears in the game or AI modules.

**AC-08 — Keyboard and reduced motion**

- **Given** a keyboard-only player with `prefers-reduced-motion: reduce`
- **When** they start a new game, create a contestant, walk the Aangan, talk to two AI, play a
  mission, vote at council and reach the ending
- **Then** every action is reachable with Tab, arrows, Enter/Space and Escape; focus is always
  visible; no focus trap exists; all camera travel becomes a cut; the flame is static; every
  state is still conveyed by text and number.
- **Fail if** any action requires a pointer, focus is lost after a modal, or reduced motion
  removes information.

**AC-09 — Performance and quality tiers**

- **Given** the reference integrated-GPU desktop at 1440p and the reference mobile at 390
- **When** the Aangan, a mission, a council and the finale are each measured for 60 seconds
- **Then** desktop frame time is ≤16.6 ms and mobile ≤33.3 ms; draw calls, triangles, textures,
  lights and audio voices are within `TECHNICAL_ARCHITECTURE.md` §7; initial JS is within the
  gzip budget; and the medium tier holds without a quality switch mid-scene.
- **Fail if** any hard budget is exceeded, the frame time is achieved only by dropping to a
  lower tier without telling the player, or the mobile fallback cannot complete the game.

**AC-10 — Licence and provenance audit**

- **Given** a release candidate build
- **When** `scripts/license-audit.mjs` and `scripts/validate-assets.mjs` run
- **Then** every file in `public/` and every shipped asset has a manifest row, a valid licence,
  a credit line and a stored licence text where required; no reference-only image, show asset,
  logo, celebrity likeness or copyrighted music is present.
- **Fail if** the audit has one warning, one unlicensed file, one broken credit link, or one
  asset whose provenance is "unknown".

**AC-11 — Ending reachability and consequence**

- **Given** 1,000 seeded matches with the three scripted policies
- **When** the simulation ends each match
- **Then** all six endings occur at least once; the Unlit Oath requires a second tied final
  vote; The Long Dark requires Lantern 0; The Gilded Betrayal requires a broken Pact that
  directly caused the Shadow win; and each ending's Unmasking lists the votes, pacts, lies and
  player decisions that produced it.
- **Fail if** any ending is unreachable, any trigger is impossible, or the Unmasking contradicts
  the event log.

**AC-12 — Offline play and LLM failure**

- **Given** a browser that has loaded the game once and is then offline, with no LLM endpoint
- **When** the player starts and completes a match
- **Then** the full game runs from templates; no network request is required; the LLM adapter
  fails silently to templates; and no error dialog appears for flavour text.
- **Fail if** the game blocks on a network call, a missing LLM, or shows a raw error to the
  player.

## 4. AI fairness and behaviour acceptance

| ID | Gate | Criterion | Method | Evidence |
|---|---|---|---|---|
| **A-01** | G1 | No-omniscience: for 1,000 seeds, every AI knowledge delta references only observations, testimony, role knowledge or inferences from those. | S | `simulation/omniscience` |
| **A-02** | G2 | No journal or board leak: the player's notes, links and private annotations never enter AI knowledge unless the player explicitly shares a subset. | T + S | `property/journal-leak` |
| **A-03** | G2 | Shadow-only shared knowledge: only Shadowed read the Shadow channel; no other AI knowledge references it; the Keeper's Read and Warden's target never enter it. | T + S | `property/shadow-channel` |
| **A-04** | G2 | Dead-don't-act: eliminated AI cast no vote, make no proposal, update no state and speak no new line. | T | `property/dead-ai` |
| **A-05** | G1 | Determinism: identical seed and input log produce identical AI decisions, utterances and votes. | T | `property/ai-determinism` |
| **A-06** | G2 | Suspicion updates are bounded and monotonic in the authored direction for a known clue; relationships change correctly for kept and broken pacts; no update exceeds its clamp. | T | `unit/suspicion`, `unit/relationships` |
| **A-07** | G2 | Memory follows the character profile; decay respects the high-emotion and betrayal floor; at least one memory callback occurs per two nights. | T + M | `unit/memory`, `manual/callbacks` |
| **A-08** | G2 | Every utterance is built from an `UtterancePlan` whose facts are engine-verified references. The template verbalizer cannot add a fact, name, place or time. | T | `property/utterance-facts` |
| **A-09** | G2 | If the LLM adapter is enabled, its output is validated against the plan's allowed facts, length-capped, escaped and never rendered as HTML; on failure it falls back to templates. | T + M | `unit/llm-adapter`, `manual/llm` |
| **A-10** | G2 | Difficulty changes noise, memory and clue count only. It never changes what an AI knows, the truth of a clue or the role distribution. | T | `property/difficulty-ai` |
| **A-11** | G2 | AI never hard-target the player for being the player. Targeting is explained by suspicion, role, relationships and opportunity; disagreement is staged, not unanimous. | S + P | `simulation/targeting`, playtest notes |
| **A-12** | G2 | AI can accuse, defend, confide, lie, propose, refuse, betray and console. Over 1,000 seeds the rates fall inside the authored bands and no single behaviour dominates. | S | `simulation/behaviour-mix` |
| **A-13** | G2 | Only legal Shadow proposals are generated: Veil on Nights 1, 3 and 5; sabotage on Nights 2 and 4; no Veil on Night 6. | T | `property/shadow-proposals` |
| **A-14** | G3 | Blind human evaluation: three conversations are read without knowing the source; the template baseline is not identifiable as generated, and at least 70% of playtesters say an AI conversation felt "like it was listening." | P | `playtest/dialogue` |
| **A-15** | G2 | The simulation report includes win rates by role, match length, clue discovery, accusations, pacts, ending distribution and every invariant result. No invariant fires. | S | `simulation/report` |
| **A-16** | G2 | AI do not know eliminated roles before the public Judgment; after the Judgment, the public role is available to all as public knowledge. | T | `property/reveal-timing` |
| **A-17** | G2 | AI cannot infer a role from a character's dossier, voice, appearance or the player's oath. Role-independent dossiers are enforced by content schema and test. | T + M | `schema/characters`, `manual/cast-audit` |
| **A-18** | G2 | The AI never sees suspicion numbers in the player UI; the player sees only behaviour, statements, votes, pacts and the player's own notes. | M | `manual/belief-display` |

## 5. Narrative and content acceptance

| ID | Gate | Criterion | Method | Evidence |
|---|---|---|---|---|
| **N-01** | G3 | Eleven original AI contestants plus the player and host exist, each with biography, voice, six personality axes, private motive, secret, memory profile, social tendency and role-independent tells. | M | `manual/cast` |
| **N-02** | G3 | Six chapters, the 3:20 opening, the daily scenes, missions, reveals, arcs, branching conversations and six endings are authored and present. | M + T | `manual/narrative`, `content/schema` |
| **N-03** | G3 | The opening cinematic is 3:20 ±10 seconds, skippable from the second shot, subtitled, transcripted, ends on the title card and hands control to the player. | T + M | `e2e/opening`, `manual/opening` |
| **N-04** | G3 | The host never lies, never tells the whole truth, never uses modern slang, and all host lines are authored, not generated. | M | `manual/host-lines` |
| **N-05** | G3 | Each of the six endings has a 20–45 second cinematic, a written epilogue, the final vote ledger and the oath ledger, and its trigger matches `GAME_DESIGN.md` §12. | T + M | `simulation/endings`, `manual/endings` |
| **N-06** | G3 | The consequence model is visible: trust, evidence, pacts, votes and night actions feed the ending, and the Unmasking can show the player the chain from a choice to a consequence. | M | `manual/unmasking` |
| **N-07** | G3 | Cultural terms are used respectfully, defined in the glossary, and reviewed by a cultural reader; no costume, ritual or character is a caricature. | M + P | `review/cultural` |
| **N-08** | G3 | No supernatural explanation is confirmed. Every haunting has a human, physical cause that can be found, or the ending deliberately chooses ambiguity. | M | `manual/supernatural` |
| **N-09** | G3 | No show footage, format copy, logo, soundtrack, celebrity likeness or copied dialogue appears. All characters and lines are original. | L + M | `legal/originality` |
| **N-10** | G6 | A content warning precedes the first cinematic; it names betrayal, disappearance and confinement; it can be revisited from Settings. | T + M | `e2e/content-warning` |
| **N-11** | G3 | If a match resolves before a chapter is played, that chapter's essential reveals are delivered in the Unmasking and epilogue, not silently dropped. | M + S | `manual/early-finale` |
| **N-12** | G3 | Every Testament is stored as a claim, not as truth; the player may add it to the Evidence Board; an AI may lie in it. | T + M | `unit/testament` |
| **N-13** | G3 | The player's Oath grants a social bonus and a private line, never a role bias or a hidden statistical advantage that reveals faction. | T + M | `property/oaths` |
| **N-14** | G3 | Dossiers are role-independent; motives and secrets are discoverable through play and can change an AI's stance or produce evidence. | T + M | `schema/dossiers`, `manual/secrets` |
| **N-15** | G1 | The vertical slice contains the oath and first light, the cut seal, the Kabir and Tara conversations, the Archive Ledger mission, the first Veil, the first Council and the first Judgment. | T + M | `e2e/slice` |

## 6. Art, 3D and audio acceptance

| ID | Gate | Criterion | Method | Evidence |
|---|---|---|---|---|
| **V-01** | G4 | Every shipped room passes `ART_DIRECTION.md` §14 at 1440p: correct sandstone and brass, a readable key light with a visible source, jali shadow detail, at least three palace-specific architectural elements, human scale and no primitive silhouettes. | M | `manual/room-review` |
| **V-02** | G4 | Sandstone, brass, textile, water, wood and mirror-work use the authored PBR ranges; no plastic sheen, no untextured surface, no flat colour standing in for a material. | M | `manual/materials` |
| **V-03** | G4 | Lighting uses one key, one soft fill and one rim per room; practicals are motivated; static geometry is lightmapped; dynamic lights are limited to flame, characters and moving props. | M + T | `manual/lighting`, `perf/lights` |
| **V-04** | G4 | Scale is honest: 1 unit = 1 m, eye height 1.65 m, corridor 3.6 m, arch 4.2 m, gallery 6 m, courtyard 28 × 22 m; a human reference is visible in every review shot. | M | `manual/scale` |
| **V-05** | G4 | The 60–90 piece modular kit ships with LODs, collision hulls, lightmap UVs, trim-friendly UVs and instancing for repeated modules. | T + M | `asset/kit`, `manual/kit` |
| **V-06** | G4 | All 12 characters have original faces, authored clothing, LOD0/1/2, ≤72 bones, visemes, a gesture set and the required diversity of age, body, skin tone and regional dress. No celebrity likeness. | M + L | `manual/characters`, `legal/likeness` |
| **V-07** | G4 | Room states are visible and persistent: doors, lights, water, damage, flooding, clue markers and eliminated chairs. The map and the world agree. | T + M | `e2e/room-states` |
| **V-08** | G2 | No banned visual device appears: gradient decoration, glass/blur panels, hairline boxes, icon-card rows, index numbering, tiny uppercase labels, monospace outside code, emoji icons, rest shadows, glows, purple AI palettes, low-poly rooms or grey placeholders. | M | `manual/banned-list` |
| **V-09** | G2 | All UI uses the three-layer tokens; no raw hex exists outside `tokens.css`; the accent, danger, focus and field tokens resolve as specified. | T | `lint/tokens` |
| **V-10** | G2 | Fraunces and Public Sans are the only families; the scale, measure, two-line headline rule, tabular numerals and sentence-case rule hold at 1440, 768 and 390. | M + T | `manual/type`, `visual/type` |
| **V-11** | G2 | Motion uses GSAP/Lenis for story and CSS/GSAP for HUD; transform and opacity only; no layout animation; 150–1100 ms; no bounce or elastic; every motion has a reduced variant. | M + T | `manual/motion`, `e2e/reduced-motion` |
| **V-12** | G4 | Cinematics are in-engine, skippable, subtitled, transcripted, reduced-motion safe and free of flashes above 3 Hz. The grade and grain match play. | T + M | `e2e/cinematics`, `manual/cinematics` |
| **V-13** | G4 | Audio uses the four buses with ducking; positional emitters are zone-aware; every audio clue has a visual equivalent; music and sound are original or licensed; no show theme. | M + L | `manual/audio`, `legal/audio` |
| **V-14** | G2 | The WebGL fallback shows a real still of the Aangan, a plain explanation and a link to the text-only accessible mode; the game remains completable without 3D. | T + M | `e2e/no-webgl` |
| **V-15** | G6 | Every model is GLB with Draco/Meshopt; every texture is KTX2/Basis with LOD tiers; every asset has a manifest ID, licence, credit and validation result. | T + L | `asset/validate`, `license/audit` |
| **V-16** | G4 | Each room gets a screenshot review, the top three issues are fixed, and the room is re-reviewed once. The review is signed and dated. | M | `manual/lookdev` |

## 7. UI and UX acceptance

| ID | Gate | Criterion | Method | Evidence |
|---|---|---|---|---|
| **U-01** | G2 | All screens S01–S24 exist and are reachable: Boot, Title, Continue/Archive, Settings, Creation, Prologue, HUD, Exploration, Conversation, Journal, Evidence Board, Dossier, Map, Mission, Mission Result, Night Action, Shadow Channel, Council, Vote Result/Judgment, Testament, Finale/Unmasking, Ending, Archive, Pause/Save. | T + M | `e2e/screens` |
| **U-02** | G2 | Every screen has a written empty state; no blank panel, grey bar or unlabelled placeholder ships. | M | `manual/empty-states` |
| **U-03** | G1 | Focus is always visible; focus is restored after overlays; no keyboard trap; a skip link exists on app screens; `Esc` closes overlays. | T + X | `e2e/focus`, `axe/focus` |
| **U-04** | G5 | Every screen renders at 1440, 768 and 390 without horizontal scroll; below 390 a written notice and the storyboard mode appear. | T + M | `visual/responsive` |
| **U-05** | G1 | The HUD shows the Lantern Meter with value, state word and shape across 0–120; notifications use `aria-live="polite"` and never cover the interaction prompt. | T + M | `unit/hud`, `manual/hud` |
| **U-06** | G2 | Conversation uses the three-column layout, the twelve intents, the evidence strip, the pact draft, the history ledger and keyboard shortcuts; it becomes a full-screen sheet on mobile. | T + M | `e2e/conversation` |
| **U-07** | G2 | The Journal has Oaths, Notes, Timeline, People, Glossary and Chapter tabs; two-page desktop and single-page mobile; search; pin-to-board; persistence across saves. | T + M | `e2e/journal` |
| **U-08** | G2 | The Evidence Board supports nodes, links, inspect, remove, tidy and keyboard linking; it never marks a clue true or false; it exports in the archive. | T + M | `e2e/board` |
| **U-09** | G2 | The Dossier shows the jharokha portrait, city, six axes, public timeline, known claims and player notes; compare mode works; the role section stays locked until reveal. | T + M | `e2e/dossier` |
| **U-10** | G2 | The Map is an architectural line plan with room states and filters; it is a memory aid, not a route-finder; no fast travel. | M + T | `manual/map` |
| **U-11** | G2 | The Mission UI shows objective, role chip, Lantern projection, participants and timer; the Shadow objective is phrased as an optional mission step, never as "sabotage." | T + M | `e2e/mission` |
| **U-12** | G2 | Night Action screens share one composition and name the action in plain language; Keeper, Warden, Shadowed and Oathkeeper paths are distinct; invalid targets carry a reason. | T + M | `e2e/night-ui` |
| **U-13** | G2 | Council shows the table, floor ring, composer, vote discs, tally, tie card and keyboard path; eliminated seats are covered; the active speaker is the only lit column. | T + M | `e2e/council-ui` |
| **U-14** | G2 | The Finale supports Reckoning, Last Question, Final Vote and Unmasking; the Unmasking is step-through, never autoplay; all roles, pacts, lies and votes are visible. | T + M | `e2e/finale-ui` |
| **U-15** | G5 | Mobile uses 44 px targets, 8 px spacing, `touch-action: manipulation`, left thumbstick, right drag look, tap interact, safe-area insets and subtitles on by default. | T + X | `e2e/mobile` |
| **U-16** | G6 | Settings groups Display, Audio, Motion, Accessibility, Controls and Data; every control has a visible label, numeric value, `aria-pressed` where relevant and a Restore Defaults action. | T + M | `e2e/settings` |
| **U-17** | G2 | Creation validates name, pronouns, oath and difficulty; empty name defaults to "The Stranger" with a note; the primary action is disabled only while the name field is focused-empty; the portrait updates live. | T + M | `e2e/creation` |
| **U-18** | G2 | The Title screen uses a real in-engine Aangan shot, a left-third vertical menu, a brass focus marker and no card or gradient overlay. | M | `manual/title` |
| **U-19** | G2 | Loading uses the flame height, not a bar; failure shows the fallback and the accessible-mode link; loading text ends with an ellipsis. | T + M | `e2e/loading` |
| **U-20** | G6 | Error states are written, actionable and never expose a stack trace, save contents, hidden role or API key. | T + M | `e2e/errors` |
| **U-21** | G6 | Credits list Photographic references, Textures, Fonts, Sound and Tools, with `Used under <licence>. <author>. <source>.` and working links; Credits are reachable from Settings and the Ending. | M + L | `manual/credits` |
| **U-22** | G2 | Pause dims the world by tone step, not blur; Save is disabled with a written reason outside Day, Dusk and Council; Quit to Title confirms unsaved progress. | T + M | `e2e/pause-ui` |
| **U-23** | G2 | No screen uses a generic dashboard device; every bounded region is a tone field or an architectural frame; every ornament has a state. | M | `manual/visual-review` |
| **U-24** | G2 | All long content truncates with an ellipsis, flex children carry `min-w-0`, and no layout breaks at the longest authored string in English and the Hindi pseudo-locale. | T + M | `visual/long-strings` |

## 8. Accessibility acceptance

| ID | Gate | Criterion | Method | Evidence |
|---|---|---|---|---|
| **X-01** | G5 | App screens meet WCAG 2.2 AA; axe reports zero serious or critical issues; manual review covers what axe cannot. | X | `axe/all-screens`, `manual/a11y` |
| **X-02** | G5 | Running text is ≥4.5:1 on its field; large display type is ≥3:1; gold is never body text; focus and disabled states remain legible. | X | `contrast/report` |
| **X-03** | G5 | Focus is a 2 px ring with 2 px offset and an inner tone step, visible on basalt, sandstone and flame fields. | X | `manual/focus` |
| **X-04** | G5 | Every screen is keyboard reachable in a logical order with no trap; a skip link exists on app screens; `Esc` returns focus to the invoking control. | T + X | `e2e/keyboard`, `axe/keyboard` |
| **X-05** | G5 | App screens are semantic HTML with headings, lists, tables, labels and live regions; play surfaces have a parallel text-only mode with the same information and choices. | T + X | `manual/screen-reader`, `e2e/text-mode` |
| **X-06** | G5 | Reduced motion removes travel, parallax, camera drift and flame flicker; transitions become cuts; the Lantern state is still numeric and labelled. | T + X | `e2e/reduced-motion` |
| **X-07** | G5 | Three colourblind palettes preserve luminance steps and all shape labels; faction, role and vote outcome are never hue-only. | X + M | `manual/colourblind` |
| **X-08** | G5 | All speech has captions; all important sound has a visual equivalent; transcripts exist for cinematics and chapters; no audio-only clue or mechanic exists. | T + X | `manual/captions`, `e2e/audio-clues` |
| **X-09** | G5 | Cognitive settings include difficulty, guided mode, untimed day, glossary, "remind me" and no timed reading in dialogue. | T + X | `e2e/cognitive` |
| **X-10** | G5 | Motor settings include no precision aiming, hold-to-walk alternatives, remappable keys, no rapid-tap requirement and an assist completion for mission puzzles that costs Lantern. | T + X | `e2e/motor` |
| **X-11** | G5 | No strobe, no full-screen high-contrast flash above 3 Hz, no flame strobe; the photosensitivity check passes. | M + T | `manual/photosensitivity` |
| **X-12** | G5 | Text scales 100–175% and reflows without clipping or horizontal scroll; no text is baked into an image. | T + X | `visual/text-175` |
| **X-13** | G6 | Strings are externalised; `Intl` is used for numbers and dates; cultural terms stay with a glossary; proper names and code carry `translate="no"`. | T + M | `unit/i18n`, `manual/i18n` |
| **X-14** | G5 | Text-only Accessible Play mode presents the full game logic, map state, evidence, conversations, council and finale without requiring 3D navigation or audio. | T + X | `e2e/text-mode` |
| **X-15** | G5 | Touch targets are ≥44 px with ≥8 px spacing; no double-tap zoom delay; `touch-action: manipulation` is set. | T + X | `e2e/touch` |
| **X-16** | G5 | Safe-area insets are respected on all full-bleed screens and no control sits under a notch or home indicator. | T + M | `visual/safe-area` |
| **X-17** | G6 | The content warning is readable by a screen reader, dismissible by keyboard and revisitible from Settings. | T + X | `e2e/content-warning` |
| **X-18** | G5 | Subtitles default on for mobile, support S/M/L/XL, show speaker names and bracket sound effects, and never cover the primary action. | T + M | `e2e/subtitles` |
| **X-19** | G5 | No audio-only information exists; every emitter, clue and cue has a visual equivalent in play and in cinematics. | T + M | `manual/audio-parity` |
| **X-20** | G5 | A manual accessibility review is signed for every shipped screen, including the 3D play surfaces and the fallback. | X | `manual/a11y-signoff` |

## 9. Performance and resilience acceptance

| ID | Gate | Criterion | Method | Evidence |
|---|---|---|---|---|
| **P-01** | G1 | Desktop frame time is ≤16.6 ms at 1440p on the reference integrated GPU at the medium tier. | T | `perf/desktop-trace` |
| **P-02** | G5 | Mobile frame time is ≤33.3 ms at 390 on the reference device at the low/medium tier. | T | `perf/mobile-trace` |
| **P-03** | G2 | Initial JS is ≤900 KB gzip desktop and ≤700 KB mobile. | T | `size/report` |
| **P-04** | G2 | First playable is ≤6 s desktop and ≤10 s mobile on a good connection. | T | `perf/first-playable` |
| **P-05** | G2 | First-load assets are ≤3 MB desktop and ≤2 MB mobile before palace streaming. | T | `size/assets` |
| **P-06** | G1 | Draw calls are ≤250 desktop and ≤140 mobile in the Aangan, mission, council and finale. | T | `perf/draw-calls` |
| **P-07** | G1 | Visible triangles are ≤1.5 M desktop and ≤500 K mobile. | T | `perf/triangles` |
| **P-08** | G2 | Textures in view are ≤80 MB VRAM desktop and ≤32 MB mobile. | T | `perf/vram` |
| **P-09** | G2 | Dynamic lights are ≤4 desktop and ≤2 mobile per room; shadow maps are 2048 desktop and 1024 mobile. | T | `perf/lights` |
| **P-10** | G2 | Audio voices are ≤24 desktop and ≤12 mobile; music ducking and positional emitters do not exceed the cap. | T | `perf/audio` |
| **P-11** | G6 | A 30-minute soak shows no heap growth above 10% and no frame-time degradation above 20%. | T | `perf/soak` |
| **P-12** | G2 | Zone streaming never produces a hitch above 100 ms; the door iris masks the transition; unloaded zones release memory. | T | `perf/streaming` |
| **P-13** | G2 | Quality tiers are detected by GPU/memory/benchmark, can be overridden, and never switch silently mid-scene. | T + M | `e2e/quality` |
| **P-14** | G6 | WebGL context loss pauses, attempts restore, and otherwise falls back to the poster/text mode without losing the save. | T | `e2e/context-loss` |
| **P-15** | G6 | A missing model, texture, HDRI, font or audio file degrades to the documented fallback tone or caption; it never crashes or shows magenta. | T | `e2e/asset-failure` |
| **P-16** | G6 | After the first load, the full game is playable offline with no network request. | T | `e2e/offline` |
| **P-17** | G6 | CI fails on a size-budget regression, a missing licence, a type error, a failing test or a serious a11y issue. | T | `ci/report` |
| **P-18** | G6 | Performance evidence includes a Playwright trace, draw-call count, triangle count, JS bytes and a screenshot at 1440 and 390. | T | `perf/evidence` |

## 10. Save, privacy and security acceptance

| ID | Gate | Criterion | Method | Evidence |
|---|---|---|---|---|
| **S-01** | G2 | Every save has a schema version and a migration chain; migrations are tested across at least two prior versions. | T | `unit/migrations` |
| **S-02** | G1 | Autosave runs after every phase transition and every council; manual save is available in Day, Dusk and Council; reload restores exact state. | T | `e2e/save` |
| **S-03** | G2 | A corrupt or unmigratable save is preserved, offered as an export and never deleted; the player can start a new match. | T | `e2e/corrupt-save` |
| **S-04** | G6 | Save import is schema-validated and size-capped before parsing; malformed JSON cannot execute code or crash the app. | T | `security/import` |
| **S-05** | G6 | No account, PII or telemetry by default; any opt-in telemetry is anonymous, documented and off until consent. | M + T | `privacy/review` |
| **S-06** | G6 | No secrets, API keys or private endpoints exist in the client bundle; any LLM key lives on an optional proxy. | T | `security/bundle-scan` |
| **S-07** | G6 | CSP forbids `eval` and remote script; images, fonts and media are self-hosted; connect-src is limited to the optional proxy. | T | `security/csp` |
| **S-08** | G6 | LLM output is treated as untrusted: validated against the plan, length-capped, escaped and never inserted as HTML. | T | `security/llm-output` |
| **S-09** | G6 | Export includes seed, schema version, cast, roles, votes, pacts, ending and a checksum; import rejects a mismatched or truncated file with a written message. | T | `e2e/export-import` |
| **S-10** | G6 | The Archive record is durable, filterable and exportable; deletion requires explicit confirmation and never removes the wrong record. | T + M | `e2e/archive-delete` |
| **S-11** | G6 | A privacy statement is reachable from Settings and explains local-only saves, optional telemetry and LLM use. | M | `manual/privacy` |
| **S-12** | G6 | Error reports never include a hidden role, a save body, a private note or an API key. | T + M | `security/error-report` |

## 11. Legal, licensing and provenance acceptance

| ID | Gate | Criterion | Method | Evidence |
|---|---|---|---|---|
| **L-01** | G1 | Every shipped asset has a manifest row with source, author, licence, credit line, URL and fallback. | L + T | `license/manifest` |
| **L-02** | G6 | `scripts/license-audit.mjs` passes with zero warnings; `docs/licenses/` holds the licence text for every non-CC0 asset. | L | `license/audit` |
| **L-03** | G6 | The Credits screen lists every required attribution with a working link and the format `Used under <licence>. <author>. <source>.` | L + M | `manual/credits` |
| **L-04** | G6 | No reality-show footage, still, logo, set design, soundtrack, contestant likeness, celebrity face or voice, editorial-only image, scraped image or unclear-licence sound appears. | L | `legal/forbidden-scan` |
| **L-05** | G6 | Fraunces and Public Sans are self-hosted, subset, OFL 1.1, with the OFL text included; no third family ships. | L + T | `license/fonts` |
| **L-06** | G6 | All characters, voices and lines are original; any voice actor has a written consent and licence; no real person's voice is cloned. | L + M | `legal/voice` |
| **L-07** | G6 | The build never claims to be an exact reconstruction of Suryagarh Palace; the About/Credits state the fictional palace and the real architectural inspiration. | M + L | `manual/honesty` |
| **L-08** | G6 | The architecture reference distinguishes grounded features from invented rooms; the fictional palace, hidden passages, Lantern Chamber and mirrored bay are labelled fictional. | M | `manual/architecture-honesty` |
| **L-09** | G6 | No reference-only photograph or archived Suryagarh page is redistributed in the build. | L | `license/reference-scan` |
| **L-10** | G6 | Mocap, voice, music and any commercial asset have a licence that explicitly permits commercial interactive use and redistribution inside an app bundle. | L | `legal/commercial-licences` |
| **L-11** | G6 | A cultural review is signed by a reader familiar with Rajasthani material culture; findings are closed or documented. | M | `review/cultural` |
| **L-12** | G6 | The privacy statement and content warning are present and accurate. | M + L | `manual/privacy` |
| **L-13** | G6 | No generative image or voice model is used to create a real person's likeness or voice, or to impersonate a real place or brand. | L + M | `legal/generative` |
| **L-14** | G6 | All third-party code licences (MIT, ISC, Apache-2.0, OFL) are listed; no copyleft code is linked into the client without review. | L + T | `license/code` |

## 12. Release gate checklist

> The **Gate** column in §§3–11 names the final gate at which a criterion must fully pass. A
> checklist below may require an earlier, narrower pass of a later criterion — for example, one
> room at G1 instead of every room at G4. Those earlier checks are recorded as `<ID>-slice` and
> do not close the full criterion.

### G0 — Canon

- [ ] All twelve requested documents, `00-DESIGN_CANON.md` and `README.md` exist.
- [ ] `00-DESIGN_CANON.md` is the single source of truth; no unresolved conflict remains.
- [ ] The owner has approved the design set and `IMPLEMENTATION_PLAN.md` §13.
- [ ] The execution method (subagent-driven or native) is chosen.
- [ ] No production code exists before this gate.

### G1 — Vertical slice

- [ ] F-01, F-03, F-04, F-07, F-10, F-11, F-12, F-23, F-24, F-28, F-29.
- [ ] A-01, A-04, A-05.
- [ ] N-15.
- [ ] V-01, V-08, V-10, V-11, V-14.
- [ ] U-01, U-03, U-05, U-17, U-18, U-19, U-22.
- [ ] X-01, X-03, X-04, X-06, X-14.
- [ ] P-01, P-06, P-07.
- [ ] S-02.
- [ ] L-01.
- [ ] The slice report contains screenshots, a Playwright trace, frame timings, JS bytes and a 100-seed invariant run.

### G2 — Full loop

- [ ] F-02, F-05, F-06, F-08, F-09, F-13–F-22, F-25–F-32.
- [ ] A-02, A-03, A-06–A-13, A-15–A-18.
- [ ] V-07, V-09, V-11, V-14, V-15.
- [ ] U-01, U-02, U-04, U-06–U-16, U-20, U-22–U-24.
- [ ] P-03–P-10, P-12, P-13.
- [ ] S-01, S-02, S-03.
- [ ] A complete 12-player match plays from title to ending in a browser; every screen is reachable and keyboard-operable.

### G3 — Story

- [ ] N-01–N-09, N-11–N-14.
- [ ] A-14.
- [ ] F-20.
- [ ] The narrative review is signed; every ending is reachable; no dialogue is generated without human review.

### G4 — Look and sound

- [ ] V-01–V-16.
- [ ] L-01, L-04, L-05, L-07, L-08.
- [ ] Every room passes `ART_DIRECTION.md` §14; the asset manifest is complete; the licence audit passes.

### G5 — Mobile and accessibility

- [ ] X-01–X-12, X-14–X-20.
- [ ] U-04, U-15.
- [ ] P-02, P-09, P-10, P-13.
- [ ] A text-only playthrough completes on a phone; every serious a11y issue is closed; reduced motion is verified on every screen.

### G6 — Release

- [ ] All remaining F, A, N, V, U, X, P, S and L criteria.
- [ ] F-27, F-33, F-34, F-35.
- [ ] P-11, P-14–P-18.
- [ ] S-01, S-04–S-12.
- [ ] L-02, L-03, L-06, L-09–L-14.
- [ ] CI is green; the licence audit is clean; the save migration suite passes; the release playtest is signed.
- [ ] The build is a static site, deployable without a game server, and playable offline after first load.

## 13. Traceability

| Source document | Primary criteria |
|---|---|
| `00-DESIGN_CANON.md` | All; conflict checks at G0 |
| `PRODUCT_VISION.md` | F-27, P-01–P-18, N-01–N-14, X-01–X-20 |
| `GAME_DESIGN.md` | F-01–F-35, A-01–A-18 |
| `NARRATIVE_AND_CHARACTERS.md` | N-01–N-14, U-06, U-09, U-14 |
| `ART_DIRECTION.md` | V-01–V-16, U-05, U-23 |
| `ARCHITECTURE_REFERENCE.md` | V-01–V-07, L-07, L-08 |
| `CINEMATIC_STORYBOARD.md` | N-03, N-05, V-12, X-08, X-11 |
| `UI_SCREEN_SPEC.md` | U-01–U-24, X-01–X-20 |
| `AI_BEHAVIOUR_SPEC.md` | A-01–A-18, F-17, F-29, F-30 |
| `TECHNICAL_ARCHITECTURE.md` | F-28, P-01–P-18, S-01–S-12, L-14 |
| `ASSET_MANIFEST.md` | V-05, V-06, V-15, L-01–L-14 |
| `IMPLEMENTATION_PLAN.md` | Gate map, M0–M6, cut list |

## 14. Owner decisions required before the relevant gate

These are recorded as assumptions in `PRODUCT_VISION.md` §9. They do not block M0, but each
must be answered before the gate that depends on it.

| Decision | Current assumption | Blocks |
|---|---|---|
| Commercial model | Premium one-time release; no ads, gacha or live service | G6 |
| Language | English UI at launch; string table ready for Hindi | G6 |
| AI dialogue | Deterministic templates; LLM optional and off by default | G2 |
| Voice | Original actors or licensed synthetic voices; no cloning | G4/G6 |
| Scope | 12-contestant baseline; replay variants post-launch | G2 |
| Engine honesty | Grounded stylized realism; not a Suryagarh reconstruction | G4/G6 |
| Delayed role reveal | Canon: next Dawn via Judgment | G2 |
| Pact visibility | Private until used or revealed | G2 |
| Night 1 Veil | Canon: a Veil may be attempted on Night 1 | G2 |
| Six-night maximum | Up to six nights; typical 4–5; early endings are valid | G2 |

## 15. Sign-off

A gate is signed only when the report contains:

- the build hash and date;
- the browser/device matrix used;
- the seed list and simulation report;
- the evidence paths for every criterion;
- the list of open Minor items with owners and dates;
- the signatures below.

| Role | Name | Signature | Date |
|---|---|---|---|
| Owner / product | | | |
| Game direction | | | |
| Engineering lead | | | |
| Art direction | | | |
| Narrative lead | | | |
| QA lead | | | |
| Legal / licensing | | | |

**Release statement.** A build may be called a release candidate only when every Blocker and
Major item is closed, every G0–G6 gate has evidence, the licence audit is clean, and the
owner has signed the acceptance report. Until then it is a build, not a release.
