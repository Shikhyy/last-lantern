# AI BEHAVIOUR SPEC — THE LAST LANTERN

> Depends on: `00-DESIGN_CANON.md`, `GAME_DESIGN.md`, `NARRATIVE_AND_CHARACTERS.md`.
> Feeds: `TECHNICAL_ARCHITECTURE.md`, `ACCEPTANCE_CRITERIA.md`.

## 1. Purpose

Eleven AI contestants must feel like people who are listening, remembering and choosing,
without ever cheating. This document defines what each AI knows, how it updates, how it
decides, how it speaks, and how the engine proves it never sees a hidden role it has not
earned.

## 2. Non-negotiable fairness rules

1. **Bounded knowledge.** An AI's belief about a role is a function of its own observations,
   its own role knowledge, things it was told, and inferences from those. It is never a
   function of engine truth.
2. **No shared mind.** AI do not share a hidden state, except the Shadowed, who share only
   the names of the Shadowed.
3. **No journal reading.** AI never read the player's Journal, Evidence Board or private
   notes. They only know what the player said or showed.
4. **No future knowledge.** An AI never reacts to an event before it has occurred in the
   timeline it witnessed.
5. **No LLM facts.** If a language model is used, it only *phrases* an utterance plan the
   engine already decided from known facts. It cannot add, remove or invent a fact.
6. **Determinism.** Given the same seed and the same player inputs, every AI decision is
   identical. Randomness comes only from the seeded RNG.

## 3. Knowledge model

Each AI carries a **knowledge graph** with typed nodes and edges.

```ts
type ContestantId = string;

interface KnowledgeGraph {
  // What this AI believes about each person's role, as a probability.
  suspicion: Record<ContestantId, number>;   // 0..1, P(Shadowed)
  // What this AI believes about specific claims.
  claims: Claim[];                            // authored/testified statements
  // What this AI saw itself.
  observations: Observation[];                // time, place, actor, action
  // Relationship state.
  relationships: Record<ContestantId, Relationship>;
  // Private knowledge only if a role grants it.
  privileged: PrivilegedKnowledge;
  // Decaying memory weights.
  memory: MemoryEntry[];
}
```

### 3.1 Suspicion update

Suspicion is a bounded Bayesian-ish score, not a probability in the strict sense, to keep it
legible and tunable:

```
suspicion[target] = clamp(
  prior[target]
  + Σ evidenceWeight(claim, target, credibility(source))
  + relationshipBias
  + roleSignal (Shadow: ally protection; Keeper/Warden: own reads/wards)
  + noise(personality, difficulty),
  0, 1
)
```

- `credibility(source)` is a function of the AI's relationship with the source and the
  source's history of being right (as this AI sees it).
- `evidenceWeight` is authored per clue type in the content schema; the engine never guesses
  it.
- `noise` is drawn from the seeded RNG and scaled by the cognitive-difficulty setting; it
  makes low-difficulty AI more erratic and high-difficulty AI more consistent, without giving
  them information.

### 3.2 Relationship model

```ts
interface Relationship {
  trust: number;      // -100..100, belief that they are on my side
  affinity: number;   // -100..100, liking
  fear: number;       // 0..100, cost of crossing them
  debt: number;       // -100..100, favours owed
  pacts: PactId[];    // active agreements
  grudges: Grudge[];  // remembered harms, with decay
}
```

- Trust changes from kept/broken pacts, shared evidence, public defence, accusations and
  whether the AI's own advice was followed.
- Grudges decay by `importance × recency`; a betrayal in the last two nights outweighs an old
  favour.

### 3.3 Memory profile

Each character has a memory profile (from `NARRATIVE_AND_CHARACTERS.md` §5) that decides what
persists:

| Profile | Strong | Weak |
|---|---|---|
| Photographic (Meera) | exact words | faces in poor light |
| Social (Arjun) | favours, debts | times, numbers |
| Visual (Bela) | framing, light | dialogue |
| Sensory (Kabir) | meals, absences | exact hours |
| Spatial (Zoya) | routes, positions | sentiment |
| Procedural (Dev) | sequence, orders | feelings |
| Melodic (Naina) | tone, feeling | exact words |
| Numeric (Rohan) | amounts, odds | names, faces |
| Taxonomic (Ila) | plants, doses | conversation |
| Ecological (Samar) | behaviour patterns | gossip |
| Quote-exact (Tara) | who said what | motives |

Memory decay: `weight *= decay(profile) ^ nightsElapsed`, with a floor for events marked
`high-emotion` or `betrayal`.

## 4. Privileged knowledge by role

| Role | Knows | Does not know |
|---|---|---|
| Oathkeeper | own oath, public events | any role, any night action |
| Shadowed | the other Shadowed; own sabotage; the Veil calendar | Keeper reads, Warden wards, who will be Veiled next |
| Lantern Keeper | own Read results; target's faction per Read | the rest of the Shadow team; Warden's wards |
| Warden | own Ward targets and outcomes | roles; who the Shadows are |

The Shadowed know **who is Shadowed** but not **what each other's private motive is** or
**what each has told the player**. This creates real temptation to lie to one's own team.

