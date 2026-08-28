/**
 * Security headers applied to every response. Notably absent:
 * Access-Control-Allow-Origin. Next.js API routes don't set CORS headers
 * unless told to, which means browsers already deny cross-origin JS reads
 * of these routes by default same-origin policy — that's the intended
 * lockdown here, not something that needs an extra header to enforce.
 * Adding a permissive CORS header would be the actual regression.
 */

/**
 * Content-Security-Policy: defense-in-depth against XSS and data injection.
 * - default-src 'self': everything same-origin only
 * - script-src 'self' 'unsafe-inline': inline/eval scripts needed for React hydration
 * - style-src 'self' 'unsafe-inline': Tailwind needs unsafe-inline for <style>
 * - img-src 'self' data: blob: Firebase uses data: URIs for avatars
 * - connect-src: Firebase + AI providers (Anthropic, OpenRouter, NVIDIA, Qwen)
 * - frame-ancestors 'none': same as X-Frame-Options DENY
 * - base-uri 'self': prevents <base> tag injection
 * - form-action 'self': prevents form hijacking
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://apis.google.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://securetoken.google.com https://securetoken.googleapis.com https://www.googleapis.com https://identitytoolkit.googleapis.com https://firestore.googleapis.com https://openrouter.ai/api https://integrate.api.nvidia.com https://dashscope-intl.aliyuncs.com https://generativelanguage.googleapis.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  // HSTS — force HTTPS for this origin and its subdomains for 2 years,
  // including on preload lists. Railway/Vercel already terminate TLS in
  // front of this app, so this only ever strengthens what's already true.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // No page in this app is meant to be framed by another site.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Camera/mic stay available to this origin (onboarding face scan,
  // studio live filming both need them) but denied to any cross-origin
  // iframe.
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
  // CSP — defense-in-depth against XSS
  { key: "Content-Security-Policy", value: CSP },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable source maps in production to prevent source code leakage.
  // If you need debugging, setGENERATE_SOURCEMAP=true locally.
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
