# THE LAST LANTERN — Design Canon

> Status: **working source of truth**. Every other document in `docs/` must agree with this file.
> If a document disagrees, this canon wins until the canon is explicitly revised.
> Last revised: 2026-10-19.

## 1. One-line product

A single-player, browser-first social-deduction mystery set in a fictional Rajasthani
palace, where one human and eleven original AI contestants must keep an ancestral flame
burning while hidden traitors try to snuff it out.

- **Working title:** THE LAST LANTERN
- **Tagline:** Every oath has a shadow.
- **Genre:** social deduction · mystery · psychological strategy · explorable 3D drama
- **Mode:** single-player, offline-capable
- **First release:** 1 human + 11 AI contestants
- **Session length:** 25–40 minutes typical; a full six-night match may run to about 60.
- **Platform:** browser desktop first, responsive mobile second
- **Default commercial model (assumption):** premium one-time release, no ads, no gacha,
  no live-service dependence. Marked as an assumption for the owner to confirm.

## 2. Non-negotiable experience pillars

1. **Genuinely explorable palace.** A grounded, high-fidelity-feeling 3D environment with
   collision, occlusion, room transitions and diegetic evidence, not a menu of cards.
2. **Believable opponents.** Eleven AI contestants with bounded knowledge, memory,
   relationships, motives and deception policies. No AI may know a hidden role it has not
   earned the right to know.
3. **Consequences that echo.** Player choices (trust, evidence, accusations, wards, votes)
   change relationships, mission outcomes, available testimony and the ending.
4. **Cinematic restraint.** Editorial typography, slow deliberate motion, one continuous
   flame as the only constant animation, and transitions that carry meaning.
5. **A complete application.** Title, creation, HUD, journal, evidence board, map,
   dossiers, missions, night actions, council, finale, archive, settings, accessibility.

## 3. Canon names and fixed facts

| Fact | Value |
|---|---|
| Fictional palace | **Nimbagarh** (निम्बागढ़), in the Thar near Jaisalmer |
| Real architectural reference | **Suryagarh Palace, Jaisalmer** (inspiration only; not an exact reconstruction) |
| Palace geography basis | Rajput / Māru-Gurjara sandstone architecture: courtyards, colonnaded verandahs, jali screens, jharokhas, chhatris, turrets, stepwell / taanka water systems |
| Ritual | **The Festival of the Last Lantern** — the ancestral flame must burn for six nights |
| Game resource | **The Lantern Meter** (100 at start, can reach 0) |
| Hidden faction | **The Shadowed** (traitors) |
| Loyal faction | **The Oathkeepers** (faithful majority) |
| Host / narrator | **Dewan Rudra Pratap**, the palace steward and Sutradhar |
| Player role | One of the twelve contestants; the player may be assigned any role |
| Public role reveal | **Delayed**: the role of an eliminated contestant is revealed at the next Dawn by the *Judgment of the Flame* |
| Ending count | 6 authored endings |
| Human cast policy | All characters original; no celebrity likeness, no show IP, no real-person faces |

## 4. Role canon (baseline 12-player game)

Roles are assigned by the engine **independently of personality, appearance and dossier**.
The same character can be an Oathkeeper in one game and a Shadowed in the next.

| Count | Role | Faction | Night action | Private knowledge |
|---|---|---|---|---|
| 3 | **The Shadowed** | Traitor | On Veil nights (1, 3, 5), collectively choose one living contestant to **Veil**; may also stage one **Sabotage**. On Vigil nights (2, 4), Sabotage only | Know all Shadowed; know their own sabotage; know the Veil calendar |
| 1 | **Lantern Keeper** | Oathkeeper | **Read the Flame** on one living contestant: learns *Shadowed* or *Oathkeeper* | Own reads |
| 1 | **Warden** | Oathkeeper | **Ward** one living contestant (not self, not the same person on consecutive nights) | Own wards |
| 7 | **Oathkeeper** | Oathkeeper | None | None beyond public events |

Optional replay variants ship after the vertical slice: *Two Shadows*, *The Smoke*
(a Shadow with a once-per-game investigation-block), *The Chronicler* (neutral archivist),
*Nine Nights*.

## 5. Phase canon (one round = one night)

```
DAWN BRIEFING → DAY (missions, exploration, society) → DUSK (pacts, evidence) →
COUNCIL (discussion + vote) → NIGHT (Veil on 1/3/5 or Sabotage; Keeper read; Warden ward) →
REVEAL (Judgment of the Flame + testament) → next DAWN
```

- **The Veil Rite:** the Shadowed may attempt a Veil only on Nights 1, 3 and 5. On Nights 2
  and 4 they may only stage a Sabotage. Night 6 is the finale and has no Veil. This keeps the
  six-night calendar, the 12-seat cast and the finale trigger coherent: five councils and
  three Veil rites remove eight contestants, leaving four for the last night.

