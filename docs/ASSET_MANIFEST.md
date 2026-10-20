# ASSET MANIFEST — THE LAST LANTERN

> Depends on: `ARCHITECTURE_REFERENCE.md`, `ART_DIRECTION.md`, `TECHNICAL_ARCHITECTURE.md`.
> Feeds: `IMPLEMENTATION_PLAN.md`, `ACCEPTANCE_CRITERIA.md`.

## 1. Purpose

A single ledger for every non-authored asset in the game: what it is, where it came from,
its licence, its credit line, its size budget and its fallback. **No asset ships without a
row here.** `scripts/license-audit.mjs` fails CI if any asset in `public/` or `src/` lacks a
matching, valid entry.

## 2. Asset strategy at a glance

| Category | Strategy | Why |
|---|---|---|
| Palace architecture | **custom modular kit** built in Blender from researched references | real geometry, consistent style, budget control |
| PBR materials | **CC0 scanned textures** (ambientCG, Poly Haven) + authored trim sheets | realism without scanning budget |
| Hero props (Lantern, council table, jali) | **custom high-detail models** with normal-mapped carving | the few pieces the camera loves |
| Characters | **original base mesh + authored clothing + LODs**; no celebrity likeness | legal safety and consistent quality |
| Animations | **authored + licensed mocap** with documented redistribution rights | believable locomotion and gesture |
| Audio | **original score and sound design**; licensed instrument samples | no show soundtrack, no copyrighted music |
| Voice | **contracted or synthetic voice** with a documented licence | no cloning of real people |
| Fonts | **Fraunces** and **Public Sans**, both OFL, self-hosted and subset | licensed for commercial web use |
| UI icons | **authored SVG** or an OFL/ISC icon set | consistent, no emoji |
| Reference photographs | **public-domain / CC** images used for study, and only shown in-game if licence permits, with credit | provenance |
| Promotional imagery | **real in-engine renders** | honest; no painted claim |

## 3. Licensing rules

**Allowed licences (with attribution where required):**

- CC0 / public domain — preferred for textures and reference.
- CC-BY 4.0 / 3.0 — allowed with a visible credit line and a link.
- CC-BY-SA — avoided for in-game art (share-alike complexity); allowed for documentation only.
- OFL / Apache-2.0 / MIT — for fonts, code and icon sets.
- Commercial licences — allowed when the licence explicitly permits use in a commercial
  interactive product and redistribution inside an app bundle. The licence document is stored
  in `docs/licenses/` and referenced by filename in this manifest.

**Forbidden:**

- Reality-show footage, stills, logos, set designs, music, or contestant likeness.
- Any celebrity or public figure's face, voice or name.
- Photographs with "editorial use only", "non-commercial", or "no derivatives" terms.
- Scraped images with unknown provenance.
- Music or sound effects with unclear terms.
- AI-generated images that impersonate real people or real branded places.

**Attribution format in-game:** a Credits screen with sections (Photographic references,
Textures, Fonts, Sound, Tools) and the line `Used under <licence>. <author>. <source>.` The
credits screen is reachable from Settings and from the ending.

## 4. Budget summary

| Category | Count (baseline) | Per-asset budget | Total budget |
|---|---|---|---|
| Architecture modules | 60–90 | 500–8 000 tris, 1 atlas each | ≤ 250 K tris total |
| Hero props | 12–20 | 3 000–25 000 tris | ≤ 120 K tris |
| Room props / set dressing | 200–400 | 100–2 000 tris, instanced | ≤ 150 K tris |
| Characters | 12 unique | 60–90 K tris LOD0, 15–25 K LOD1, 5–8 K LOD2 | ≤ 1.3 M tris across all LODs; only one LOD is visible per character |
| Character textures | 12 × 4 maps | 2 K albedo/normal/rough/AO | ≤ 96 MB uncompressed, ≤ 12 MB KTX2 |
| Architecture textures | 12 trim sheets + 8 tiling | 2 K / 1 K / 512 tiers | ≤ 40 MB KTX2 |
| Environment | 1 sky, 1 HDRI, 1 LUT, 6 decals | 2 K HDRI | ≤ 8 MB |
| Audio | ~40 music beds, ~300 SFX, ~1 500 voice lines | 48 kHz mono/stereo, Vorbis/Opus | ≤ 60 MB streamed |
| Fonts | 2 families, 6 subsets | woff2 | ≤ 240 KB |
| Total download (first playable) | — | — | ≤ 3 MB before palace streaming |

> Geometry totals are on-disk asset budgets. The in-frame triangle and draw-call limits are
> enforced separately by `TECHNICAL_ARCHITECTURE.md` §7; only one LOD per character and the
> streamed rooms in view count toward them.

## 5. Architecture kit — model list

Each entry becomes a Blender asset with a naming convention
`kit_<category>_<variant>_<lod>.glb`.

