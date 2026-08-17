# The Lyceum

Landing page, auth wall, and an onboarding flow that builds a creator's
baseline persona vector from a short self-report + an in-browser face scan.
Enterprise-grade, local-first, zero-latency, all the words. Deployed on
Railway.

See [`docs/REALTIME_ENGINE.md`](./docs/REALTIME_ENGINE.md) for where this is
headed (live filming copilot, second-pass Content Performance Report,
post-publication calibration loop) and
[`docs/REALTIME_PLAN.md`](./docs/REALTIME_PLAN.md) for the phased build
plan.

## Stack

- Next.js 16 (App Router) / React 19
- Firebase Auth (Email/Password + Google) and Firestore (client SDK)
- `@mediapipe/tasks-vision` Face Landmarker — runs client-side in the
  browser; the onboarding face scan never uploads the photo, only the
  derived expression (blendshape) summary
- `@anthropic-ai/sdk` — turns the onboarding self-report + face scan into a
  baseline persona vector and style suggestions
- No CSS framework — hand-written `app/globals.css`

## Structure

```
app/page.tsx                       landing page
app/login/page.tsx                  auth wall (sign up / log in, email + Google)
app/onboarding/page.tsx             3-step wizard: personality Q&A, face scan, baseline results
app/app/page.tsx                     post-onboarding home; redirects to /login or /onboarding as needed
app/api/onboarding/analyze/route.ts  LLM call: self-report + face features -> persona vector + style suggestions
lib/firebase.ts                       Firebase client init (app, auth, firestore, analytics)
lib/persona.ts                        PersonaVector schema (9 dims incl. Rivalry Intensity) + onboarding types
lib/face-scan.ts                      client-side MediaPipe Face Landmarker wrapper
firestore.rules                       users/{uid} readable/writable only by that user
railway.json                           Railway build/deploy config
```

## Local development

```bash
npm install
cp .env.example .env.local   # fill in the Firebase web config + ANTHROPIC_API_KEY
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
error. Without step 2, the `users/{uid}` profile write on signup will fail
silently in the background (it doesn't block login — signup still works,
the profile doc just won't save until Firestore exists).

`ANTHROPIC_API_KEY` also needs to be set (locally and on Railway) for
`/api/onboarding/analyze` to actually produce a persona vector and style
suggestions — without it, onboarding's personality/face-scan steps still
work, but the results step returns a clear error instead of a result.

## Deploy

Deployed on Railway (see the Railway dashboard for the project — GitHub
integration auto-deploys every push to `main`). The same
`NEXT_PUBLIC_FIREBASE_*` values (and `ANTHROPIC_API_KEY`) from `.env.local`
need to be set as Railway environment variables (Next.js inlines
`NEXT_PUBLIC_*` at build time). To trigger a manual redeploy instead of
waiting on a push:

```bash
railway redeploy --service personakit --from-source
```

**Never commit a Railway token to this repo.** Set `RAILWAY_TOKEN` as a
local shell env var when running CLI commands, and if a token is ever
pasted into a chat, git commit, or log, treat it as compromised and
regenerate it from the Railway dashboard.
