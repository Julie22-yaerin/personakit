import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "PersonaKit — Persona Intelligence Console",
  description: "Measure persona, script features, and consistency — not opinions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="console-shell">
          <header className="console-header">
            <span className="console-brand">PersonaKit</span>
            <nav className="console-nav">
              <Link href="/">Pipeline</Link>
              <Link href="/creator-model">Creator Model</Link>
              <Link href="/content-lab">Content Lab</Link>
              <Link href="/experiment">Experiment</Link>
            </nav>
          </header>
          <main className="console-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
