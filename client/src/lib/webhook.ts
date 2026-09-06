/**
 * Signup Webhook Integration
 * Endpoint: https://yearin22.app.n8n.cloud/webhook/website-signup-welcome
 * Method: POST
 * Body: { "name": string, "email": string, "budget"?: string, "context"?: string, "device_id"?: string }
 *
 * Strict Deduplication: 1 email = 1 registration, 1 IP = 1 registration, 1 device = 1 registration.
 */

export interface SignupPayload {
  name: string;
  email: string;
  budget?: string;
  context?: string;
  device_id?: string;
  interest?: string;
  situation?: string;
  goal?: string;
  booking_link?: string;
}

export interface WebhookResult {
  success: boolean;
  status?: number;
  error?: string;
}

const WEBHOOK_DIRECT_URL = "https://yearin22.app.n8n.cloud/webhook/website-signup-welcome";
export const STORAGE_KEY_PENDING_PAYLOAD = "pending_applicant_payload";

export async function triggerSignupWebhook(
  rawInput: string | SignupPayload | null | undefined,
  rawEmail?: string | null | undefined,
  extra?: Partial<SignupPayload>
): Promise<WebhookResult> {
  let payloadData: SignupPayload;

  if (typeof rawInput === "object" && rawInput !== null) {
    payloadData = { ...rawInput };
  } else {
    payloadData = {
      name: String(rawInput || "").trim(),
      email: String(rawEmail || "").trim(),
      ...extra,
    };
  }

  const cleanEmail = (payloadData.email || "").trim().toLowerCase();
  if (!cleanEmail) {
    console.warn("[Webhook] Cannot trigger without email.");
    return { success: false, error: "Email is required" };
  }

  // Get name from input or fallback to localStorage / email prefix
  let cleanName = (payloadData.name || "").trim();
  if (!cleanName && typeof window !== "undefined") {
    cleanName = (window.localStorage.getItem("pending_applicant_name") || "").trim();
  }
  if (!cleanName) {
    cleanName = cleanEmail.split("@")[0] || "Member";
  }

// Build payload with only defined, non-empty snake_case fields
  const bodyObject: Record<string, string> = {
    name: cleanName,
    email: cleanEmail,
  };

  if (payloadData.device_id && payloadData.device_id.trim()) {
    bodyObject.device_id = payloadData.device_id.trim();
  } else if (typeof window !== "undefined") {
    const storedDeviceId = window.localStorage.getItem("lyceum_device_id");
    if (storedDeviceId) {
      bodyObject.device_id = storedDeviceId.trim();
    }
  }

  if (payloadData.budget && payloadData.budget.trim()) {
    bodyObject.budget = payloadData.budget.trim();
  }
  if (payloadData.interest && payloadData.interest.trim()) {
    bodyObject.interest = payloadData.interest.trim();
  }
  if (payloadData.context && payloadData.context.trim()) {
    bodyObject.context = payloadData.context.trim();
  }
  if (payloadData.situation && payloadData.situation.trim()) {
    bodyObject.situation = payloadData.situation.trim();
  }
  if (payloadData.goal && payloadData.goal.trim()) {
    bodyObject.goal = payloadData.goal.trim();
  }
  if (payloadData.booking_link && payloadData.booking_link.trim()) {
    bodyObject.booking_link = payloadData.booking_link.trim();
  }

  // Save to localStorage for applicant persistence
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY_PENDING_PAYLOAD, JSON.stringify(bodyObject));
      window.localStorage.setItem("pending_applicant_name", cleanName);
    } catch {
      // Ignore localStorage errors
    }
  }

  // Debounce rapid duplicate triggers (within 3 seconds)
  const storageKey = `webhook_sent_${cleanEmail}`;
  if (typeof window !== "undefined") {
    const lastSentStr = window.localStorage.getItem(storageKey);
    if (lastSentStr) {
      const lastSentTime = parseInt(lastSentStr, 10);
      if (!isNaN(lastSentTime) && Date.now() - lastSentTime < 3000) {
        console.log(`[Webhook] Duplicate trigger within 3s for ${cleanEmail}. Skipping rapid duplicate.`);
        return { success: true, status: 200 };
      }
    }
  }

  const payload = JSON.stringify(bodyObject);
  console.log(`[Webhook] Triggering signup webhook for ${cleanEmail} (${cleanName}):`, bodyObject);

  // Helper to send request with 5s timeout and at most 1 retry on network error
  async function sendWithTimeoutAndRetry(
    url: string,
    attempt = 1
  ): Promise<{ ok: boolean; status?: number; error?: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: payload,
        keepalive: true,
        signal: controller.signal,
      });
      clearTimeout(timer);

      console.log(`[Webhook] Sent to ${url} (status ${response.status})`);
      // Requirement: Treat 2xx as success
      return { ok: response.ok, status: response.status };
    } catch (err: any) {
      clearTimeout(timer);
      console.warn(`[Webhook] Error calling ${url} (attempt ${attempt}):`, err?.message || err);

      if (attempt < 2) {
        console.log(`[Webhook] Retrying once for ${cleanEmail}...`);
        return sendWithTimeoutAndRetry(url, attempt + 1);
      }
      return { ok: false, error: err?.message || String(err) };
    }
  }

  try {
    let result: { ok: boolean; status?: number; error?: string } = { ok: false };

    // 1. Try server-side endpoint first (handles rate limiting and 1-per-email/IP/device enforcement)
    try {
      const serverRes = await fetch("/api/signup-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-device-id": bodyObject.device_id || "",
        },
        body: payload,
        keepalive: true,
      });

      const json = await serverRes.json().catch(() => ({}));

      if (serverRes.ok) {
        result = { ok: true, status: json.webhookStatus || serverRes.status };
      } else {
        // IMPORTANT: If server rejected with 409 Conflict (duplicate email, IP, or device),
        // or 400 (bad request), DO NOT fall back to direct webhook! Abort immediately with server error.
        if (serverRes.status === 409 || serverRes.status === 400 || serverRes.status === 429) {
          return {
            success: false,
            status: serverRes.status,
            error: json.error || "An application has already been submitted.",
          };
        }
        result = { ok: false, status: serverRes.status, error: json.error || "Server error" };
      }
    } catch (err: any) {
      // Server endpoint unreachable (network failure), fallback to direct webhook
      result = { ok: false, error: err?.message || "Server proxy unavailable" };
    }

    // 2. Direct fallback ONLY if server-side proxy failed due to network/server failure
    if (!result.ok) {
      result = await sendWithTimeoutAndRetry(WEBHOOK_DIRECT_URL);
    }

    if (result.ok) {
      // Mark as sent in localStorage with timestamp
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, String(Date.now()));
      }
      return { success: true, status: result.status || 200 };
    }

    return {
      success: false,
      status: result.status,
      error: result.error || "Webhook dispatch failed",
    };
  } catch (err: any) {
    console.warn("[Webhook] Failure:", err);
    return { success: false, error: err?.message || String(err) };
  }
}
