# ART DIRECTION — THE LAST LANTERN

> Depends on: `00-DESIGN_CANON.md`, `NARRATIVE_AND_CHARACTERS.md`.
> Feeds: `UI_SCREEN_SPEC.md`, `ARCHITECTURE_REFERENCE.md`, `ASSET_MANIFEST.md`,
> `CINEMATIC_STORYBOARD.md`.

## 1. Visual thesis

**Sandstone at dusk, and a flame that is running out of time.** The palace is warm, heavy and
real; the people are lit like portraits; the interface is a brass instrument, not a dashboard.
Nothing glows unless it burns. Nothing is thin. Nothing is decorative without a job.

This is a *page-like cinematic surface* for menus and story, and an *app-screen discipline*
for play surfaces such as the journal, evidence board and council. The rules differ by surface
and are stated per section.

## 2. Reference inventory

Studied before drawing anything (full provenance in `ASSET_MANIFEST.md`):

- Suryagarh Palace, Jaisalmer: sandstone massing, turrets, verandahs, haveli suites,
  courtyards, brass and mirror work, desert light.
- Rajput and Māru-Gurjara architecture: jali screens, jharokhas, chhatris, carved brackets,
  cusped arches, stepwell and taanka water logic.
- The Thar: dust haze, long shadows, ochre stone, indigo night, one horizon.
- Desert-noir cinema language: low key light, practical flames, silhouettes, held silence.
- Editorial print: large serif headlines, generous margins, one accent, real photographs.

**Rejected references:** reality-show footage, logos, contestants, soundtrack, and any
unlicensed photograph. The project does not borrow identity, only architectural principles.

## 3. Art direction in one sentence

> On every surface, **the last flame** becomes **the single source of warmth and the only
> thing allowed to move continuously**.

## 4. Palette

Three layers: primitive → semantic → component. Components reference semantic tokens only.

### 4.1 Primitive tokens

| Token | Hex | Use |
|---|---|---|
| `--sand-50` | `#F4EFE6` | ivory ink, light text |
| `--sand-100` | `#E9DFCC` | secondary ink |
| `--sand-200` | `#D9C4A0` | captions, inactive |
| `--sand-300` | `#B9AE9C` | muted ink, secondary metadata |
| `--sand-400` | `#C79A5B` | sandstone mid |
| `--sand-600` | `#A9743B` | sandstone shadow |
| `--sand-800` | `#6B4423` | carved recess |
| `--sand-950` | `#2A1C12` | sandalwood night |
| `--basalt-950` | `#0E0B09` | ground |
| `--basalt-900` | `#1A1512` | surface base |
| `--basalt-800` | `#241B14` | raised surface |
| `--basalt-700` | `#2E2117` | hover surface |
| `--gold-600` | `#B8892B` | antique gold, focus |
| `--gold-300` | `#E8C96A` | highlight |
| `--flame-500` | `#E8892B` | accent, lantern |
| `--flame-300` | `#F2B25C` | hot highlight |
| `--burgundy-800` | `#3A1219` | shadow field |
| `--burgundy-600` | `#5C1F2B` | danger, used once per screen |
| `--indigo-950` | `#101726` | oath/night field |
| `--indigo-800` | `#1C2740` | night surface |
| `--emerald-700` | `#1F6F5C` | success (never a faction tell) |

### 4.2 Semantic tokens

```css
:root {
  /* surfaces */
  --color-bg: var(--basalt-950);
  --color-surface: var(--basalt-900);
  --color-surface-raised: var(--basalt-800);
  --color-surface-hover: var(--basalt-700);

  /* text */
  --color-ink: var(--sand-50);
  --color-ink-secondary: var(--sand-100);
  --color-ink-muted: var(--sand-300);

  /* accents */
  --color-accent: var(--flame-500);
  --color-accent-hot: var(--flame-300);
  --color-focus: var(--gold-300);
  --color-danger: var(--burgundy-600);
  --color-success: var(--emerald-700);

  /* fields */
  --color-night: var(--indigo-950);
  --color-shadow-field: var(--burgundy-800);

  /* structure */
  --color-hairline: color-mix(in oklab, var(--sand-400) 22%, transparent);
  --color-carved: color-mix(in oklab, var(--sand-950) 70%, transparent);

  /* elevation: tone steps, never shadows */
  --elev-0: var(--basalt-950);
  --elev-1: var(--basalt-900);
  --elev-2: var(--basalt-800);
  --elev-3: var(--basalt-700);
}
```

