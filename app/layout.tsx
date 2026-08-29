import type { Metadata } from "next";
import { Cinzel, Plus_Jakarta_Sans, Syne, JetBrains_Mono } from "next/font/google";
import { AnimationBackground } from "@/components/ui/bloim-animation-background";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  variable: "--font-cinzel",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

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
    <html
      lang="en"
      className={`${cinzel.variable} ${plusJakartaSans.variable} ${syne.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <AnimationBackground />
        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      </body>
    </html>
  );
}
