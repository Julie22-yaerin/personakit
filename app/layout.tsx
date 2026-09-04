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
    default: "The Lyceum — Psychology, practiced.",
    template: "%s · The Lyceum",
  },
  description:
    "Applied psychology for real human situations. The Lyceum helps you think clearly when emotions are loud.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "The Lyceum",
    title: "The Lyceum — Psychology, practiced.",
    description:
      "Applied psychology for real human situations. The Lyceum helps you think clearly when emotions are loud.",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Lyceum — Psychology, practiced.",
    description:
      "Applied psychology for real human situations. The Lyceum helps you think clearly when emotions are loud.",
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