### 4.3 Colour rules

- One ground, one ink, one accent per screen. The accent is the flame; it appears on the
  primary action and on the Lantern Meter and almost nowhere else.
- **Danger burgundy is used once per screen.** If two things are dangerous, one is wrong.
- Surfaces separate by a tone step, never by a line, border or shadow. Cards are banned as a
  visual device; if a bounded region is needed, use a tone field or a real architectural
  frame (jali, jharokha outline).
- Gradients are banned as decoration. A single neutral scrim under text on a photograph is
  the only exception, and it must be flat enough to read as shade, not as a colour effect.
- No colour ever signals faction. Role/camp is never encoded by red/green, blue/gold or any
  hue. See §9 accessibility.

## 5. Typography

Two families, both OFL, self-hosted and subset.

| Role | Face | Weights | Notes |
|---|---|---|---|
| Display | **Fraunces** | 300, 400, 600, 700 (optical size variable) | Titles, endings, chapter cards, host lines |
| UI / body | **Public Sans** | 400, 500, 600 | Journal, evidence board, council, HUD, settings |
| Numerals | Public Sans tabular | `font-variant-numeric: tabular-nums` | Votes, embers, timers, ledger |

### 5.1 Scale

| Step | Size (desktop) | Size (mobile) | Use |
|---|---|---|---|
| `display-1` | clamp(3.5rem, 8vw, 8rem) | clamp(2.5rem, 14vw, 4rem) | Title, ending |
| `display-2` | clamp(2.25rem, 4.5vw, 4rem) | clamp(2rem, 9vw, 3rem) | Chapter cards |
| `h1` | clamp(2rem, 3.2vw, 3rem) | clamp(1.75rem, 7vw, 2.25rem) | Screen titles |
| `h2` | clamp(1.5rem, 2vw, 2rem) | clamp(1.375rem, 5.5vw, 1.75rem) | Section titles |
| `body` | 1rem / 1.55 | 1rem / 1.55 | Journal, dialogue |
| `body-lg` | 1.25rem / 1.5 | 1.125rem / 1.5 | Statements, host lines |
| `caption` | 0.875rem / 1.4 | 0.875rem / 1.4 | Metadata, credits |

### 5.2 Type rules

- Headlines fit in **two lines or fewer** at every width. Cut words, then widen, then size.
- Display tracking −0.02 to −0.04em, leading 0.95–1.05. Body measure 55–70 characters.
- Maximum five sizes visible on a screen. Default is three.
- No monospace outside code.
- No tiny uppercase letter-spaced labels. Sentence case always; small caps are not a label
  system.
- `text-wrap: balance` on headings, `text-pretty` on statements.
- Loading states end with `…`; quotes are curly; units use `&nbsp;`.
- The host speaks in `body-lg` Fraunces; the player's own lines are Public Sans at `body`.

## 6. Space, layout and the frame

- One grid: 12 columns desktop, 6 columns mobile. Outer margins equal at every width;
  desktop gutter 24px, section rhythm 96–160px on cinematic surfaces, 24–48px on app screens.
- Asymmetry lives inside the grid; a void is closed on its far side by a picture, a figure,
  a list or a field of colour. No section huddled to one side.
- **Cinematic surfaces** (title, prologue, chapter card, ending) may be full-bleed.
- **App surfaces** (journal, evidence board, map, dossier, council, settings) use a quiet
  frame: two left edges, a fixed header, a scrollable field, a footer rail. Borders are
  allowed only where a real table or form needs them.
