"use client";

import React from "react";
import { Geist, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "../components/landing/Logo";
import { Typewriter } from "@/components/ui/typewriter-text";
import { FooterWordmark } from "../components/landing/TextMotion";
import { CookieConsent } from "../components/landing/CookieConsent";
import { FeedbackWidget } from "../components/landing/FeedbackWidget";
import { PageTracker } from "../components/landing/PageTracker";
import "./persona-landing.css";

const grotesk = Geist({ subsets: ["latin"], variable: "--font-grotesk" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-mono" });

export default function LandingPage() {
  return (
    <>
      <div className={`p-page min-h-screen flex flex-col justify-between ${grotesk.variable} ${mono.variable}`}>
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

        {/* Hero: Only the Typewriter text & Get a Shoot CTA without extra clutter */}
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "140px 20px 80px",
            minHeight: "75vh",
          }}
        >
          <div className="p-wrap" style={{ maxWidth: 840, margin: "0 auto" }}>
            <div className="p-hero-badge-pill" style={{ marginBottom: 24, display: "inline-flex" }}>
              <span className="hud-indicator-dot" style={{ width: 7, height: 7, background: "#00f0ff", boxShadow: "0 0 8px #00f0ff" }} />
              <span style={{ letterSpacing: "0.08em", fontWeight: 700 }}>THE CONTENT COMMAND CENTER</span>
            </div>

            <h1
              className="p-hero-title"
              style={{
                fontSize: "clamp(38px, 6vw, 78px)",
                fontWeight: 800,
                lineHeight: 1.15,
                marginBottom: 24,
                textAlign: "center",
              }}
            >
              You already know what to say. <br />
              <Typewriter
                text="Now make filming stupidly easy."
                speed={50}
                loop={false}
                className="bg-gradient-to-r from-[#00e5ff] via-[#38bdf8] to-[#818cf8] bg-clip-text text-transparent inline-block"
              />
            </h1>

            <p
              className="p-hero-sub"
              style={{
                fontSize: "clamp(16px, 2vw, 20px)",
                maxWidth: 620,
                margin: "0 auto 36px",
                textAlign: "center",
                lineHeight: 1.6,
                color: "var(--p-text-secondary)",
              }}
            >
              Turn your ideas into a personalized filming plan, then turn that plan into simple shots you can actually record in minutes.
            </p>

            <div className="p-hero-ctas" style={{ justifyContent: "center", gap: 14 }}>
              <Link
                href="/login"
                className="p-btn p-btn-primary"
                style={{
                  padding: "14px 34px",
                  fontSize: 16,
                  fontWeight: 700,
                  borderRadius: 14,
                  boxShadow: "0 0 30px rgba(0, 240, 255, 0.4)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>Get a Shoot</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/pricing"
                className="p-btn p-btn-ghost"
                style={{
                  padding: "14px 28px",
                  fontSize: 16,
                  borderRadius: 14,
                }}
              >
                View Pricing
              </Link>
            </div>
          </div>
        </main>

        {/* Giant Footer Wordmark PERSONA (Position kept as customary) */}
        <div className="p-wordmark-band" aria-hidden>
          <FooterWordmark text="PERSONA" />
          <div className="p-wordmark-arch" />
        </div>

        {/* Footer */}
        <footer className="p-footer" style={{ borderTop: "1px solid var(--p-border)", background: "#03040a" }}>
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
