import express from "express";
import { createServer } from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { evaluateCombatResponse } from "./services/combatInstructor.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WEBHOOK_URL = "https://yearin22.app.n8n.cloud/webhook/website-signup-welcome";
const DATA_FILE = path.resolve(process.cwd(), "registrations.json");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";
const FISH_AUDIO_API_KEY = process.env.FISH_AUDIO_API_KEY || "sk-fish-oq1iAA2dgpzujvT1NENOi33tmyAWBXnaOzr4guWFzzU";

interface WebhookPayload {
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

interface RegistrationRecord {
  email: string;
  ip: string;
  deviceId?: string;
  name: string;
  createdAt: string;
}

// In-memory sets for fast lookups
const registeredEmails = new Set<string>();
const registeredIps = new Set<string>();
const registeredDevices = new Set<string>();

// Load existing registrations from disk
function loadRegistrations() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const records: RegistrationRecord[] = JSON.parse(raw);
      if (Array.isArray(records)) {
        for (const record of records) {
          if (record.email) registeredEmails.add(record.email.toLowerCase().trim());
          if (record.ip && record.ip !== "127.0.0.1" && record.ip !== "::1") {
            registeredIps.add(record.ip.trim());
          }
          if (record.deviceId) registeredDevices.add(record.deviceId.trim());
        }
        console.log(
          `[Registration Store] Loaded ${records.length} registrations (${registeredEmails.size} emails, ${registeredIps.size} IPs, ${registeredDevices.size} devices)`
        );
      }
    }
  } catch (err) {
    console.warn("[Registration Store] Error loading data file:", err);
  }
}

function saveRegistration(record: RegistrationRecord) {
  try {
    let records: RegistrationRecord[] = [];
    if (fs.existsSync(DATA_FILE)) {
      try {
        const raw = fs.readFileSync(DATA_FILE, "utf-8");
        records = JSON.parse(raw) || [];
      } catch {}
    }
    records.push(record);
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), "utf-8");
  } catch (err) {
    console.error("[Registration Store] Failed to save record:", err);
  }
}

loadRegistrations();