| Asset | Variants | Tris LOD0 | Material | Notes |
|---|---|---|---|---|
| Wall module (3 m × 4 m) | plain, ruined, with niche | 400 | sandstone | trim-friendly UVs |
| Cusped arch | 3 profiles | 900 | sandstone | hero silhouette |
| Carved column | 4 orders | 1 800 | sandstone | bracket capital |
| Bracket / toda | 3 sizes | 300 | sandstone | instanced |
| Chhajja eaves | 2 depths | 900 | sandstone | cast shadow line |
| Jali screen | 5 patterns | 2 500 | sandstone | alpha-tested or geometry |
| Jharokha | 3 sizes | 3 200 | sandstone | hero piece |
| Chhatri | 2 sizes | 4 500 | sandstone | roof landmark |
| Stone parapet | 2 patterns | 1 200 | sandstone | instanced |
| Door (double / single) | 4 finishes | 2 000 | wood + brass | opens in-game |
| Plinth / step | 4 steps | 200 | sandstone | ramp collision |
| Water channel | 3 segments | 600 | sandstone + water | flow state |
| Fountain | 1 | 3 500 | brass + stone | water particles |
| Lantern (the Last Lantern) | 1 hero | 12 000 | brass + glass + flame | the hero prop |
| Council table | 1 hero | 9 000 | brass + wood | round brass top |
| Archive shelf | 3 lengths | 1 500 | wood | instanced |
| Desk / writing table | 2 | 1 200 | wood | props |
| Bed + textile | 3 | 1 800 | wood + textile | haveli |
| Cooking hearth | 1 | 2 400 | brick + copper | kitchen |
| Cistern valve wheel | 2 | 900 | brass + iron | puzzle |
| Mirror assembly | 3 | 1 100 | brass + glass | gallery puzzle |
| Portrait niche + frame | 2 | 1 400 | sandstone + brass | cast wall |
| Oil lamp (practical) | 3 | 500 | brass | dynamic light |
| Rope, hookah, vessels, chests, rugs | 40–60 | 100–1 500 | mixed | set dressing |

## 6. Character asset list

Each of the 12 characters (11 AI + player) needs:

- **LOD0** 60–90 K tris, **LOD1** 15–25 K, **LOD2** 5–8 K, plus a billboard impostor for
  distant use.
- **Skeleton:** ≤ 72 bones, humanoid, mixamo-compatible naming for retargeting.
- **Facial:** viseme set for 15 phonemes + blink/brow/jaw/eye; lip-sync from an authored
  audio track or a simple viseme timeline.
- **Texture set:** albedo, normal, roughness, AO; 2 K for LOD0, 1 K for LOD1, 512 for LOD2.
- **Animation set:** idle × 3, walk, run, talk × 4, listen × 2, sit, stand, react × 4,
  gesture × 6, examine, vote, enter/exit. Reuse across the cast via retargeting, with per-
  character idle and gesture variants.
- **Clothing:** authored per character; must read at 3–4 m and 1 m; cloth sim baked, not
  real-time.
- **Diversity requirements:** varied ages, body types, skin tones, hair, and clothing
  regionalities; no costume is a caricature; all faces original.

## 7. Reference and texture source ledger

This table records **sources and licences**. Rows marked *reference only* are studied and not
shipped. Rows marked *in-game* must be re-verified before ship.

| ID | Asset | Source | Licence | Use | Credit |
|---|---|---|---|---|---|
| REF-001 | Suryagarh Palace official site (archived 2025) | suryagarh.com via Wayback Machine | reference only (no reuse) | massing, verandah, turret, haveli study | n/a |
| REF-002 | Jaisalmer Fort photographs | Wikimedia Commons | CC-BY / CC-BY-SA per file | architectural study; CC-BY only if shipped | file author + link |
| REF-003 | Patwon ki Haveli / Nathmal ki Haveli photographs | Wikimedia Commons | CC-BY / CC-BY-SA per file | facade, jharokha, jali study | file author + link |
| REF-004 | Rajput architecture / Architecture of Rajasthan texts | Wikipedia, public-domain scholarship | reference only | vocabulary and proportion | n/a |
| REF-005 | Māru-Gurjara temple detail photographs | Wikimedia Commons | CC-BY / CC-BY-SA per file | ceiling rosette and column study | file author + link |
| REF-006 | Sandstone PBR set | ambientCG | CC0 | in-game materials | ambientCG |
| REF-007 | Sandstone / plaster / wood PBR sets | Poly Haven | CC0 | in-game materials | Poly Haven |
| REF-008 | Thar sky / HDRI | Poly Haven | CC0 | environment lighting | Poly Haven |
| REF-009 | Brass PBR | ambientCG | CC0 | in-game materials | ambientCG |
| REF-010 | Textile / carpet PBR | ambientCG | CC0 | in-game materials | ambientCG |
| REF-011 | Fraunces font | Google Fonts / undefeated | OFL 1.1 | display type | Phaedra Charles, Flavia Zimbardi |
| REF-012 | Public Sans font | Google Fonts / USWDS | OFL 1.1 | UI/body type | USWDS |
| REF-013 | Icon set (if used) | e.g. Lucide | ISC | UI symbols | Lucide contributors |
| REF-014 | Mocap clip library | licence TBD (Mixamo or purchased) | commercial use in an app if permitted | locomotion | per licence |

