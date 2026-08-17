import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Lyceum",
  description: "The AI workspace every investor asked for and nobody will remember.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