- No blank stretch taller than half a screen. Screens are composed, not scrolled past.
- Corners: square by default. The one radius in the system is the **rosette** (circular
  progress and the Lantern meter), because it is an architectural shape, not a UI fashion.

## 7. Ornament that earns its place

| Device | Function | Never |
|---|---|---|
| **Jali lattice** | Loading mask, chapter transition, hidden-reveal veil | Wallpaper, generic pattern |
| **Jharokha frame** | Character portrait frame, dossier window | Decorative corner flourish |
| **Rosette** | Lantern meter, vote tally ring, timer | Endless spinner |
| **Brass weight / seal** | Button press, vote token, pact seal | Skeuomorphic chrome everywhere |
| **Flame** | Lantern Meter, focus highlight, one continuous motion | Particle spam, bloom soup |
| **Hand-ground stone texture** | Surface field for menus and boards | Photo wallpaper on every panel |

Every ornament has a state and a meaning. Decoration without state is removed.

## 8. Materials and 3D visual language

- **Sandstone** is the hero material: warm, matte, slightly polished in walked areas,
  dust-dulled in recesses. Roughness 0.6–0.85, metalness 0.0–0.03, subtle normal and
  micro-detail. No plastic sheen.
- **Brass** is the accent material: roughness 0.25–0.45, metalness 0.7–0.9, patina in
  crevices. Used on the lantern, door studs, tokens, vessel rims.
- **Textiles** (rugs, cushions, drapes): high roughness, strong weave normal, deep indigo and
  burgundy, dust in the folds.
- **Water** in the Aangan and cistern: dark, still, reflective enough to double a flame but
  never mirror-perfect. The reflection is the palace's second liar.
- **Wood** (archive shelves, doors): aged, split, repaired. Roughness 0.5–0.75.
- **Mirror-work / sheesh**: small, broken, hand-set. It catches flame light in fragments; it
  is used in the Gallery of Mirrors as a puzzle material, never as glitter decoration.
- **Dust and smoke** are volumetric but restrained: one shaft of light per room, one haze
  layer, never in the UI.

## 9. Accessibility of art direction

- **No colour-only meaning.** Faction, status and vote outcome are always paired with a
  shape or text label. The Lantern Meter carries a numeric value and a labelled state.
- **Contrast:** running text ≥ 4.5:1 on its field; large display type ≥ 3:1. Ivory on basalt
  is the default pair; gold is a highlight, never a body-text colour.
- **Focus** is a 2px `--color-focus` ring with a 2px offset plus a subtle inner tone step, so
  it survives on sandstone and on dark fields.
- **Motion:** every animation has a reduced variant that keeps content and drops travel.
  Flames flicker at most ±4% scale/opacity; the flicker stops under reduced motion and the
  meter becomes a static ring with a numeric change.
- **Text size** is user-adjustable (100–175%) and the layout reflows; no text is in an image.
- **Colourblind modes:** deuteranopia, protanopia and tritanopia palettes shift hues while
  preserving luminance steps and all shape labels. Faction is never hue-coded, so the modes
  are about materials and clues, not roles.
- **Photosensitivity:** no strobe, no full-screen flash faster than 3 Hz, no high-contrast
  flicker. Cinematic transitions are slow fades or wipes.

## 10. Motion system

| Layer | System | Rules |
|---|---|---|
| Story / menu surfaces | GSAP + Lenis (single smooth-scroll engine) | Section reveals once; parallax small; scrub only for chapter transitions; `power3.out`; 0.6–1.1s |
| Play HUD | CSS transitions + GSAP for state change | 150–250ms; transform/opacity only; no layout animation |
| Characters | three.js `AnimationMixer` | Locomotion, idle fidget, one gesture per dialogue turn; blend 180–320ms |
| Flame | Shader / sprite | One continuous flicker; pauses offscreen; stops under reduced motion |
| Cinematics | Authored timeline in GSAP | Skippable; subtitles; transcript; no motion dependent on audio |
| Transitions | Jali close / flame wipe / door iris | 500–800ms, `expo.inOut`; never a scale bounce |

