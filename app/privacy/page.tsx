import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "../../components/landing/Logo";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What PERSONA collects, what it stores, and what it never does with your data.",
};

const SECTIONS: Array<{ heading: string; body: string[] }> = [
  {
    heading: "1. What we collect",
    body: [
      "Account basics: an email address, provided by your Google sign-in, used only to identify your account.",
      "The content you deliberately give the system: onboarding interview answers, a facial-expression scan summary (blendshape scores — never the photo itself), scripts and posts you submit for analysis, distribution numbers you log manually, and the content roadmap the AI crafts for you.",
    ],
  },
  {
    heading: "2. What we never do",
    body: [
      "We never sell your data. We never share it with advertisers. We never use your content to train our own models.",
      "Photos captured during face verification are processed in-memory for verification and expression scoring; the frame itself is not persisted.",
    ],
  },
  {
    heading: "3. Third-party processors",
    body: [
      "Authentication runs on Google Firebase. Hosting runs on Vercel. AI analysis (persona synthesis, plan crafting, coaching) is sent to large-language-model providers (Qwen, NVIDIA-hosted models, Anthropic, OpenRouter) strictly to fulfill the feature you invoked. Each provider processes your text under its own security terms; no provider output is used to train their base models on our behalf.",
    ],
  },
  {
    heading: "4. Your controls",
    body: [
      "You can edit or remove confirmed identity attributes at any time from your Profile. Deleting your account deletes your stored persona, plans, and logs.",
      "Because there is no social-platform API integration, nothing about your accounts on TikTok, Instagram, YouTube, LinkedIn or X is read automatically — performance numbers exist only if you enter them yourself.",
    ],
  },
  {
    heading: "5. Contact",
    body: [
      "Questions about this policy: reach out through the app's support channel or the repository contact.",
      "This policy may be updated as features change; material changes will be reflected by the date at the top of this page.",
    ],
  },
];

export default function PrivacyPage() {
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
        <h1>Privacy Policy</h1>
        <p className="legal-intro">
          PERSONA works only with what you deliberately give it — your answers, your content,
          your numbers. This page explains exactly what that means.
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
          <Link href="/terms" className="btn btn-ghost">
            Read the Terms →
          </Link>
        </div>
      </article>
    </main>
  );
}
