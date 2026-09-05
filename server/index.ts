import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WEBHOOK_URL = "https://yearin22.app.n8n.cloud/webhook/website-signup-welcome";

interface WebhookPayload {
  name: string;
  email: string;
  interest?: string;
  context?: string;
  situation?: string;
  goal?: string;
  booking_link?: string;
}

async function forwardToWebhook(
  payload: WebhookPayload,
  attempt = 1
): Promise<{ success: boolean; status?: number; error?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    console.log(`[Webhook Server] Dispatched to n8n for ${payload.email}: HTTP ${response.status}`);
    return { success: response.ok, status: response.status };
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn(`[Webhook Server] Attempt ${attempt} failed for ${payload.email}:`, err?.message || err);

    if (attempt < 2) {
      console.log(`[Webhook Server] Retrying once for ${payload.email}...`);
      return forwardToWebhook(payload, attempt + 1);
    }
    return { success: false, error: err?.message || String(err) };
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json());

  // Server-side webhook proxy endpoint
  app.post("/api/signup-webhook", async (req, res) => {
    try {
      const { name, email, interest, context, situation, goal, booking_link } = req.body || {};
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const formattedEmail = String(email).trim().toLowerCase();
      const formattedName = String(name || "").trim() || formattedEmail.split("@")[0] || "Member";

      const payload: WebhookPayload = {
        name: formattedName,
        email: formattedEmail,
      };

      if (interest && String(interest).trim()) payload.interest = String(interest).trim();
      if (context && String(context).trim()) payload.context = String(context).trim();
      if (situation && String(situation).trim()) payload.situation = String(situation).trim();
      if (goal && String(goal).trim()) payload.goal = String(goal).trim();
      if (booking_link && String(booking_link).trim()) payload.booking_link = String(booking_link).trim();

      // Fire to n8n webhook with timeout & max 1 retry
      const result = await forwardToWebhook(payload);

      if (result.success) {
        return res.status(200).json({
          success: true,
          webhookStatus: result.status,
        });
      } else {
        return res.status(result.status || 502).json({
          success: false,
          error: result.error || "Failed to reach n8n webhook",
          webhookStatus: result.status,
        });
      }
    } catch (err: any) {
      console.error("[Webhook Server Error]:", err);
      return res.status(500).json({
        success: false,
        error: err?.message || "Internal server error during webhook dispatch",
      });
    }
  });

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