function getClientIp(req: express.Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
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

  app.set("trust proxy", true);
  app.use(express.json());

  // Check if current device, IP, or email has already submitted
  app.get("/api/check-submission", (req, res) => {
    const clientIp = getClientIp(req);
    const deviceId = req.query.deviceId ? String(req.query.deviceId).trim() : "";
    const email = req.query.email ? String(req.query.email).trim().toLowerCase() : "";
    const isLoopback = clientIp === "127.0.0.1" || clientIp === "::1" || clientIp === "unknown";

    const isTestAccount =
      email === "huongnoiichuche@gmail.com" ||
      email.endsWith("@example.com") ||
      email.includes("test");

    if (isTestAccount) {
      return res.json({
        alreadySubmitted: false,
        reason: null,
      });
    }

    const ipRegistered = !isLoopback && registeredIps.has(clientIp);
    const deviceRegistered = Boolean(deviceId && registeredDevices.has(deviceId));
    const emailRegistered = Boolean(email && registeredEmails.has(email));

    const alreadySubmitted = ipRegistered || deviceRegistered || emailRegistered;
    const reason = emailRegistered ? "email" : deviceRegistered ? "device" : ipRegistered ? "ip" : null;

    res.json({
      alreadySubmitted,
      reason,
    });
  });

  // Server-side webhook proxy endpoint with strict rate limits:
  // 1 email = 1 registration, 1 IP = 1 registration, 1 device = 1 registration
  app.post(["/api/signup-webhook", "/api/apply"], async (req, res) => {
    try {
      const { name, email, budget, context, device_id, interest, situation, goal, booking_link } = req.body || {};
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const formattedEmail = String(email).trim().toLowerCase();
      const formattedName = String(name || "").trim() || formattedEmail.split("@")[0] || "Member";
      const clientIp = getClientIp(req);
      const cleanDeviceId = String(device_id || req.headers["x-device-id"] || "").trim();
      const isLoopback = clientIp === "127.0.0.1" || clientIp === "::1" || clientIp === "unknown";

      const isTestAccount =
        formattedEmail === "huongnoiichuche@gmail.com" ||
        formattedEmail.endsWith("@example.com") ||
        formattedEmail.includes("test");

      // 1. Device limit check
      if (!isTestAccount && cleanDeviceId && registeredDevices.has(cleanDeviceId)) {
        console.warn(`[Registration Blocked] Device already registered: ${cleanDeviceId} (${formattedEmail})`);
        return res.status(409).json({
          success: false,
          error: "An application has already been submitted from this device.",
        });
      }

      // 2. IP limit check (production IPs)
      if (!isTestAccount && !isLoopback && registeredIps.has(clientIp)) {
        console.warn(`[Registration Blocked] IP already registered: ${clientIp} (${formattedEmail})`);
        return res.status(409).json({
          success: false,
          error: "An application has already been submitted from this IP address.",
        });
      }

      // 3. Email limit check
      if (!isTestAccount && registeredEmails.has(formattedEmail)) {
        console.warn(`[Registration Blocked] Email already registered: ${formattedEmail}`);
        return res.status(409).json({
          success: false,
          error: "This email address has already been registered.",
        });
      }

      const payload: WebhookPayload = {
        name: formattedName,
        email: formattedEmail,
      };

      if (budget && String(budget).trim()) payload.budget = String(budget).trim();
      if (context && String(context).trim()) payload.context = String(context).trim();
      if (cleanDeviceId) payload.device_id = cleanDeviceId;
      if (interest && String(interest).trim()) payload.interest = String(interest).trim();
      if (situation && String(situation).trim()) payload.situation = String(situation).trim();
      if (goal && String(goal).trim()) payload.goal = String(goal).trim();
      if (booking_link && String(booking_link).trim()) payload.booking_link = String(booking_link).trim();

      // Fire to n8n webhook with timeout & max 1 retry
      const result = await forwardToWebhook(payload);

      if (result.success) {
        if (!isTestAccount) {
          // Record registration in memory and on disk only for non-test accounts
          registeredEmails.add(formattedEmail);
          if (!isLoopback) registeredIps.add(clientIp);
          if (cleanDeviceId) registeredDevices.add(cleanDeviceId);

          saveRegistration({
            email: formattedEmail,
            ip: clientIp,
            deviceId: cleanDeviceId || undefined,
            name: formattedName,
            createdAt: new Date().toISOString(),
          });
        }

        console.log(`[Registration Successful] Dispatched for ${formattedEmail} (IP: ${clientIp}, Device: ${cleanDeviceId || "n/a"}, Test: ${isTestAccount})`);

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

  // Gemini 3.5 Flash Healthcheck and Verification Endpoint
  app.get("/api/gemini/test", async (_req, res) => {
    try {
      const pingRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "ping" }] }],
          }),
        }
      );

      if (pingRes.ok) {
        return res.status(200).json({
          success: true,
          httpCode: 200,
          model: GEMINI_MODEL,
          liveModel: "gemini-2.5-flash-native-audio-latest",
          message: "Gemini 3.5 Flash connection verified successfully",
        });
      } else {
        const errText = await pingRes.text();
        return res.status(pingRes.status).json({
          success: false,
          httpCode: pingRes.status,
          error: errText,
        });
      }
    } catch (err: any) {
      console.error("[Gemini Test Error]:", err);
      return res.status(500).json({
        success: false,
        error: err?.message || "Failed to reach Gemini API",
      });
    }
  });

  // Gemini Live WebRTC / WebSocket Session Config Endpoint
  app.get("/api/gemini/live-config", async (_req, res) => {
    try {
      return res.json({
        success: true,
        model: GEMINI_MODEL,
        liveModel: "gemini-2.5-flash-native-audio-latest",
        endpoint: "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent",
        apiKey: GEMINI_API_KEY,
      });
    } catch (err: any) {
      console.error("[Gemini Live Config Error]:", err);
      return res.status(500).json({ error: err?.message });
    }
  });

  // Combat Instructor Evaluation Route
  app.post("/api/tutor/analyze", async (req, res) => {
    try {
      const result = await evaluateCombatResponse(req.body);
      return res.json(result);
    } catch (err: any) {
      console.error("[Combat Analysis Error]:", err);
      return res.status(500).json({ error: err?.message || "Analysis failed" });
    }
  });

  // Audio Transcription Route (STT powered by Gemini 3.5 Flash)
  app.post("/api/tutor/transcribe", express.raw({ type: "*/*", limit: "25mb" }), async (req, res) => {
    try {
      const buffer = req.body;
      if (!buffer || (Buffer.isBuffer(buffer) && buffer.length === 0)) {
        return res.json({ transcript: "" });
      }

      const rawBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
      const base64Audio = rawBuffer.toString("base64");
      const contentType = String(req.headers["content-type"] || "audio/webm").split(";")[0].trim();

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      mimeType: contentType || "audio/webm",
                      data: base64Audio,
                    },
                  },
                  {
                    text: "Transcribe the spoken words in this audio verbatim. Return ONLY the transcribed words with zero preamble, quotes, or commentary.",
                  },
                ],
              },
            ],
          }),
        }
      );

      if (geminiRes.ok) {
        const data = await geminiRes.json();
        const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join(" ") || "";
        return res.json({ transcript: text.trim() });
      }

      return res.json({ transcript: "" });
    } catch (err: any) {
      console.warn("[Gemini Transcribe Error]:", err);
      return res.json({ transcript: "" });
    }
  });

  // TTS Voice Synthesis Route (Fish Audio with resilient fallback)
  app.post("/api/tutor/tts", async (req, res) => {
    try {
      const { text } = req.body || {};
      if (!text || !String(text).trim()) {
        return res.status(400).json({ error: "Text is required" });
      }

      const fishRes = await fetch("https://api.fish.audio/v1/tts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${FISH_AUDIO_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: String(text).trim(),
          format: "mp3",
        }),
      });

      if (fishRes.ok) {
        const audioBuffer = await fishRes.arrayBuffer();
        res.setHeader("Content-Type", "audio/mpeg");
        return res.send(Buffer.from(audioBuffer));
      } else {
        const errText = await fishRes.text().catch(() => "");
        console.warn(`[Fish Audio Notice] Status ${fishRes.status}: ${errText}`);
        return res.status(502).json({ fallback: true, message: "Fish Audio credits unavailable" });
      }
    } catch (err: any) {
      console.warn("[TTS Route Notice]:", err?.message);
      return res.status(502).json({ fallback: true, error: err?.message });
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
