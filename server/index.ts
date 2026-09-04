import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WEBHOOK_URL = "https://yearin22.app.n8n.cloud/webhook/website-signup-welcome";

async function forwardToWebhook(
  name: string,
  email: string,
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
      body: JSON.stringify({
        name,
        email,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    console.log(`[Webhook Server] Dispatched to n8n for ${email}: HTTP ${response.status}`);
    return { success: response.ok, status: response.status };
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn(`[Webhook Server] Attempt ${attempt} failed for ${email}:`, err?.message || err);

    if (attempt < 2) {
      console.log(`[Webhook Server] Retrying once for ${email}...`);
      return forwardToWebhook(name, email, attempt + 1);
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
      const { name, email } = req.body || {};
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const formattedEmail = String(email).trim().toLowerCase();
      const formattedName = String(name || "").trim() || formattedEmail.split("@")[0] || "Member";

      // Fire to n8n webhook with timeout & max 1 retry
      const result = await forwardToWebhook(formattedName, formattedEmail);

      // Never block or fail the signup response
      return res.status(200).json({
        success: true,
        webhookStatus: result.status,
      });
    } catch (err: any) {
      console.error("[Webhook Server Error]:", err);
      // Catch errors, log them, and continue
      return res.status(200).json({
        success: true,
        error: err?.message || "Webhook dispatch logged",
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