> **Action before produce:** every *in-game* row must be replaced with a concrete file, URL,
> author, licence text and a downloaded copy in `public/` or `docs/licenses/`. The archive of
> the Suryagarh site is a study reference only and is not redistributed.

## 8. Audio asset plan

| Kind | Plan | Notes |
|---|---|---|
| Score | Original compositions, recorded or produced with licensed instruments | 6 chapter beds + title + finale + 6 ending stings |
| Ambience | Recorded or designed per room: courtyard, gallery, archive, cistern, kitchen, terrace | loop with variation; one 3D emitter layer per room |
| Foley | Sandstone footsteps, cloth, brass, water, fire, doors, latches | dry, close, no reverb baked except cistern |
| Voice | Original cast or synthetic; documented licence and consent | 1 500 lines baseline, plus host lines |
| UI | Brass tick, cloth, seal, flame | short, quiet, never a sting on hover |

**Rule:** no track may imitate a recognisable film or show theme. Original brief: *desert
noir, one flame, one breath, one horizon.*

## 9. Font and icon details

- Self-host `Fraunces` and `Public Sans` as woff2 subsets (Latin + Latin-Extended + Devanagari
  for the title and glossary if needed). Preload the display subset only.
- `font-display: swap`; fallback stack `Georgia, 'Times New Roman', serif` for display and
  `system-ui, -apple-system, 'Segoe UI', sans-serif` for UI.
- Icons are authored SVG, 24 px grid, stroke 1.75, `currentColor`; decorative icons carry
  `aria-hidden="true"`; icon-only buttons carry `aria-label`.

## 10. Asset naming and folder conventions

```
public/models/kit/kit_arch_arch_cusped_lod0.glb
public/models/props/prop_lantern_last_lod0.glb
public/models/chars/char_meera_lod0.glb
public/textures/mat_sandstone_floor_2k_albedo.ktx2
public/audio/music/mus_ch01_summons.ogg
public/audio/voice/vo_meera_ch01_012.ogg
public/fonts/fraunces-display-latin.woff2
```

- Lowercase, underscores, no spaces, category prefix.
- LOD suffix `_lod0/_lod1/_lod2`; texture suffix `_albedo/_normal/_rough/_ao/_metallic`.
- Audio suffix `_music/_amb/_sfx/_vo`.
- Every folder has an `index.json` listing files with size, hash and manifest ID.

## 11. Validation and CI

`scripts/validate-assets.mjs` checks:

- every file has a manifest entry and a valid licence;
- naming convention and folder placement;
- triangle counts within the per-category budget;
- texture dimensions are powers of two and within tier limits;
- all GLBs load, have LODs, and contain no embedded external references;
- audio files are within bitrate and length budgets;
- no asset references a forbidden source.

`scripts/license-audit.mjs` fails the build when a licence is missing, expired, or unknown.

## 12. Fallback strategy

| Missing/fails | Fallback |
|---|---|
| GLB fails to load | low-detail placeholder silhouette in the correct material tone; log the failure |
| Texture fails | flat material colour from the palette; never magenta |
| Audio fails | captions and visual cues; game continues silently |
| Font fails | system serif/sans fallback; layout must still hold at two lines |
| HDRI fails | flat tone-step lighting; baked light still carries form |
| WebGL fails | static poster + text-only accessible play mode |
| LLM fails | template verbalizer silently |

## 13. Assets that must **not** be generated by a generative image or voice model

- Character portraits or faces (must be real authored 3D renders).
- Any photoreal human used as a testimonial or "real" person (none exist).
- Logos or brand marks (none licensed; no fake logo wall).
- Diagrams or charts in the UI (authored, not illustrative slop).
- Palace floor plans presented as real (they are fictional and labelled as such).

## 14. Provenance checklist before ship

- [ ] Every in-game asset has a row with a concrete licence and credit.
- [ ] `docs/licenses/` holds the licence text for every non-CC0 asset.
- [ ] The Credits screen lists every required attribution with a link.
- [ ] No reference-only image appears in the shipped build.
- [ ] No real person's face, voice or name appears.
- [ ] No show footage, logo, set or soundtrack appears.
- [ ] Fonts are subset and self-hosted with their OFL text included.
- [ ] The asset audit script passes with zero warnings.
