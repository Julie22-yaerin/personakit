"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles, LayoutGrid, Camera } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { AnimationBackground } from "@/components/ui/bloim-animation-background";

export default function WelcomePage() {
  return (
    <>
      <AnimationBackground />
      <div className="min-h-screen flex flex-col justify-between text-white relative z-10 font-sans">
        {/* Navigation */}
        <header className="p-nav">
          <div className="p-nav-inner">
            <Link href="/" style={{ textDecoration: "none" }}>
              <Logo />
            </Link>
            <Link href="/studio" className="p-btn p-btn-primary p-btn-sm">
              Open Studio
            </Link>
          </div>
        </header>

        {/* Center Card */}
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="p-card max-w-xl w-full text-center p-8 sm:p-12 bg-slate-900/90 border border-cyan-500/40 rounded-2xl shadow-2xl backdrop-blur-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 size={32} className="text-emerald-400" />
            </div>

            <div className="p-hero-badge-pill mx-auto mb-4">
              <Sparkles size={13} color="#00f0ff" />
              <span>COMMAND CENTER ACTIVATED</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
              You&apos;re ready to film.
            </h1>
            <p className="text-base text-slate-300 mb-8 leading-relaxed">
              Your subscription is active. Your authentic founder voice model is calibrated and ready to turn ideas into structured single-shot takes.
            </p>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-8 text-left">
              <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm mb-1.5">
                <Camera size={16} />
                <span>Live Studio HUD</span>
              </div>
              <p className="text-xs text-slate-300">
                Record with real-time CV framing, smile matching, and auto-cut.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/studio" className="p-btn p-btn-primary">
                Launch My First Shoot <ArrowRight size={15} />
              </Link>
              <Link href="/identity" className="p-btn p-btn-ghost">
                Recalibrate Persona
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 text-center text-xs text-slate-500 border-t border-white/5">
          PERSONAKIT COMMAND CENTER · CONTINUOUS FOUNDER DISTRIBUTION
        </footer>
      </div>
    </>
  );
}
