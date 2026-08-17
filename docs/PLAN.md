# Implementation Plan

Source spec: [`docs/DRM.md`](./DRM.md). Order follows §22 (MVP Priority) — build
the smallest functional slice of the closed-loop system, layer by layer.
Nothing outside Layers 1–6 gets built (no generic chat, essay writer, etc.).

Architecture rule from §24 is load-bearing for every layer below: the LLM only
extracts raw sub-features into structured, schema-validated JSON. All scoring
math (weights, normalization, distances) lives in a pure, deterministic,
unit-tested TypeScript package with zero LLM calls. The API layer wires the
two together and never lets the LLM emit a final score itself.

```
apps/web              Next.js console (UI + API routes)
packages/scoring-engine  pure deterministic math (§2,3,5,7,8,9) — no I/O
packages/llm-extraction  Claude prompts + zod schemas → structured JSON
packages/shared-types    zod schemas / types shared across the two above
```

## Phase 1 — Layers 1–3 (this iteration)

### 1. Repo scaffold
- pnpm workspace monorepo: `apps/web`, `packages/scoring-engine`,
  `packages/llm-extraction`, `packages/shared-types`.
- Shared TS config, ESLint, Vitest for the scoring engine's unit tests.

### 2. Layer 1 — Persona Extraction (§2, §3)
- `shared-types`: `PersonaVector` zod schema (8 dims, 0–100, clamped).
- `llm-extraction`: prompt that turns a creator's writing sample / bio into a
  `PersonaVector` JSON (Claude, structured output via tool-use, validated with
  the zod schema — reject and retry once on schema failure).
- `scoring-engine`: `personaConsistencyScore(target, sample)` implementing the
  normalized Euclidean distance + PCS formula from §3, plus a
  `driftBreakdown()` helper that ranks which dimensions diverge most.
- API route `POST /api/persona/extract`.

### 3. Layer 2 — Script Feature Extraction (§5, §7, §8, §9)
- `shared-types`: `ScriptSentenceFeatures` schema (novelty, contradiction,
  specificity, info-gap, emotional intensity, relevance; tension sub-features
  C/U/S/K; provocation sub-features C/S/I/N/R; shareability sub-features
  I/R/U/S/E/M) — all raw 0–100 sub-features, LLM's job stops here.
- `llm-extraction`: prompt that decomposes a script into sentences and
  extracts the above raw sub-features per sentence (+ whole-script
  shareability sub-features).
- API route `POST /api/script/extract-features`.

### 4. Layer 3 — Numerical Scoring (§5 Hook/CG, §7 TS, §8 PS, §9 SS)
- `scoring-engine`: deterministic formulas taking the raw sub-features and
  producing:
  - `hookScore(sentence)` — weighted combination → `H_i`
  - `curiosityGap(sentence)` — `I_required - I_provided` → `CG_i`
  - `tensionScore(sentence)` — `C+U+S+K` normalized → `TS`, plus a
    `dominantTensionFactor()` explainer
  - `provocationScore(sentence)` — exact §8 weighted formula → `PS`
  - `shareabilityScore(script)` — exact §9 weighted formula → `SS`
  - all pure functions, fully unit-tested against hand-computed fixtures.
- API route `POST /api/script/analyze` = extract-features (Layer 2) →
  score (Layer 3) in one call, returning the full per-sentence + script-level
  score breakdown.
- Minimal console UI (§21 shape, not a chatbot): `Creator Model` page (persona
  vector input/display) and `Content Lab` page (paste script → per-sentence
  score table + explanation), matching the "measure, don't just describe"
  principle from §0/§23.

**Explicitly out of scope for Phase 1:** VPS composite (§11) and Prediction
Confidence (§12) — those are Layer 4 (Virality Prediction) and depend on
Retention/Memorability extraction plus historical-data confidence modeling
that Layer 3 doesn't have yet. Comment Probability (§10), Persona Authenticity
(§4), Face/Gesture Layer (§13), Script-to-Performance Alignment (§14),
Archetype Engine (§15) are later layers/secondary per §22.

## Phase 2 — Layer 4: Virality Prediction (§6, §10, §11, §12, §19, §20)
- Information Reveal Curve extraction + visualization (§6).
- Comment Probability σ(...) (§10).
- VPS composite (§11) — now that Hook/CG/TS/SS/PS/PCS all exist, plus
  Retention-structure and Memorability extraction to fill the two remaining
  VPS terms.
- Prediction Confidence `f(N,Q,D)` (§12) — starts LOW for every new creator
  until historical data accumulates (needs a persistence layer / DB, first
  real storage requirement in the project).
- Evidence Strength Unit (§19) + the OBSERVATION→...→EVIDENCE recommendation
  format (§20) wrapping every score the UI surfaces.

## Phase 3 — Layer 5: Script Mutation (§16, §15)
- Content Archetype Engine (§15) — weighted archetype mixture from persona +
  script history.
- Content Mutation Engine (§16) — generate N controlled variants of a script
  (e.g. curiosity-heavy vs provocation-heavy), each independently scored
  through the Phase 1–2 pipeline so variants are comparable, not just "another
  draft."

## Phase 4 — Layer 6: Performance Feedback (§17, §18)
- Persistence for published videos + actual performance metrics (§17 schema).
- Prediction error `E = |VPS_predicted - Performance_normalized|`.
- Creator-specific calibration `Y = f(P,X,A)` (§18) — per-creator weight
  recalibration from accumulated (prediction, outcome) pairs. This is the
  loop-closing step and the actual product moat per §18/§23.

## Deferred / secondary (build only if it serves the loop)
- Persona Authenticity (§4) — needs historical-content store (ties into
  Phase 4).
- Face/Gesture Layer (§13) + Script-to-Performance Alignment (§14) — video
  input pipeline, separate media-processing track.
- Full §21 console UI polish (multi-pane intelligence console) — grows
  incrementally as each phase adds a scoreable dimension; Phase 1 ships the
  minimal Creator Model + Content Lab shell only.