## 5. Decision architecture

Each AI runs the same pipeline at each decision point, in this order:

```mermaid
flowchart LR
  P[Perceive] --> U[Update knowledge]
  U --> G[Generate candidate actions]
  G --> S[Score by utility]
  S --> C[Choose with bounded noise]
  C --> V[Plan utterance]
  V --> O[Verbalize]
  O --> R[Record claim + memory]
```

### 5.1 Perceive

Collect only what is currently observable: who is in the room, what was said publicly, what
the AI was told privately, what its role action returned, and what the world state shows
(doors, water, damage). No hidden state.

### 5.2 Update

Apply suspicion and relationship updates, memory decay, and pact status. Record any new claim
with its source and truth value *as known to the AI* (an AI does not know if another's claim
is true; it only knows its own).

### 5.3 Candidate actions

Finite, authored action set per context:

- **Day:** explore room R, join mission M, approach contestant C with intent I, examine
  object O, observe C's movement, rest.
- **Dusk:** send note, rearrange beliefs, prepare council posture.
- **Council:** accuse C, defend C, present evidence E, question C, stay silent, vote for C,
  spend shield.
- **Night (role):** on Nights 1, 3 and 5, veil C + sabotage S (Shadow); on Nights 2 and 4,
  sabotage S only; read C (Keeper); ward C (Warden).
- **Conversation:** answer, deflect, counter-question, confide, lie, propose pact, threaten,
  leave.

### 5.4 Utility scoring

Every candidate action is scored by a weighted sum:

```
U(action) = w_surv · survive
         + w_win  · factionWinProbability
         + w_rel  · relationshipEffect
         + w_agenda · personalMotiveProgress
         + w_consistency · consistencyWithPastClaims
         + w_risk · -exposureRisk
         + w_style · personalityFit
```

Weights:

- Faithful AI: `survive 1.0 · win 1.2 · rel 0.8 · agenda 0.6 · consistency 0.9 · risk 0.5`.
- Shadow AI: `survive 0.8 · win 1.5 · rel 0.6 · agenda 0.7 · consistency 0.7 · risk 0.9`
  plus a **cover** term: never vote with both teammates in a way that is statistically
  suspicious unless the endgame requires it.
- Personality modulates `w_style` and the noise scale (Guile increases lie willingness; Candor
  decreases it; Nerve increases accusation willingness; Composure reduces panic switches).

### 5.5 Bounded noise

```
finalScore = U(action) + gauss(0, sigma)
sigma = 0.06 + 0.29 × (1 - difficulty) × (1 - composure/200)
```

- Difficulty 0 (easy): sigma ≈ 0.35; 0.5: sigma ≈ 0.20; 1.0 (hard): sigma ≈ 0.06.
- This makes behaviour human-ish at low difficulty and consistent at high difficulty, without
  ever leaking information.

### 5.6 Shadow coordination

- At Night, the three Shadows exchange **proposals**, not private thoughts: `Veil(C)` on Veil
  nights, `Sabotage(S)`, `WardSuspicion(C)`. On Vigil nights, `Veil` is not a legal proposal.
- A simple negotiation: each scores proposals; the highest total wins; ties broken by the
  Shadow with the highest Guile. The player Shadow may overrule once per night if they spend
  social capital.
- The coordination channel carries no information the Shadows do not already have; it cannot
  reveal the Keeper's read.

## 6. Dialogue system

### 6.1 Two-stage design

1. **Planner (deterministic, factual).** Chooses an intent and a set of *allowed facts* from
   the AI's knowledge graph, plus a target and a tone. Output is a structured `UtterancePlan`.
2. **Verbalizer (template or LLM).** Renders the plan into a line consistent with the
   character's speech fingerprint. The verbalizer cannot add facts.

```ts
interface UtterancePlan {
  speaker: ContestantId;
  intent: 'answer' | 'deflect' | 'accuse' | 'defend' | 'confide' | 'lie'
        | 'proposePact' | 'threaten' | 'console' | 'question' | 'leave';
  target?: ContestantId;
  facts: FactRef[];        // engine-verified references only
  tone: 'warm' | 'neutral' | 'cold' | 'afraid' | 'angry' | 'amused';
  reveal: 'none' | 'minor' | 'major';
  truthfulness: 'true' | 'false' | 'partial';
  memoryRef?: MemoryId;    // why they care
}
```

### 6.2 Verbalizer A — templates (baseline, offline)

- Each character has 12–30 authored templates per intent family, with slot filling for names,
  places, times and evidence.
- Templates are tagged to avoid repetition within a conversation and across a night.
- The baseline must be good enough to ship without any LLM.

### 6.3 Verbalizer B — LLM adapter (optional)

- **Interface:** `verbalize(plan: UtterancePlan, fingerprint: SpeechFingerprint, context: PublicContext) -> Promise<string>`.
- **Hard constraints:** system prompt forbids adding facts, naming unmentioned people,
  claiming knowledge outside the plan, or speaking as another character; output is validated
  against the plan's allowed facts with a lightweight entity check.
