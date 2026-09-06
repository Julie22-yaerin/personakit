import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";

function vitePluginSignupWebhook(): Plugin {
  return {
    name: "signup-webhook-proxy",
    configureServer(server: ViteDevServer) {
      const devEmails = new Set<string>();
      const devDevices = new Set<string>();
      const devIps = new Set<string>();

      server.middlewares.use("/api/check-submission", (req, res) => {
        const url = new URL(req.url || "", "http://localhost");
        const deviceId = url.searchParams.get("deviceId") || "";
        const email = (url.searchParams.get("email") || "").toLowerCase().trim();
        const alreadySubmitted = Boolean((deviceId && devDevices.has(deviceId)) || (email && devEmails.has(email)));
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          alreadySubmitted,
          reason: email && devEmails.has(email) ? "email" : deviceId && devDevices.has(deviceId) ? "device" : null,
        }));
      });

      server.middlewares.use("/api/signup-webhook", async (req, res) => {
        if (req.method !== "POST") {
          res.writeHead(405);
          res.end();
          return;
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });

        req.on("end", async () => {
          try {
            const parsed = JSON.parse(body || "{}");
            const { name, email, budget, context, device_id, interest, situation, goal, booking_link } = parsed;
            const cleanEmail = String(email || "").trim().toLowerCase();
            const cleanName = String(name || "").trim() || cleanEmail.split("@")[0] || "Member";
            const cleanDeviceId = String(device_id || "").trim();

            if (cleanDeviceId && devDevices.has(cleanDeviceId)) {
              res.writeHead(409, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: false, error: "An application has already been submitted from this device." }));
              return;
            }

            if (cleanEmail && devEmails.has(cleanEmail)) {
              res.writeHead(409, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: false, error: "This email address has already been registered." }));
              return;
            }

            const payload: Record<string, string> = {
              name: cleanName,
              email: cleanEmail,
            };

            if (budget && String(budget).trim()) payload.budget = String(budget).trim();
            if (context && String(context).trim()) payload.context = String(context).trim();
            if (cleanDeviceId) payload.device_id = cleanDeviceId;
            if (interest && String(interest).trim()) payload.interest = String(interest).trim();
            if (situation && String(situation).trim()) payload.situation = String(situation).trim();
            if (goal && String(goal).trim()) payload.goal = String(goal).trim();
            if (booking_link && String(booking_link).trim()) payload.booking_link = String(booking_link).trim();

            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 5000);

            const n8nRes = await fetch("https://yearin22.app.n8n.cloud/webhook/website-signup-welcome", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
              signal: controller.signal,
            });
            clearTimeout(timer);

            if (n8nRes.ok) {
              if (cleanEmail) devEmails.add(cleanEmail);
              if (cleanDeviceId) devDevices.add(cleanDeviceId);
            }

            res.writeHead(n8nRes.ok ? 200 : n8nRes.status, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: n8nRes.ok, webhookStatus: n8nRes.status }));
          } catch (e: any) {
            res.writeHead(502, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e?.message || e) }));
          }
        });
      });
    },
  };
}

const plugins = [react(), tailwindcss(), vitePluginSignupWebhook()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    strictPort: false, // Will find next available port if 3000 is busy
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
