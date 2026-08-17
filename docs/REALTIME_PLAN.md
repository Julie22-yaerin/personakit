# Real-Time Content Performance Engine — Implementation Plan

Source spec: [`docs/REALTIME_ENGINE.md`](./REALTIME_ENGINE.md). Broken into
phases ordered by tractability, not by the spec's section order — the live
in-browser ML copilot (§1) is the hardest and most infrastructure-committing
piece, so it's sequenced after the parts that don't require picking that
stack yet.

## Phase 1 — Second-Pass Analysis + Content Performance Report

The most direct extension of the scoring/calibration work already in this
repo's history (persona vector, deterministic scoring engine, LLM-extracts /
engine-scores separation, publish → measure → calibrate loop). No live
camera ML required.

- Video/audio upload → transcription (needs a speech-to-text provider —
  see "Open decisions" below).
- Feature extraction from the transcript + its timing (hook latency,
  sentence-length distribution, pause frequency, speech-rate variance,
  emotional intensity, information density, reveal timing, CTA timing,
  persona consistency) — same LLM-extracts-raw-signals /
  deterministic-engine-scores split as before.
- Visual change frequency / framing stability from the video track —
  frame-sampled, not full real-time analysis.
- Deterministic scoring engine computes the 8 Content Performance Report
  scores; Distribution Readiness Score ships with an explicit confidence
  label, same as the earlier VPS/Confidence split — never a bare number
  presented as a guarantee.
- Firestore schema for videos + reports, reusing the `users/{uid}` auth
  wall already in place.

## Phase 2 — Rivalry Intensity + Audience-Conditioned Calibration

- Add `R` (Rivalry Intensity, 0–100) as a persona dimension alongside the
  existing 8.
- Extend the calibration loop so it can test conditioned hypotheses
  ("at rivalry ~72 + curiosity ~81 + warmth ~24, audience segment X
  retains better than at rivalry ~94") instead of only fitting a single
  global per-creator weight vector — this needs an audience/segment field
  on published-video records, not just a bigger weight vector.
- This phase is schema + scoring-engine math, no new infrastructure.

## Phase 3 — Live Filming Copilot

The infrastructure-committing phase. Needs a stack decision before writing
code (see below): real-time camera/mic capture, live face/gaze/gesture/pose
signal extraction, a raw-signal → `P_o(t)` mapping, `D(t) = ||P_t -
P_o(t)||_2` computed continuously, and a rate-limited, non-blocking live
intervention UI (short nudges, not paragraphs, and not on every frame).

## Phase 4 — Full Loop Closure

Wire live-capture signals + the Phase 1 second-pass report + real
post-publication outcomes into one calibration pass, so `Create → Analyze →
Publish → Measure → Calibrate → Create Better` runs on the richer feature
set (original 8 dimensions + Rivalry + live-performance deltas), not just
the script-level features from before.

## Open decisions (need a call before Phase 1 / Phase 3 can start)

1. **Speech-to-text provider for Phase 1.** Transcribing uploaded video
   needs a real API (Whisper API, Deepgram, AssemblyAI, Google
   Speech-to-Text, etc.) — none are wired up yet, and none of their keys
   are available in this environment. Recommendation: Whisper API, since
   an Anthropic key would already be needed for the feature-extraction
   step (same LLM-extraction pattern as the earlier persona engine), and
   OpenAI's transcription API is a single additional key with no separate
   vendor relationship to set up. Needs your call either way, plus the
   key itself.
2. **Live ML stack for Phase 3.** Recommendation: run face/gaze/gesture/
   pose detection **client-side in the browser** via MediaPipe Tasks
   Vision (Face Landmarker, Gesture Recognizer, Pose Landmarker) rather
   than streaming raw camera video to a server — better latency (no
   round-trip), no per-frame inference cost, and the raw video never
   leaves the creator's device, which matters given this is filming
   footage before it's ever been reviewed or published. The tradeoff:
   browser ML is more constrained (weaker models than a large server-side
   vision model, some device-performance variance) and the raw-signal →
   persona-vector mapping starts as hand-authored heuristics, not
   something trained on data yet.
3. **Which phase to build first.** Phase 1 is the natural starting point —
   it's the most tractable, reuses the existing scoring-engine pattern
   directly, and doesn't lock in the harder Phase 3 stack decision. But it
   still needs decision #1 (and the API key) before there's anything to
   build against.
