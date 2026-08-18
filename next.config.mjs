/**
 * Security headers applied to every response. Notably absent:
 * Access-Control-Allow-Origin. Next.js API routes don't set CORS headers
 * unless told to, which means browsers already deny cross-origin JS reads
 * of these routes by default same-origin policy — that's the intended
 * lockdown here, not something that needs an extra header to enforce.
 * Adding a permissive CORS header would be the actual regression.
 */
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
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