**Motion tokens**

```
--dur-fast: 150ms;  --ease-fast: cubic-bezier(.2,.8,.2,1);
--dur-base: 240ms;  --ease-base: cubic-bezier(.22,1,.36,1);
--dur-slow: 700ms;  --ease-slow: cubic-bezier(.65,0,.35,1);
--reveal-distance: 24px;
--stagger: 70ms;
```

## 11. Cinematic look

- **Lighting:** one key (window or flame), one soft fill (bounce off sandstone), one rim
  (cool indigo from a doorway). Practicals: lantern, oil lamps, hearth, moon through jali.
- **Exposure:** low-key but never crushed; shadows hold detail. ACES tone mapping, filmic
  contrast, gentle highlight roll-off.
- **Lenses:** 24–35mm for architecture, 50–85mm for portraits, long lens for the desert.
- **Colour grade:** warm mid-tones, indigo shadows, no teal-orange cliché, no Instagram
  filter. Grain is fine and static, never animated noise.
- **Composition:** architectural symmetry broken by one human figure. Doors and jalis act as
  frames. The horizon line is never centred unless the palace is the subject.

## 12. UI components in the visual language

| Component | Look | Rules |
|---|---|---|
| Primary button | Flat flame fill, ivory label, square corners | One per screen; focus ring; press = 1px tone step, no shadow |
| Secondary | Transparent, ivory text, carved inset edge | Never a bordered box; use a tone field |
| Vote token | Brass disc with a carved number | Selected state lifts 2px and gains a gold ring |
| Lantern meter | Rosette arc + number + state word | Never only colour; animates on change |
| Dossier tab | Jharokha-shaped tab | One active at a time; keyboard arrow navigable |
| Evidence node | Slate tile with a small glyph | Never a card grid; nodes on a board, connected by lines |
| Testimony row | Ledger line with speaker, time, claim | Tabular numerals; contradicting lines share a margin mark |
| Council floor | A single lit column; the speaker is in it | Non-speakers dim, never blur |
| Mission prompt | Objective line + role chip + timer | The Shadow objective is marked "optional," never "sabotage" |

## 13. Art pipeline summary

1. **Reference board** per room from licensed photographs and architectural drawings.
2. **Grey-box** for scale and sightlines, reviewed in-engine before any texture.
3. **Modular kit** in Blender: walls, arches, columns, jali panels, jharokhas, chhatris,
   brackets, crenellations, plinths, doorways, pergolas.
4. **Material library** from CC0 PBR scans (ambientCG, Poly Haven) plus authored trim sheets.
5. **Lighting pass** with baked lightmaps for static geometry and dynamic lights only for
   flame, characters and moving props.
6. **Character pass** with an original base mesh, authored clothing, LODs and facial visemes.
7. **Look-dev** in-engine at 1440 and 390; screenshot review against this document.
8. **Optimisation** to the budgets in `TECHNICAL_ARCHITECTURE.md`; licence audit before merge.

## 14. What "done" looks like for one room

A room is done when a screenshot at 1440p shows: correct sandstone and brass materials, one
readable key light with a visible source, jali shadow detail, at least three architectural
elements that could only belong to this palace, a human scale reference, no primitive mesh
silhouettes, and no UI element that would look at home in a generic dashboard.

## 15. Banned list (enforced in review and lint)

- gradients as backgrounds or button fills
- glass / backdrop blur panels
- thin hairline rules and 1px outlined boxes
- icon-topped feature cards and rows of identical cards
- index numbering (`01`, `02`) and tiny tracked uppercase labels
- monospace outside code blocks
- emoji used as icons
- shadows on things at rest; glows
- purple/indigo gradient "AI" palettes; yellow-cream + terracotta cliché
- more than two typefaces
- low-poly rooms, untextured boxes, placeholder grey bars
- unlicensed images, show footage, logos, celebrity likeness, copyrighted music
