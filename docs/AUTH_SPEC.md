# Authentication Module Specification (FROZEN v1.0)

> **Status**: FROZEN / PRODUCTION READY  
> **Last Updated**: 2026-08-29  
> **Repository**: `personakit`  
> **Branch**: `main`

---

## 1. Overview & Architecture

The authentication & identity subsystem in Personakit provides end-to-end authentication, session security, device tracking, and self-service account management via Firebase Authentication & Firestore.

```
+-----------------------------------------------------------------------------------+
|                                 App Client                                        |
|  +-----------------------------------------------------------------------------+  |
|  |                            Auth Flow Routing                                |  |
|  |  LoginPage (/login) <----> AuthProgress <----> AppHome (/app) | Onboarding  |  |
|  +-----------------------------------------------------------------------------+  |
|         |                                 |                             |         |
|         v                                 v                             v         |
|  +----------------+              +------------------+         +----------------+  |
|  | Google Popup   |              | Email / Password |         |  Profile Cat   |  |
|  | + Fallback     |              | Signup & Login   |         |  PersonaDrawer |  |
|  +----------------+              +------------------+         +----------------+  |
+-----------------------------------------------------------------------------------+
          |                                 |                             |
          +---------------------------------+-----------------------------+
                                            |
                                            v
              +-----------------------------------------------------------+
              |                Firebase Auth & Security                   |
              | - COOP: same-origin-allow-popups                          |
              | - CSP: frame-src & connect-src whitelisted                |
              | - New Device Uncached Trigger -> Auto Verification Email  |
              | - Password Reset / Change Email / Account Deletion        |
              +-----------------------------------------------------------+
```

---

## 2. Core Modules & Frozen Files

| File | Purpose & Behavior | Status |
| :--- | :--- | :---: |
| [`app/login/page.tsx`](file:///Users/mac/personakit/app/login/page.tsx) | Dual auth flow (Google popup with auto-redirect fallback, Email/Pass login & registration, Password reset modal, error classification). | **FROZEN** |
| [`components/app/AuthProgress.tsx`](file:///Users/mac/personakit/components/app/AuthProgress.tsx) | Unified loading screen with progress percentage, gradient track, and shimmer animation. | **FROZEN** |
| [`components/app/PersonaDrawer.tsx`](file:///Users/mac/personakit/components/app/PersonaDrawer.tsx) | Account & Security management: Email verification trigger, Password reset email, Email address change (`verifyBeforeUpdateEmail`), Logout, and Account deletion (`deleteUser` + Firestore cleanup). | **FROZEN** |
| [`components/app/AppShell.tsx`](file:///Users/mac/personakit/components/app/AppShell.tsx) | Global layout, unverified email alert banner with one-click resend, and new device auth check. | **FROZEN** |
| [`lib/firebase.ts`](file:///Users/mac/personakit/lib/firebase.ts) | Firebase initialization, auth client, Google provider, and `handleNewDeviceAuth` device cache detection logic. | **FROZEN** |
| [`next.config.mjs`](file:///Users/mac/personakit/next.config.mjs) | Security headers: `Cross-Origin-Opener-Policy: same-origin-allow-popups`, CSP rules (`frame-src`, `connect-src`, `img-src`, `script-src`). | **FROZEN** |
| [`app/globals.css`](file:///Users/mac/personakit/app/globals.css) | Styles for `.auth-*`, `.auth-progress-*`, `.email-verify-*`, `.badge-*`, `.btn-danger`. | **FROZEN** |

---

## 3. Key Feature Specifications

### 3.1 Google Sign-In with Loop Prevention & Fallback
- **Popup Flow**: `signInWithPopup(auth, googleProvider)`.
- **COOP Fix**: `Cross-Origin-Opener-Policy: same-origin-allow-popups` prevents window opener disconnections.
- **CSP Alignment**: `frame-src` allows Firebase auth iframes (`pclick-9f190.firebaseapp.com` and `accounts.google.com`).
- **Redirect Catch**: `getRedirectResult(auth)` inside `useEffect` captures redirect credentials if popup is blocked or redirect is triggered.
- **Graceful Cancellation**: `auth/popup-closed-by-user` and `auth/cancelled-popup-request` do not cause crash or infinite loops.

### 3.2 New Device Login & Email Verification
- **Device Cache Detection**: Checks `localStorage.getItem("personakit_device_<uid>")`.
- **Auto Verification Email**: If uncached device is detected and user is unverified, `sendEmailVerification(user)` is automatically fired.
- **Device Log**: Stores `lastDeviceLoginAt` and `deviceSession` in Firestore `users/<uid>`.

### 3.3 Self-Service Account Management (Profile Drawer)
- **Password Reset**: `sendPasswordResetEmail(auth, user.email)`.
- **Email Change**: `verifyBeforeUpdateEmail(user, newEmail)` with password re-authentication (`reauthenticateWithCredential`).
- **Sign Out**: `signOut(auth)` with route transition to `/login`.
- **Account Deletion**: Full re-authentication, document cleanup `deleteDoc(doc(db, "users", uid))`, and auth account removal `deleteUser(user)`.

---

## 4. Verification & Testing
- **Turbopack Build Check**: Passed (`next build` 100% clean).
- **TypeScript Static Analysis**: Zero type errors.
- **State Transitions**: Tested for signup, signin, password reset, email change, and deletion flows.