- **Failure behaviour:** on timeout, refusal or validation failure, fall back to the template
  verbalizer silently; the player never sees an error for flavour.
- **Privacy:** no personal data is sent; only invented game state.
- **Cost control:** cached per `(plan, fingerprint)` signature; a request budget per session;
  LLM disabled by default.
- **Safety:** the LLM never decides truth, roles, votes or outcomes.

### 6.4 Speech fingerprints

Each character's fingerprint is a constraint set (rhythm, vocabulary, forbidden words) from
`NARRATIVE_AND_CHARACTERS.md` §6. The planner selects facts; the verbalizer may not change
`truthfulness`.

## 7. Conversation behaviour rules

- **Answering:** if asked about whereabouts, the AI answers truthfully unless it has a reason
  to lie (it is Shadowed, or it is protecting a pact, or it committed a non-role transgression
  such as stealing a clue). Lying is a scored choice, not a default.
- **Evidence reaction:** when shown Evidence, the AI updates suspicion with the clue's weight
  scaled by its credibility in the player and its relationship to the subject. It may
  acknowledge, dismiss, counter with its own claim, or ask to see more.
- **Accusation:** an AI accused publicly responds by defence, counter-accusation, or silence,
  chosen by utility and Composure.
- **Pact response:** accepts if trust is high enough and terms improve its expected outcome;
  may accept falsely (a Shadow accepting a pact to neutralise a faithful ally).
- **Memory callbacks:** at least once per two nights, an AI references something the player
  did earlier, using its memory profile, e.g. Meera quotes the player's exact words, Kabir
  remembers who missed a meal, Bela remembers what the light was doing.
- **Leave condition:** an AI ends a conversation when its utility for staying drops, it is
  angry, or it has achieved its goal; it always says why in character.

## 8. Belief display to the player

The player never sees AI suspicion numbers. The game shows only what a person would show:

- facial mood, posture, gesture, tone
- explicit statements ("I don't trust her.")
- vote behaviour and public accusations
- pacts accepted or refused

The Journal may show the player's *own* record of what was said, never the AI's internal
state.

## 9. Difficulty and fairness tuning

| Setting | Effect |
|---|---|
| Easy | higher noise; shorter memory; fewer clues placed; AI forgive more |
| Normal | baseline |
| Hard | lower noise; longer memory; more clues; AI punish contradictions harder |
| Guided (orthogonal) | surfaces hints and warnings for the player; does not change AI knowledge |

Difficulty never changes the truth, the rules or the role distribution.

## 10. Testing and verification

### 10.1 Unit tests
- Suspicion update is monotonic in the expected direction for a known clue.
- Relationship delta for a kept pact is positive; for a broken pact, negative.
- Memory decay follows the profile function and respects the high-emotion floor.
- Utility scoring is deterministic under a fixed seed.

### 10.2 Invariant tests (the fairness proof)
1. **No-omniscience:** for 1,000 seeded matches, no Oathkeeper AI's belief ever changes in
   response to a fact it did not observe, was not told, or did not infer from those.
   Implement by snapshotting each AI's knowledge before and after every event and asserting
   the delta only references allowed sources.
2. **No-journal-leak:** the player's notes and board links never appear in any AI knowledge
   source unless the player explicitly shared a subset.
3. **Dead-don't-act:** an eliminated AI casts no vote, makes no proposal, updates no state.
4. **Shadow-only shared knowledge:** only Shadowed AI read the Shadow channel; no other AI's
   knowledge references it.
5. **Determinism:** identical seed + identical input log ⇒ byte-identical event log.

### 10.3 Simulation harness
- Run 1,000 headless matches with a scripted player policy (random, rational, and adversarial).
- Assert: every ending is reachable; no match ends in an impossible state; no invariant fires.
- Report: win rates by role, average match length, average number of accusations, average
  number of pacts, and the rate at which each clue was found.

### 10.4 Human evaluation
- Blind playtest: a reviewer reads three AI conversations and guesses whether they were
  template or LLM. If the baseline reads as obviously generated, the templates are rejected.
- Fairness playtest: a reviewer who knows the roles watches an AI and checks whether any
  action is impossible to justify from what the AI knew.

## 11. Anti-meta and anti-frustration rules

- Role assignment is independent of character, and a soft anti-repeat prevents the same
  character being the same role twice in a row on a save.
- AI never hard-target the player for being the player; they target by suspicion and role.
- AI do not all turn on the player at once; disagreement is visible and staged.
- If the player is eliminated, the game offers **Spectator Mode**: watch the remaining AI
  play out the rest, with the player's notes still visible, and see the ending they caused.
- If an AI is about to make a decision that would break an invariant, the engine clamps it and
  logs the clamp as a bug, not a silent fix.

## 12. Open questions

- How much should a Shadow lie to its own team? Baseline: rarely, only to protect a pact or a
  personal secret; test whether players find internal Shadow conflict legible.
- Should the player be able to see a "mood" indicator for AI, or only infer? Baseline: infer
  from portrait, tone and phrasing; test a subtle mood ring in guided mode.
- Should AI remember who voted for whom across games? No — per-match memory only, for privacy
  and fairness.
