/**
 * Signup Webhook Integration
 * Endpoint: https://yearin22.app.n8n.cloud/webhook/website-signup-welcome
 * Method: POST
 * Body: { "name": string, "email": string }
 *
 * Triggered ONLY AFTER user verifies their email via Firebase email link.
 */

const WEBHOOK_DIRECT_URL = "https://yearin22.app.n8n.cloud/webhook/website-signup-welcome";

export async function triggerSignupWebhook(
  rawName: string | null | undefined,
  rawEmail: string | null | undefined
): Promise<boolean> {
  const cleanEmail = (rawEmail || "").trim().toLowerCase();
  if (!cleanEmail) {
    console.warn("[Webhook] Cannot trigger without email.");
    return false;
  }

  // Get name from argument or fallback to localStorage / email prefix
  let cleanName = (rawName || "").trim();
  if (!cleanName && typeof window !== "undefined") {
    cleanName = (window.localStorage.getItem("pending_applicant_name") || "").trim();
  }
  if (!cleanName) {
    cleanName = cleanEmail.split("@")[0] || "Member";
  }

  // Debounce rapid duplicate triggers (within 5 seconds)
  const storageKey = `webhook_sent_${cleanEmail}`;
  if (typeof window !== "undefined") {
    const lastSentStr = window.localStorage.getItem(storageKey);
    if (lastSentStr) {
      const lastSentTime = parseInt(lastSentStr, 10);
      if (!isNaN(lastSentTime) && Date.now() - lastSentTime < 5000) {
        console.log(`[Webhook] Duplicate trigger within 5s for ${cleanEmail}. Skipping duplicate.`);
        return true;
      }
    }
  }

  const payload = JSON.stringify({
    name: cleanName,
    email: cleanEmail,
  });

  console.log(`[Webhook] Triggering signup webhook for ${cleanEmail} (${cleanName})...`);

  // Helper to send request with 5s timeout and at most 1 retry on network error
  async function sendWithTimeoutAndRetry(url: string, attempt = 1): Promise<boolean> {
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
      return response.ok || response.status < 500;
    } catch (err: any) {
      clearTimeout(timer);
      console.warn(`[Webhook] Error calling ${url} (attempt ${attempt}):`, err?.message || err);

      if (attempt < 2) {
        console.log(`[Webhook] Retrying once for ${cleanEmail}...`);
        return sendWithTimeoutAndRetry(url, attempt + 1);
      }
      return false;
    }
  }

  try {
    let sent = false;

    // 1. Try server-side endpoint first (avoid CORS and keep webhook URL server-side)
    try {
      const serverRes = await fetch("/api/signup-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: payload,
        keepalive: true,
      });
      if (serverRes.ok) {
        sent = true;
      }
    } catch {
      // Server endpoint not reachable, fallback to direct webhook
    }

    // 2. Direct fallback (with keepalive / timeout / 1 retry)
    if (!sent) {
      sent = await sendWithTimeoutAndRetry(WEBHOOK_DIRECT_URL);
    }

    // Mark as sent in localStorage with timestamp
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, String(Date.now()));
    }

    return true;
  } catch (err) {
    // Requirement 1: Catch errors, log, and continue without blocking
    console.warn("[Webhook] Non-blocking failure:", err);
    return false;
  }
}
