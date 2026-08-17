# Real-Time Content Performance Engine — Product Spec v0.1

Extends The Lyceum from a static persona/content analyzer into a
performance copilot that watches a creator while they film, tells them
what to change in the moment, and re-analyzes the finished video against
what actually happened after it published.

## 0. Product Identity

> An AI performance machine that watches you create, understands how you
> are perceived, tells you what to change, and learns from what the
> audience actually does.

This is **not** another "helpful AI content assistant." The differentiator
is performance optimization, not content generation. Lyceum optimizes for
attention, memorability, curiosity, persona consistency, and measurable
audience response — while preserving the creator's intentional identity.

The product supports deliberately provocative, rivalrous, contrarian, or
rebellious personas. The engine must distinguish attention-generating
provocation from harassment, fabricated claims, or unsafe behavior. The
goal is not to manufacture controversy for its own sake — it's to
mathematically understand which observable creative decisions increase
attention and retention.

## 1. Live Filming Copilot

During filming, the system continuously analyzes the camera feed:

- facial expression
- gaze
- head position
- gesture
- movement
- speech rhythm / pauses
- vocal energy
- framing
- persona consistency

The AI communicates through a lightweight live interface — short
interventions, not long explanations that interrupt the creator's flow.

### Persona Deviation

The system maintains a target persona vector `P_t` (the same 8-dimension
vector concept as the earlier DRM persona engine — arrogance, charisma,
vulnerability, dominance, humor, warmth, enigma, provocation) and
continuously estimates the **observed** performance vector `P_o(t)`.

```
D(t) = ||P_t - P_o(t)||_2
```

(Euclidean distance between target and observed persona vectors, evaluated
continuously as a time series during the recording — the same formula
shape as the earlier Persona Consistency Score, but sampled live instead
of computed once per script.)

### Actionable Deviations

The engine should identify things like:

- weak eye contact
- excessive smiling
- insufficient gesture
- low expression intensity
- unstable framing
- pacing inconsistent with the intended persona

## 2. Second-Pass Analysis (Post-Recording)

After recording, Lyceum performs a full second-pass analysis of the
complete video:

- transcribes speech
- hook latency
- sentence-length distribution
- pause frequency
- speech-rate variance
- emotional intensity
- information density
- visual change frequency
- reveal timing
- CTA timing
- persona consistency

### Content Performance Report

1. Persona Consistency Score
2. Hook Strength Score
3. Retention Structure Score
4. Pacing Score
5. Visual Attention Score
6. Curiosity / Information-Gap Score
7. Shareability Score
8. Distribution Readiness Score

**The Distribution Readiness Score must explicitly be treated as a
probabilistic ranking metric, not a guarantee of virality** — same
principle as the earlier VPS/Confidence split: a score and its confidence
are different quantities, and the UI must not conflate them.

## 3. Post-Publication Learning Loop

For each published video, Lyceum records available performance signals:
view velocity, retention, rewatches, shares, comments, saves, profile
visits, conversion events. These feed back into the scoring system to
continuously calibrate the relationship between observable content
features and actual distribution.

```
Create → Analyze → Publish → Measure → Calibrate → Create Better
```

(This is the same closed loop as the earlier persona-engine work —
prediction, publish, measure, recalibrate — now fed by both the live
capture data and the second-pass report, not just a text script.)

## 4. Rivalry Intensity as a Creative Variable

Rivalry is **not** a fixed identity the engine imposes on a creator — it's
a measured creative variable, same shape as the other persona dimensions:

```
R = Rivalry Intensity, 0-100
```

| Range  | Label          |
| ------ | -------------- |
| 0–20   | cooperative    |
| 20–40  | confident      |
| 40–60  | competitive    |
| 60–80  | provocative    |
| 80–100 | confrontational |

The point of exposing `R` as its own axis (rather than folding it into a
single "provocation" score) is that it becomes a variable the calibration
system can test hypotheses against, per-audience:

> "For audience X, rivalry 72 + curiosity 81 + warmth 24 produced better
> retention than rivalry 94."

That's the actual product: a feature space for testing attention
hypotheses with real outcome data — not an AI opinion about whether a
video is "cool." This is also the natural slot where external research
signals (e.g. Perplexity/Gemini research on what's resonating in a niche
right now) could eventually feed in as calibration priors, without
changing what the engine fundamentally measures.

## 5. Relationship to the Existing Persona/Scoring Work

This spec is additive to (not a replacement for) the persona-vector and
scoring-formula concepts already designed for Lyceum:

- `P_t` / `P_o(t)` and `D(t)` are the live, continuous version of the
  earlier static Persona Consistency Score.
- Hook Strength, Retention Structure, Curiosity/Information-Gap, and
  Shareability Scores are the video-native counterparts of the earlier
  script-level Hook, Curiosity Gap, Tension/Retention, and Shareability
  scores.
- The post-publication learning loop and per-creator calibration are the
  same mechanism as before, extended to also calibrate against `R`
  (Rivalry Intensity) as an explicit feature dimension, not just the
  original 8 persona dimensions.
- The engineering rule carries over unchanged: models/perception systems
  extract raw, observable signals; a deterministic scoring layer turns
  those into the report's scores; nothing downstream should let a model
  freely invent a final number.
