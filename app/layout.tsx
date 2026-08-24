import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://thelyceum.site"),
  title: {
    default: "PERSONA — Founder Persona Intelligence",
    template: "%s · PERSONA",
  },
  description: "Your persona is not a document. Measure, test, and improve the identity behind your content.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
