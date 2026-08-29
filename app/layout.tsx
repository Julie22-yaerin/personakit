import type { Metadata } from "next";
import { AnimationBackground } from "@/components/ui/bloim-animation-background";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://thelyceum.site"),
  title: {
    default: "PERSONA — Founder Persona Intelligence",
    template: "%s · PERSONA",
  },
  description:
    "Your persona is not a document. Measure, test, and improve the identity behind your content.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "PERSONA",
    title: "PERSONA — Founder Persona Intelligence",
    description:
      "Your persona is not a document. Measure, test, and improve the identity behind your content.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PERSONA — Founder Persona Intelligence",
    description:
      "Your persona is not a document. Measure, test, and improve the identity behind your content.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800;900&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,500&family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AnimationBackground />
        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      </body>
    </html>
  );
}
