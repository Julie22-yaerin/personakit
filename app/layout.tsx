import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
