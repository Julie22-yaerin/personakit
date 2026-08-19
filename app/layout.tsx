import type { Metadata } from "next";
import { CookieBanner } from "../components/app/CookieBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: "PERSONA — Founder Persona Intelligence",
  description: "Your persona is not a document. Measure, test, and improve the identity behind your content.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
