# The Lyceum

Landing page, auth wall, an onboarding flow that builds a creator's
baseline persona vector, and a live filming studio: real-time face
metrics, a live speech transcript, clean recording (no overlay baked into
the video), and an AI plan-then-execute loop for the next take. Deployed
on Railway.

See [`docs/REALTIME_ENGINE.md`](./docs/REALTIME_ENGINE.md) for where this is
headed and [`docs/REALTIME_PLAN.md`](./docs/REALTIME_PLAN.md) for the
phased build plan.

## Stack

- Next.js 16 (App Router) / React 19
- Firebase Auth (Email/Password + Google) and Firestore (client SDK)
- `@mediapipe/tasks-vision` Face Landmarker — runs client-side in the
  browser, both for the onboarding face scan (single shot) and the studio's
  continuous live metrics; photos/frames are never uploaded, only the
  derived expression (blendshape) numbers are
- Browser `SpeechRecognition` (Web Speech API) for the studio's live
  transcript — no server-side transcription service
- `@anthropic-ai/sdk` for onboarding synthesis, with OpenRouter (below) as
  the fallback/primary for everything else
- **OpenRouter** (`openai` SDK pointed at OpenRouter's base URL) — one
  client for both providers used in this app: GPT (`lib/openrouter.ts`
  `GPT_VISION_MODEL` / `GPT_REASONING_MODEL`) is the decision-maker (face
  verification, onboarding synthesis fallback, studio session planning);
  Gemini Flash (`GEMINI_FLASH_MODEL`) is the executor (fast, cheap, called
  repeatedly during live filming for coaching tips)
- No CSS framework — hand-written `app/globals.css`

## Structure

```
app/page.tsx                          landing page
app/login/page.tsx                     auth wall (sign up / log in, email + Google)
app/onboarding/page.tsx                3-step wizard: personality Q&A, face scan (camera or upload), baseline results
app/app/page.tsx                        post-onboarding home
app/studio/page.tsx                     live filming: camera, live face metrics, live transcript, recording, session plan
app/api/onboarding/analyze/route.ts     self-report + face signals -> persona vector + style suggestions
app/api/onboarding/verify-face/route.ts GPT vision: is this a real face photo + feature description
app/api/studio/plan/route.ts             GPT: analyzes a finished take, plans the next one (8 dimensions)
app/api/studio/coach/route.ts            Gemini Flash: one live coaching nudge per call, during recording
lib/firebase.ts                          Firebase client init (app, auth, firestore, analytics)
lib/persona.ts                           PersonaVector schema (9 dims incl. Rivalry Intensity) + onboarding types
lib/face-scan.ts                         client-side MediaPipe Face Landmarker (single-shot + continuous video mode)
lib/speech.ts                            client-side live transcription (Web Speech API)
lib/openrouter.ts                        shared OpenRouter client + model constants
lib/onboarding-llm.ts                    onboarding synthesis (Claude, falls back to GPT/OpenRouter)
lib/face-verify.ts                       face-photo verification (GPT vision/OpenRouter)
lib/studio-llm.ts                        session planning (GPT) + live coaching (Gemini Flash), both/OpenRouter
firestore.rules                          users/{uid} readable/writable only by that user
railway.json                              Railway build/deploy config
```

## Local development

```bash
npm install
cp .env.example .env.local   # fill in the Firebase web config + OPENROUTER_API_KEY
npm run dev
```

## Before this works in production

Two things need to be turned on in the [Firebase console](https://console.firebase.google.com/project/pclick-9f190)
— these are one-time console toggles, not something a deploy can flip:

1. **Authentication → Sign-in method** → enable **Email/Password** and
   **Google**.
2. **Firestore Database** → **Create database** (any region; start in
   production mode — `firestore.rules` in this repo already locks it down to
   per-user access, deploy it with `firebase deploy --only firestore:rules`
   once you have the Firebase CLI logged in, or paste it into the console's
   Rules tab).

Without step 1, the auth wall's Google button and email/password forms will
error. Without step 2, Firestore writes (onboarding profile, session plans)
fail silently in the background — the flows themselves still work, just
without persistence.

`OPENROUTER_API_KEY` needs actual balance for onboarding analysis, face
verification, and the studio's session planning / live coaching to
produce results — every one of those calls fails with a clear error
message (not a crash) if the key is missing or the account is out of
credit, same either way. Top up at
https://openrouter.ai/settings/credits.

## Deploy

Deployed on Railway (see the Railway dashboard for the project — GitHub
integration auto-deploys every push to `main`). The same
`NEXT_PUBLIC_FIREBASE_*` values (and `OPENROUTER_API_KEY`) from
`.env.local` need to be set as Railway environment variables (Next.js
inlines `NEXT_PUBLIC_*` at build time). To trigger a manual redeploy
instead of waiting on a push:

```bash
railway redeploy --service personakit --from-source
```

**Never commit a Railway token to this repo.** Set `RAILWAY_TOKEN` as a
local shell env var when running CLI commands, and if a token is ever
pasted into a chat, git commit, or log, treat it as compromised and
regenerate it from the Railway dashboard.
