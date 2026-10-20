# PRODUCT VISION — THE LAST LANTERN

> Depends on: `00-DESIGN_CANON.md` (wins on any conflict).
> Feeds: `GAME_DESIGN.md`, `ARCHITECTURE_REFERENCE.md`, `ART_DIRECTION.md`, `IMPLEMENTATION_PLAN.md`.

## 1. Intent

THE LAST LANTERN is a premium browser game that makes a social-deduction argument feel
like standing in a real Rajasthani palace at dusk. The player arrives at **Nimbagarh**, a
fictional sandstone palace in the Thar, for the Festival of the Last Lantern. Twelve
contestants have sworn an oath to keep the ancestral flame burning for six nights. Three of
them are **Shadowed**; they want the flame to die. One human player sits among eleven original
AI contestants.

The experience must be three things at once:

1. **A place** the player can walk through, touch and read — a courtyard, a gallery, an
   archive and a council chamber with collision, occlusion, sound and light.
2. **A society** of believable people who remember what was said, who they trust, what they
   fear and what they privately want.
3. **A game** with legible rules, real consequences, a day/night rhythm and six authored
   endings.

## 2. Why this exists

Social-deduction games are usually abstract: a grid of name cards and a chat box. Palace
reality shows are usually passive: the audience watches, the player does not. THE LAST
LANTERN closes both gaps. It gives the deduction loop a physical palace to investigate and
gives the palace a rule system where every room, object and testimony can become evidence.

The player should feel the specific pressure the brief asks for: *every oath has a shadow* —
the suspicion that the person who swore loudest is the one who lit the match.

## 3. Audience

- **Primary:** players 16+ who enjoy social deduction (traitor/mafia-likes), narrative
  mystery, and premium single-player browser experiences.
- **Secondary:** architecture, travel and Indian-culture enthusiasts drawn to a respectful,
  researched Rajasthani setting.
- **Tertiary:** accessibility-first players who want the deduction without twitch reflex or
  audio-only clues.

They play on a laptop, often with headphones, in 25–40 minute sessions (a full six-night
match may run to about 60). The game must be comfortable in a browser tab, resumable, and
honest about what it can render.

## 4. Experience pillars

### P1 — A palace that feels built, not assembled
The player should be able to stand in the Aangan, hear the fountain, see jali light on
sandstone, and cross into the Long Gallery without a loading card. Primitive boxes are an
automatic failure. The vertical slice must prove one room at a level a designer would defend.

### P2 — Opponents who cannot cheat
Each AI contestant has bounded knowledge: only what they witnessed, were told, or earned
through a role. Faithful AI never magically know hidden roles. Shadow AI may lie, but only
from facts they actually possess. This fairness is the product's integrity.

### P3 — Choices with delayed consequences
A promise made on Night 1 is remembered on Night 5. Evidence shared with one contestant may
be traded to another. The finale must be able to show the player the chain of decisions that
produced it.

### P4 — Cinematic restraint
Large type, slow reveals, one flame, real silence. Motion is meaning, not decoration.
Transitions are architectural: a jali closes, a flame sweeps, a door opens.

### P5 — A complete application
Title, creation, HUD, journal, evidence board, map, dossier, mission, night action, council,
finale, archive, settings, accessibility. No dead ends, no placeholder screens.

## 5. Goals

- Ship a **playable vertical slice** that includes one full night cycle, one mission, one
  council vote, two grounded AI conversations, one room of the palace and one ending stub.
- Ship a **complete baseline game** of 12 contestants, 6 nights, 3 mission families, the
  evidence board, the journal, 6 endings and the archive.
- Reach a **grounded stylized realism** that a reviewer does not read as low-poly.
- Keep the core game **offline and deterministic**; any language-model use is optional,
  behind an adapter, and never decides facts.
- Make every shipped screen **keyboard operable, reduced-motion safe and colorblind-legible**.

## 6. Non-goals

- Multiplayer, matchmaking or online accounts.
- An open world or a procedurally generated palace.
- An exact reconstruction of Suryagarh Palace or any real property.
- Graphic violence, gore, sexual content or torture.
- Live-service monetisation, ads, loot boxes or energy timers.
- Voice cloning or impersonation of real people.
- Photoreal human faces that resemble real public figures.

