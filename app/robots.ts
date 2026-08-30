import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // App pages sit behind auth — no point indexing them.
      disallow: ["/app", "/studio", "/identity", "/company", "/onboarding", "/api"],
    },
    sitemap: "https://thelyceum.site/sitemap.xml",
  };
}
