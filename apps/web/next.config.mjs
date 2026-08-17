/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@personakit/shared-types",
    "@personakit/scoring-engine",
    "@personakit/llm-extraction",
  ],
};

export default nextConfig;
