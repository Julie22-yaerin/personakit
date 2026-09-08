# Landing Page & Registration Form Specification (FROZEN v2.0)

> **Status**: FROZEN / PRODUCTION LOCKED  
> **Last Updated**: 2026-09-08  
> **Repository**: `personakit`  
> **Branch**: `main`  
> **Tags**: `landing-v2.0-frozen`, `landing-registration-frozen`  
> **Production Domain**: `https://thelyceum.site`  

---

## 1. Overview & Scope of Freeze

The **Landing Page** and the **Registration Form (Modal)** on the frontend are now completely **FROZEN**. No further modifications or styling adjustments are permitted on these components without explicit instruction from the user.

```
+-----------------------------------------------------------------------------------------+
|                                    LANDING PAGE (FROZEN)                                |
|                                                                                         |
|  - Brand & Navigation: The Lyceum ("Protocol-grade social engineering")                 |
|  - Hero Section: "Master the room. Command the frame."                                  |
|  - Interactive Curriculum Link: /sample (The Cold Simulation Drills)                    |
|  - Call to Action: [Unlock Access] / [Deploy Protocol] triggers Application Modal      |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                              REGISTRATION FORM / MODAL (FROZEN)                         |
|                                                                                         |
|  1. Protocol Access Modal:                                                              |
|     - Name (required string)                                                            |
|     - Email (required valid email)                                                      |
|     - Role / Context ("What is your role, operator?")                                   |
|     - Budget Range ("What would you budget for a 3-month tactical deployment?")         |
|  2. Submission Handling:                                                                |
|     - Primary: POST /api/apply (Express server proxy with 1-email/IP/device limits)     |
|     - Resilient Fallback: Direct POST to n8n webhook if server unreachable              |
|     - Instant Visual Confirmation: "Threat profile logged. Protocol queued."            |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                             PIPELINE & RATE LIMITING BACKEND                            |
|                                                                                         |
|  - Endpoint: POST /api/apply & POST /api/signup-webhook                                 |
|  - Target Webhook: https://yearin22.app.n8n.cloud/webhook/website-signup-welcome        |
|  - Rate Limits: 1 Email = 1 Submission | 1 IP = 1 Submission | 1 Device = 1 Submission |
|  - Testing Exemption: huongnoiichuche@gmail.com bypasses duplicate checks               |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Core Frozen Files

The following files constitute the Landing Page & Registration Form frontend and are **STRICTLY FROZEN**:

| File | Component / Purpose | Freeze Status |
| :--- | :--- | :---: |
| `client/src/pages/Home.tsx` | Entire Landing Page layout, navigation, hero, social proof, and Registration Modal ("Protocol Access"). | 🔒 **LOCKED & FROZEN** |
| `client/index.html` | Page title, meta viewport, font links, and favicon for The Lyceum. | 🔒 **LOCKED & FROZEN** |
| `client/src/lib/webhook.ts` | Client-side webhook helpers and payload schema definitions. | 🔒 **LOCKED & FROZEN** |
| `server/index.ts` | Backend `/api/apply` & `/api/signup-webhook` dispatch and deduplication logic. | 🔒 **LOCKED & FROZEN** |

---

## 3. Webhook Integration Details

- **Production Webhook URL**: `https://yearin22.app.n8n.cloud/webhook/website-signup-welcome`
- **Method**: `POST`
- **Payload Schema**:
  ```json
  {
    "name": "string",
    "email": "string",
    "context": "string",
    "budget": "string (e.g. 'under-500', '500-1000', '1000-2000', '2000-plus')"
  }
  ```
- **Response**: `{"message":"Workflow was started"}` (HTTP 200)

---

## 4. Unfreeze Policy

Any future work on other parts of the application (such as `/sample` interactive tutor cards, voice engines, audio generation, or new curriculum modules) must NOT touch or modify `client/src/pages/Home.tsx` or the registration flow unless the user explicitly commands:
`"rã đông landing page"` or `"unfreeze landing page"`.
