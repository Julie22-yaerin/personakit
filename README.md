# The Lyceum

Landing page + auth wall. Enterprise-grade, local-first, zero-latency, all the
words. Deployed on Railway.

## Stack

- Next.js 14 (App Router)
- Firebase Auth (Email/Password + Google) and Firestore (client SDK)
- No CSS framework — hand-written `app/globals.css`

## Structure

```
app/page.tsx        landing page
app/login/page.tsx   auth wall (sign up / log in, email + Google)
app/app/page.tsx     minimal post-login page, redirects to /login if signed out
lib/firebase.ts       Firebase client init (app, auth, firestore, analytics)
firestore.rules       users/{uid} readable/writable only by that user
railway.json           Railway build/deploy config
```

## Local development

```bash
npm install
cp .env.example .env.local   # fill in the Firebase web config values
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

## Deploy

Deployed on Railway (see the Railway dashboard for the project — GitHub
integration auto-deploys every push to `main`). The same
`NEXT_PUBLIC_FIREBASE_*` values from `.env.local` need to be set as Railway
environment variables (Next.js inlines them at build time). To trigger a
manual redeploy instead of waiting on a push:

```bash
railway redeploy --service personakit --from-source
```

**Never commit a Railway token to this repo.** Set `RAILWAY_TOKEN` as a
local shell env var when running CLI commands, and if a token is ever
pasted into a chat, git commit, or log, treat it as compromised and
regenerate it from the Railway dashboard.
