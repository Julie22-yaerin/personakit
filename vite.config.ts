import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";

function vitePluginSignupWebhook(): Plugin {
  return {
    name: "signup-webhook-proxy",
    configureServer(server: ViteDevServer) {
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
            const { name, email, budget, interest, context, situation, goal, booking_link } = parsed;
            const cleanEmail = String(email || "").trim().toLowerCase();
            const cleanName = String(name || "").trim() || cleanEmail.split("@")[0] || "Member";

            const payload: Record<string, string> = {
              name: cleanName,
              email: cleanEmail,
            };

            if (budget && String(budget).trim()) payload.budget = String(budget).trim();
            if (interest && String(interest).trim()) payload.interest = String(interest).trim();
            if (context && String(context).trim()) payload.context = String(context).trim();
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
