# THE LAST LANTERN — Design Set

> **Every oath has a shadow.**
>
> A premium, single-player, browser-first social-deduction mystery set in the fictional
> Rajasthani palace of **Nimbagarh**. One human player and eleven original AI contestants keep
> an ancestral flame alive for six nights while three hidden **Shadowed** try to put it out.

## Status

**Design complete. No production code written.** The repository contains only this document
set. Implementation begins only after the owner approves `IMPLEMENTATION_PLAN.md` §13 and
chooses the execution method.

- **Working title:** THE LAST LANTERN
- **Tagline:** Every oath has a shadow.
- **Genre:** social deduction · mystery · psychological strategy · explorable 3D drama
- **Mode:** single-player, offline-capable
- **Platform:** browser desktop first, responsive mobile second
- **First release:** 1 human + 11 AI contestants
- **Canon:** `00-DESIGN_CANON.md` wins on any conflict.

## Read in this order

| # | Document | What it decides |
|---|---|---|
| 0 | [`00-DESIGN_CANON.md`](00-DESIGN_CANON.md) | The fixed names, roles, loop, palette, stack and quality gates. Source of truth. |
| 1 | [`PRODUCT_VISION.md`](PRODUCT_VISION.md) | Why the game exists, who it is for, what success means, what it refuses to be. |
| 2 | [`GAME_DESIGN.md`](GAME_DESIGN.md) | Complete rules: roles, phases, missions, evidence, pacts, shields, voting, finale, endings. |
| 3 | [`NARRATIVE_AND_CHARACTERS.md`](NARRATIVE_AND_CHARACTERS.md) | Chapters, opening, eleven AI dossiers, the host, the player, branching and endings. |
| 4 | [`ART_DIRECTION.md`](ART_DIRECTION.md) | Palette, type, materials, motion, ornament, banned list, the definition of a finished room. |
| 5 | [`ARCHITECTURE_REFERENCE.md`](ARCHITECTURE_REFERENCE.md) | What is real Rajput/Suryagarh-informed architecture and what is invented for Nimbagarh. |
| 6 | [`CINEMATIC_STORYBOARD.md`](CINEMATIC_STORYBOARD.md) | Shot lists, transitions, veiling sequence, finale, subtitles and production pipeline. |
| 7 | [`UI_SCREEN_SPEC.md`](UI_SCREEN_SPEC.md) | Every screen S01–S24, layout, controls, responsive behaviour and UI acceptance. |
| 8 | [`AI_BEHAVIOUR_SPEC.md`](AI_BEHAVIOUR_SPEC.md) | Bounded knowledge, belief, memory, utility, dialogue, Shadow coordination, fairness proof. |
| 9 | [`TECHNICAL_ARCHITECTURE.md`](TECHNICAL_ARCHITECTURE.md) | Stack, modules, determinism, 3D pipeline, budgets, save, security, CI. |
| 10 | [`ASSET_MANIFEST.md`](ASSET_MANIFEST.md) | Asset strategy, licences, model lists, budgets, provenance and fallback. |
| 11 | [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) | Milestones M0–M6, tasks, tests, risks, cut list and the approval gate. |
| 12 | [`ACCEPTANCE_CRITERIA.md`](ACCEPTANCE_CRITERIA.md) | Binary release gates G0–G6, evidence requirements and Given/When/Then checks. |

## The three-minute version

1. **A place.** Walk a researched, fictional sandstone palace: Aangan, Long Gallery, Archive of
   Ashes, Guest Havelis, Cistern, Lantern Chamber, Terrace, Gate. Real architectural vocabulary;
   invented rooms and secrets.
2. **A society.** Eleven AI contestants with biographies, voices, motives, secrets, memories and
   relationships. They never read hidden roles, the player's journal or the future.
3. **A game.** Twelve seats: 3 Shadowed, 1 Lantern Keeper, 1 Warden, 7 Oathkeepers. Dawn, Day,
   Dusk, Council, Night, Judgment. The Lantern Meter is the shared clock. Veils on Nights 1, 3
   and 5; sabotage on Nights 2 and 4; the finale on Night 6. Six authored endings.
4. **A look.** Sandstone at dusk, one flame, brass instruments, editorial typography. No generic
   dashboard, no card grids, no gradients-as-decoration, no low-poly palace.
5. **A proof.** Deterministic core, seeded replay, `projectFor(contestantId)` as the single
   fairness choke point, invariant tests over 1,000 matches, and a no-omniscience report.

## Current decisions that need the owner

These are recorded as assumptions, not facts:

- premium one-time release, no ads or live service;
- English UI at launch with a Hindi-ready string table;
- templates as the baseline AI voice, LLM optional and off by default;
- original or licensed voice, never cloned;
- 12-contestant baseline, replay variants after the vertical slice;
- grounded stylized realism, never an exact Suryagarh reconstruction.

The full list and the gates they block are in `ACCEPTANCE_CRITERIA.md` §14.

## How to review this set

**15 minutes:** read this page, the canon, and `ACCEPTANCE_CRITERIA.md` §2 and §12.

**45 minutes:** add `PRODUCT_VISION.md`, `GAME_DESIGN.md` §1–§12, and the dossiers in
`NARRATIVE_AND_CHARACTERS.md`.

**Full review:** read in the order above. The implementation plan ends with the approval
question; the acceptance criteria define what "done" will mean.

## Next step

1. Approve the design set and `IMPLEMENTATION_PLAN.md`.
2. Choose **subagent-driven** (recommended for M0–M2) or **native** execution.
3. Start at M0.1: repository, tooling, tokens, core model, seeded RNG, content schemas.
4. Do not start the vertical slice until G0 is signed.

Until that approval, no code, dependency install, scaffold or asset download should begin.
