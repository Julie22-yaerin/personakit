import React from "react";
import { Geist, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { Logo } from "../components/landing/Logo";
import { HeroScrollContainer } from "../components/landing/ScrollHero";
import { CookieConsent } from "../components/landing/CookieConsent";
import { FeedbackWidget } from "../components/landing/FeedbackWidget";
import { PageTracker } from "../components/landing/PageTracker";
import "./persona-landing.css";

const grotesk = Geist({ subsets: ["latin"], variable: "--font-grotesk" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-mono" });

export default function LandingPage() {
  return (
    <>
      <div className={`p-page ${grotesk.variable} ${mono.variable}`}>
        {/* Navigation */}
        <nav className="p-nav">
          <div className="p-nav-inner">
            <Link href="/" style={{ textDecoration: "none" }}>
              <Logo />
            </Link>
            <div className="p-nav-links">
              <Link href="/pricing">Pricing</Link>
              <Link href="/login">Studio</Link>
            </div>
            <div className="p-nav-actions">
              <Link href="/login" className="p-nav-signin">
                Sign in
              </Link>
              <Link href="/login" className="p-btn p-btn-primary p-btn-sm">
                Get a Shoot
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Scroll Container: Typewriter Headline + Giant PERSONA & Get a Shoot Button on Scroll */}
        <HeroScrollContainer />

        {/* Footer */}
        <footer className="p-footer" style={{ borderTop: "1px solid var(--p-border)", background: "rgba(6, 9, 20, 0.95)" }}>
          <div className="p-wrap">
            <div className="p-footer-top">
              <Logo size={24} />
              <div className="p-footer-links">
                <Link href="/pricing">Pricing</Link>
                <Link href="/login">Studio</Link>
                <Link href="/privacy">Privacy</Link>
                <Link href="/terms">Terms</Link>
              </div>
            </div>
            <div className="p-footer-bottom">
              Built for founders and builders who already know what to say.
            </div>
          </div>
        </footer>
      </div>

      <PageTracker />
      <FeedbackWidget />
      <CookieConsent />
    </>
  );
}