- Lantern Meter: −10 each night baseline; missions add +5…+20; sabotage subtracts 10…25.
- At 0 the game ends immediately: **The Long Dark**.
- At a Dawn after Dawn 1, if the Lantern is at 100+, the Oathkeepers gain the **Radiant Lantern**
  boon once per match (one public truth revealed). The starting value of 100 does not grant it.
- Council ties resolve by a 30-second **Lantern's Riddle** re-vote among the tied players;
  a second tie means no elimination and the Lantern loses 15.

## 6. Cast canon (11 AI + player)

Names, role-independent bios, voices and secret motives live in
`NARRATIVE_AND_CHARACTERS.md`. The fixed roster:

1. Meera Rathore — archivist, Jodhpur
2. Arjun Bhati — caravan trader, Jaisalmer
3. Bela Sengupta — forensic photographer, Kolkata
4. Kabir Mirza — chef, Lucknow
5. Zoya Sheikh — architect, Delhi
6. Devendra "Dev" Chauhan — ex-army officer, Dehradun
7. Naina Vyas — folk singer, Barmer
8. Rohan Mehta — finance broker, Mumbai
9. Ila Parekh — toxicologist-botanist, Ahmedabad
10. Samar Barde — wildlife documentarian, Goa
11. Tara Khan — journalist, Bhopal
12. **The player** — chosen name, oath and pronouns

Personality is independent of role. No dossier says or implies a faction.

## 7. Art-direction canon

- **Palette roles** (one ground, one ink, one accent, plus fields):
  - ground `#0E0B09` (basalt shadow) / `#1A1512` (sandalwood night)
  - surface `#241B14` / `#2E2117`
  - ink `#F4EFE6` ivory; muted ink `#B9AE9C`
  - accent **lantern flame** `#E8892B`, hot highlight `#F2B25C`
  - oath field `#101726` indigo; shadow field `#3A1219` burgundy
  - sandstone `#C79A5B` / `#A9743B`; antique gold `#B8892B`
- **Type:** display **Fraunces** (OFL); UI/body **Public Sans** (OFL). Two families maximum.
  Tabular numerals for votes, timers and ledgers. No monospace outside code.
- **Motion:** GSAP priority, one smooth-scroll engine only (Lenis) for menu/story surfaces;
  Three.js `AnimationMixer` for characters; transform/opacity only; every motion honoured
  under `prefers-reduced-motion`; no bounce, no elastic, no gaming neon.
- **Banned:** generic AI dashboard cards, gradients as decoration, glassmorphism, thin
  hairline rules, index numbering, emoji icons, low-poly environments, placeholder grey bars,
  unlicensed photos, show footage/logos, celebrity likeness, copyrighted music.
- **Ornament with purpose only:** jali lattice as a mask/loading device, jharokha as a frame,
  rosette as a progress ring, brass weight as a button state. No orphan decoration.

## 8. Setting honesty canon

- Nimbagarh is **fictional**. Its layout, hidden passages, Lantern Chamber and mirrored
  gallery are invented for the game.
- **Grounded** (real Rajput / Suryagarh-informed): sandstone construction, verandahs,
  turrets, haveli-style suites, courtyards, jali screens, jharokhas, chhatris, chaukhat
  doorways, brass and mirror-work, stepwell / taanka water logic, desert light.
- **Fictional** (invented rooms and mechanics): the Archive of Ashes, the Gallery of Mirrors,
  the Lantern Chamber, the Cistern Locks, the hidden servant passages, the Evidence Board.
- The build must never claim to be an exact reconstruction of Suryagarh Palace. Provenance
  lines in `ASSET_MANIFEST.md` record every real reference and every licence.

## 9. Technology canon

| Layer | Choice | Why |
|---|---|---|
| Build | **Vite 6 + React 19 + TypeScript 5 strict** | fast dev, static output, no server requirement |
| 3D | **three.js + @react-three/fiber + @react-three/drei** | mature browser 3D, declarative scene graph |
| Physics | **@react-three/rapier** (WASM) | player collision, room triggers, movable props |
| Phase machine | **XState v5** | explicit, testable day/night/council/night phases |
| UI state | **Zustand** + selectors | minimal, no provider churn; separate from game core |
| Game core | **pure TypeScript, immutable state, seeded RNG** | deterministic, replayable, testable without a browser |
| Content | typed TS modules validated by **Zod** | one schema for characters, clues, dialogue, missions |
| AI | deterministic **belief + utility + utterance-planner**; optional **LLM verbalizer behind an adapter** | offline, fair, bounded; LLM never decides facts |
| Motion | **GSAP (+ ScrollTrigger)** for story/menus; **Lenis** as the only smooth-scroll engine | cinematic restraint, one system per property |
| Audio | **Web Audio API + three.js PositionalAudio** for world; Howler-style bus for UI/music | diegetic 3D sound, music ducking |
| Persistence | **IndexedDB** via `idb-keyval`, versioned migrations, export/import JSON | local-first saves, no account |
| Tests | **Vitest + fast-check** (unit/property), **Playwright** (e2e, visual, a11y) | red-green gate for logic and rendered truth |
| Styling | **CSS custom properties (three-layer tokens) + Tailwind v4 utilities**; bespoke components | tokens are the contract; no generic component skin |
| CI | GitHub Actions: typecheck, lint, unit, build, e2e, asset + license validation, size budget | every merge is verified |