## 7. Anti-goals

These make the product a failure even if it technically runs:

- Low-poly or untextured rooms described as a palace.
- Generic AI UI: icon-card rows, gradient blobs, glass panels, thin rules, index numbers.
- AI opponents who read each other's minds or the player's journal.
- A deduction loop that is actually a coin flip because clues do not connect.
- Cinematics that cannot be skipped, subtitles that cannot be resized, or clues that are
  audio-only.
- Any unlicensed photograph, show clip, logo, soundtrack or celebrity likeness.

## 8. Positioning and comparables

| Comparable | What we take | What we refuse |
|---|---|---|
| Classic traitor/mafia games | hidden roles, night actions, table debate | abstract card-grid presentation |
| Social-deduction video games | trust and betrayal as a loop | omniscient AI and unmotivated lie machines |
| Palace reality-competition shows | arrival ritual, house politics, confessionals | show footage, logos, contestants, soundtrack |
| Narrative mystery adventures | explorable clues and dialogue | clue-hunting without social consequence |
| Premium architecture experiences | material honesty and light | a walking simulator with no game |

**Positioning sentence:** *the first social-deduction game that lets you walk the palace,
read the people and watch your own promises come back to testify.*

## 9. Assumptions to confirm with the owner

These are recorded as **our calls**, not as decisions the owner already made:

1. **Commercial model** — premium one-time browser release; no ads, no gacha. If the owner
   wants a free demo + paid full game, the vertical slice is the demo.
2. **Language** — English UI at launch, with a string table ready for Hindi localisation.
   Cultural terms (Aangan, jali, jharokha, chhatri) stay untranslated with a glossary.
3. **AI dialogue** — the baseline is template-based with a deterministic planner. An LLM
   verbalizer is an optional enhancement behind an adapter, never a dependency.
4. **Voice** — original voice actors or synthetic voices with a documented licence; no real
   person's voice is cloned.
5. **Scope of first public release** — the 12-contestant baseline, not the replay variants.
6. **Engine honesty** — "grounded stylized realism" is the target; we will not claim an exact
   Suryagarh reconstruction.

## 10. Success measures

**Player-facing (evaluated in playtests):**

- A first-time player can explain the rules and their own goal within 5 minutes.
- After one night, a player can name at least two suspects and one piece of evidence.
- At least 70 % of playtesters say an AI conversation felt "like it was listening."
- At least 60 % of playtesters finish a full session and can describe the ending they got.
- No playtester describes the palace as "low-poly" or "a box."

**Engineering:**

- Deterministic replay: the same seed and the same player inputs reproduce the same game.
- Zero invariant violations in the AI knowledge audit across 1,000 simulated matches.
- 60 fps desktop / 30 fps mobile within the budgets in `TECHNICAL_ARCHITECTURE.md`.
- All shipped screens pass the accessibility checklist in `ACCEPTANCE_CRITERIA.md`.

## 11. Product shape at a glance

```mermaid
flowchart LR
  A[Title & Archive] --> B[Contestant Creation]
  B --> C[Prologue Cinematic]
  C --> D{Day loop}
  D --> E[Dawn Briefing]
  E --> F[Missions & Exploration]
  F --> G[Social & Evidence]
  G --> H[Council & Vote]
  H --> I[Night Actions]
  I --> J[Judgment of the Flame]
  J -->|contestants remain| D
  J -->|endgame| K[The Last Lantern Finale]
  K --> L[Ending & Archive]
  L --> A
```

## 12. Dependencies and next step

- `GAME_DESIGN.md` must turn pillars P2–P3 into testable rules.
- `ARCHITECTURE_REFERENCE.md` must name what is real and what is invented before modelling.
- `ART_DIRECTION.md` must fix tokens before any screen is built.
- `IMPLEMENTATION_PLAN.md` sequences the vertical slice so the pillars are proven before the
  full cast and chapters are produced.
- The next step after this document set is **implementation of the vertical slice**, gated by
  the acceptance criteria and the brainstorming/plan approval recorded in the repo.
