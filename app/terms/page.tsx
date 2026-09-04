import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The ground rules for using PERSONA — what the service provides and what it doesn't promise.",
  alternates: { canonical: "/terms" },
};

const SECTIONS: Array<{ heading: string; body: string[] }> = [
  {
    heading: "1. The service",
    body: [
      "PERSONA analyzes the identity signals in your content — personality, tone, authority, warmth, contrarianism and more — connects them to the performance numbers you provide, and helps you produce content through plans, scripts and live coaching.",
      "You get the features described in the product interface. Nothing here is medical, psychological, financial or legal advice.",
    ],
  },
  {
    heading: "2. Estimates, not guarantees",
    body: [
      "Persona scores, predictions and recommendations are model estimates. Social platforms are probabilistic systems — no specific reach, engagement or growth outcome is promised.",
      "Predicted metrics are hypotheses to test against reality, not commitments.",
    ],
  },
  {
    heading: "3. Your responsibilities",
    body: [
      "You own what you publish. Don't use PERSONA to produce deceptive, unlawful or infringing content, and don't feed it other people's personal data without their permission.",
      "Company red lines you configure are enforced as guidance inside the product's AI features; final editorial judgment remains yours.",
    ],
  },
  {
    heading: "4. Content ownership",
    body: [
      "Your content — interviews, scripts, videos, numbers, roadmaps — stays yours. You grant PERSONA a limited license to process it solely to operate the features you use.",
    ],
  },
  {
    heading: "5. Availability & termination",
    body: [
      "The service is provided as-is, without warranties. We may change or discontinue features; you may stop using the service at any time and request deletion of your account data.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="legal-page">
      <header className="p-nav">
        <div className="p-nav-inner">
          <Link href="/" style={{ textDecoration: "none" }}>
            <Logo />
          </Link>
          <div className="p-nav-actions">
            <Link href="/login" className="p-btn p-btn-primary p-btn-sm">
              Build your persona
            </Link>
          </div>
        </div>
      </header>

      <article className="legal-article">
        <p className="onboarding-step-label">Legal · last updated August 2026</p>
        <h1>Terms of Service</h1>
        <p className="legal-intro">
          The short version: estimates are estimates, your content is yours, and the system
          exists to make you recognizable — not to promise you fame.
        </p>
        {SECTIONS.map((s) => (
          <section key={s.heading}>
            <h2>{s.heading}</h2>
            {s.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </section>
        ))}
        <div className="notfound-actions" style={{ marginTop: 40 }}>
          <Link href="/" className="btn btn-primary">
            Back to home
          </Link>
          <Link href="/privacy" className="btn btn-ghost">
            Read the Privacy Policy →
          </Link>
        </div>
      </article>
    </main>
  );
}