Machine note: this checkout has Node v24.10.0, npm 11.6.1, pnpm 9.15.9, Python 3.14.0,
ffmpeg, cwebp and sips available. The repository is currently empty, so the framework is a
decision recorded here, not an existing convention.

## 10. Quality gates (definition of done for the vertical slice)

1. A new game can be started, played through one full day, one council vote, one night and one
   Judgment, and ended in a reachable ending stub — without reloading.
2. At least one room of the palace is walkable with collision, one mission is playable, and
   two AI contestants can hold a grounded conversation with evidence-aware dialogue.
3. The game core is deterministic under a seed and covered by unit and property tests.
4. No AI has privileged knowledge outside its role; this is proven by an invariant test.
5. Desktop target 60 fps at 1440p on integrated graphics; mobile fallback renders a static
   first frame and a playable 30 fps tier.
6. Keyboard-only, reduced-motion and colorblind-safe paths exist for every screen shipped.
7. Every asset in the slice appears in `ASSET_MANIFEST.md` with a licence and a credit line.

## 11. Biggest risks before code

1. **3D realism versus cost.** A palace of primitives will fail the brief. Mitigation:
   modular kit, licensed CC0 PBR scans, baked lightmaps, an honest "grounded stylized
   realism" target, and a vertical slice that proves one room before eleven are built.
2. **AI believability without omniscience.** Mitigation: deterministic belief model,
   memory with decay, utterance plans that cite only known facts, and invariant tests.
3. **Browser and mobile performance.** Mitigation: hard budgets, quality tiers, occlusion,
   instancing, KTX2/Draco, and a no-WebGL poster fallback.
4. **Scope.** Mitigation: the vertical slice is the shipped gate; the full cast and chapters
   are milestones, not prerequisites.
5. **Legal provenance.** Mitigation: no show assets, no celebrity likeness, a manifest for
   every real photograph, model, texture, font and sound.

## 12. Reading order

`README` → `PRODUCT_VISION` → `GAME_DESIGN` → `NARRATIVE_AND_CHARACTERS` → `ART_DIRECTION` →
`ARCHITECTURE_REFERENCE` → `CINEMATIC_STORYBOARD` → `UI_SCREEN_SPEC` →
`AI_BEHAVIOUR_SPEC` → `TECHNICAL_ARCHITECTURE` → `ASSET_MANIFEST` →
`IMPLEMENTATION_PLAN` → `ACCEPTANCE_CRITERIA`.

## 13. Revision notes

**Revision 2 — consistency pass, 2026-10-19.** No change to the product pillars, cast, palette
or stack. The following rule ambiguities were resolved so the documents, the simulation and the
acceptance gates agree:

1. **Veil Rite calendar.** The Shadowed may attempt a Veil only on Nights 1, 3 and 5; Nights 2
   and 4 are sabotage-only; Night 6 is the finale. Five councils plus three Veil rites remove
   eight contestants and leave four for the last night, which makes the six-night spine, the
   12-seat cast and the finale trigger arithmetically coherent.
2. **Delayed Judgment scope.** Every contestant eliminated since the previous Dawn — council
   and Veil alike — is revealed at the next Judgment. No role is public before then.
3. **Vote count and shields.** The highest remaining tally is eliminated; a shield cancels one
   vote against its holder; a zero tally means no elimination and −10 Lantern; a second tie
   means no elimination and −15.
4. **Lantern states and boon.** The meter maps 0–120 to Dark, Ember, Failing, Guttering, Burning
   and Radiant. The starting 100 does not grant the Radiant boon; it is offered once per match
   from Dawn 2 onward and reveals a public truth, never a hidden role.
5. **Pacing.** Typical matches resolve in 4–5 nights and 25–40 minutes; a full six-night match
   may run to about 60. The finale begins at four or fewer survivors, or at Dawn 6 at the latest.
6. **Minor alignments.** Muted ink token added at `#B9AE9C`; character geometry budget corrected
   to ≤1.3 M triangles across all LODs; opening shot durations sum to the stated 3:20; the
   eleven AI portraits plus the player's niche replace the "twelve portraits" inconsistency.
