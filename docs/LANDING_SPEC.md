# Landing Page Module Specification (FROZEN v1.0)

> **Status**: FROZEN / PRODUCTION READY  
> **Last Updated**: 2026-09-04  
> **Repository**: `personakit`  
> **Branch**: `main`  
> **Tag**: `landing-v1.0-frozen`

---

## 1. Overview & Architecture

The Landing Page module ("The Lyceum") serves as the primary gateway for PersonaKit. It features a responsive layout, an interactive application modal for membership, Firebase email verification, and an automated n8n webhook notification triggered strictly upon successful email verification.

```
+-----------------------------------------------------------------------------------+
|                                 Landing Page                                      |
|  +-----------------------------------------------------------------------------+  |
|  |               Hero & Value Proposition ("The Lyceum")                       |  |
|  |       [Apply for Membership] button triggers ApplyModal                     |  |
|  +-----------------------------------------------------------------------------+  |
|                                        |                                          |
|                                        v                                          |
|  +-----------------------------------------------------------------------------+  |
|  |                     Application & Email Flow                                |  |
|  | 1. User submits { name, email } in ApplyModal                               |  |
|  | 2. sendVerificationEmail(email, name) sends Firebase Auth link             |  |
|  | 3. Stores pending state in localStorage ("pending_applicant_email/name")      |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
                                         |
                       User clicks verification link in inbox
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                            Verification & Webhook Flow                            |
| 1. useEmailVerification hook detects url params (oobCode / apiKey / mode)         |
| 2. applyActionCode() or signInWithEmailLink() validates token                     |
| 3. Verification status turns "verified"                                           |
| 4. triggerSignupWebhook(name, email) dispatched:                                  |
|    - Endpoint: https://yearin22.app.n8n.cloud/webhook/website-signup-welcome      |
|    - Server-side proxy: /api/signup-webhook (5s timeout, max 1 retry)             |
|    - Client fallback: fetch with keepalive: true                                  |
|    - De-duplication: marked in localStorage ("webhook_sent_<email>")              |
|    - Non-blocking: failures logged, user experience never interrupted             |
+-----------------------------------------------------------------------------------+
```

---

## 2. Core Modules & Frozen Files

| File | Purpose & Behavior | Status |
| :--- | :--- | :---: |
| `client/src/pages/Home.tsx` | Complete landing page layout ("The Lyceum"), features section, membership modal, state handling. | **FROZEN** |
| `client/src/hooks/useEmailVerification.ts` | Hook managing email link auth, verification state listeners, and post-verification webhook dispatch. | **FROZEN** |
| `client/src/lib/webhook.ts` | n8n Webhook integration with server-proxy priority, keepalive fallback, timeout, retry, and deduplication. | **FROZEN** |
| `client/src/lib/firebase.ts` | Firebase initialization (`pclick-9f190`), Google Analytics, and Auth client. | **FROZEN** |
| `server/index.ts` | Express server hosting production static build and `/api/signup-webhook` proxy. | **FROZEN** |
| `vite.config.ts` | Vite configuration with local dev proxy middleware for `/api/signup-webhook`. | **FROZEN** |
| `package.json` | Dependencies locked (`firebase`, `express`, `lucide-react`, `wouter`, etc.). | **FROZEN** |

---

## 3. Key Specifications

### 3.1 Firebase Configuration & Authentication
- **Project ID**: `pclick-9f190`
- **Auth Domain**: `pclick-9f190.firebaseapp.com`
- **Link Verification**: Uses Firebase Action URL handler (`/` redirect URL with parameters `apiKey`, `mode=signIn|verifyEmail`, and `oobCode`).
- **Resend Flow**: User can request a fresh verification link from the UI with automated cooldown.

### 3.2 Webhook Specification
- **URL**: `https://yearin22.app.n8n.cloud/webhook/website-signup-welcome`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Payload Schema**:
  ```json
  {
    "name": "<string, required>",
    "email": "<string, required>",
    "interest": "<string, optional>",
    "context": "<string, optional>",
    "situation": "<string, optional>",
    "goal": "<string, optional>",
    "booking_link": "<string, optional>"
  }
  ```
- **Trigger Rule**: Triggered immediately when visitor submits the application modal ("Apply for access"), and reaffirmed upon Firebase email verification.
- **Resilience**:
  - Non-blocking (never interrupts user UI regardless of webhook HTTP response).
  - 5000ms timeout per attempt.
  - At most 1 retry on network failures.
  - Debounced within 5s to avoid duplicate double-clicks while allowing re-tests.
  - Primary route: Server-side Express `/api/signup-webhook` proxy (shields client from CORS & protects webhook).
  - Fallback route: Direct client-side fetch with `keepalive: true`.

---

## 4. Verification & Testing
- **Production Build**: Verified with `npm run build` (Vite client bundling + esbuild server bundling complete cleanly in < 5s).
- **TypeScript Checking**: Clean, no compiler or bundling errors.
- **Git State**: Clean working tree, tagged `landing-v1.0-frozen`.
