"use client";

import React from "react";
import Link from "next/link";
import PricingSection from "@/components/ui/pricing-section";
import { Logo } from "@/components/landing/Logo";
import "@/app/persona-landing.css";

export default function PricingPage() {
  return (
    <div className="p-page min-h-screen flex flex-col justify-between">
      {/* Navigation */}
      <nav className="p-nav">
        <div className="p-nav-inner">
          <Link href="/" style={{ textDecoration: "none" }}>
            <Logo />
          </Link>
          <div className="p-nav-links">
            <Link href="/">Home</Link>
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

      {/* Standalone Pricing Main Section */}
      <main style={{ paddingTop: 80, paddingBottom: 60 }}>
        <PricingSection />
      </main>

      {/* Footer */}
      <footer className="p-footer">
        <div className="p-wrap">
          <div className="p-footer-top">
            <Logo size={24} />
            <div className="p-footer-links">
              <Link href="/">Home</Link>
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
  );
}
