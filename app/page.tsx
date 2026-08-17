import Link from "next/link";

export default function LandingPage() {
  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="wordmark">
            THE LYCEUM
          </Link>
          <div className="nav-links">
            <a href="#product">Product</a>
            <a href="#pricing">Pricing</a>
            <a href="#proof">Proof</a>
            <Link href="/login" className="btn btn-primary" style={{ padding: "9px 18px" }}>
              Enter
            </Link>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">BYOK · LOCAL-FIRST · ZERO-LATENCY CIRCUIT BREAKER</p>
          <h1>
            We built the AI workspace
            <br />
            every VC asked for.
          </h1>
          <p className="sub">
            Enterprise-grade. Local-first. A circuit breaker that trips before your API bill does.
            Every box on the checklist, checked. You&apos;ll forget we exist by the next
            fundraising cycle, and honestly — same.
          </p>
          <div className="hero-ctas">
            <Link href="/login" className="btn btn-primary">
              Request Access
            </Link>
            <a href="#pricing" className="btn btn-ghost">
              Read the Deck We Won&apos;t Send You
            </a>
          </div>
          <p className="hero-note">no credit card · no sales call · no promises</p>
        </div>
      </section>

      <div className="logo-strip">
        <div className="wrap">
          <p>Trusted by three investors who ghosted us and one who still likes our tweets</p>
          <div className="logo-row">
            <span>Seed &amp; Regret Capital</span>
            <span>Q4 Vibes Ventures</span>
            <span>We&apos;ll Circle Back LP</span>
            <span>Uncle&apos;s Money LLC</span>
          </div>
        </div>
      </div>

      <section id="product">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">The Product</p>
            <h2>Everything a pitch deck promises. Nothing a person asked for.</h2>
            <p>
              We shipped the three features every AI workspace slide claims to have. We are, as
              far as we can tell, indistinguishable from everyone else doing this. That was
              always the plan.
            </p>
          </div>
          <div className="grid-3">
            <div className="card">
              <span className="tag">Feature 01</span>
              <h3>Circuit Breaker (BYOK)</h3>
              <p>
                Bring your own key, and we&apos;ll cut it off the moment it gets interesting.
                Zero-latency, because we measured it once and never again.
              </p>
            </div>
            <div className="card">
              <span className="tag">Feature 02</span>
              <h3>Local-First</h3>
              <p>
                Your data never leaves your machine, mostly because we haven&apos;t finished the
                sync server. Call it a privacy feature. We do.
              </p>
            </div>
            <div className="card">
              <span className="tag">Feature 03</span>
              <h3>Collaborative Workspace</h3>
              <p>
                Real-time collaboration for teams of one, which is the average team size that has
                used this so far.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="stats" id="proof">
        <div className="wrap">
          <div className="stat-row">
            <div>
              <div className="stat-num">$0</div>
              <div className="stat-label">ARR, proudly unbothered</div>
            </div>
            <div>
              <div className="stat-num">14</div>
              <div className="stat-label">pivots before this landing page</div>
            </div>
            <div>
              <div className="stat-num">1</div>
              <div className="stat-label">investor who still texts us, unprompted</div>
            </div>
            <div>
              <div className="stat-num">99.2%</div>
              <div className="stat-label">of visitors who will never come back, and we respect it</div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">What People Are Saying</p>
            <h2>Unsolicited, mostly.</h2>
          </div>
          <div className="quote-grid">
            <div className="quote">
              <p className="text">
                &ldquo;I signed up to see what the fuss was about. There was no fuss. I stayed
                anyway.&rdquo;
              </p>
              <div className="attr">— a person, on a Tuesday</div>
            </div>
            <div className="quote">
              <p className="text">
                &ldquo;It does exactly what it says it does, which is more than I can say for the
                other twelve tabs I have open.&rdquo;
              </p>
              <div className="attr">— someone who did not ask to be quoted</div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Pricing</p>
            <h2>Pick the tier that matches how much you believe in us.</h2>
          </div>
          <div className="price-grid">
            <div className="price-card">
              <div className="price-name">Free</div>
              <div className="price-amount">$0</div>
              <div className="price-caption">For the curious and the cheap. Same thing.</div>
              <ul className="price-features">
                <li>Full product, no strings</li>
                <li>Community support (there is no community)</li>
                <li>Our undying gratitude</li>
              </ul>
              <Link href="/login" className="btn btn-ghost btn-block">
                Start free
              </Link>
            </div>
            <div className="price-card featured">
              <div className="price-name">Pro</div>
              <div className="price-amount">$29/mo</div>
              <div className="price-caption">For people who want an invoice to feel serious.</div>
              <ul className="price-features">
                <li>Everything in Free</li>
                <li>Priority support (we reply eventually)</li>
                <li>A line item you can show your co-founder</li>
              </ul>
              <Link href="/login" className="btn btn-primary btn-block">
                Actually, start here
              </Link>
            </div>
            <div className="price-card">
              <div className="price-name">Enterprise</div>
              <div className="price-amount">Talk to us</div>
              <div className="price-caption">We need the logo for the deck. Please.</div>
              <ul className="price-features">
                <li>Everything in Pro</li>
                <li>A Slack channel we&apos;ll actually watch</li>
                <li>Your name in our next fundraise</li>
              </ul>
              <a href="mailto:hello@thelyceum.app" className="btn btn-ghost btn-block">
                Email us. Really.
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="wrap">
          <h2>Get in before we get acqui-hired into oblivion.</h2>
          <p>Two fields. One click. No onboarding call. We promise, mostly because we can&apos;t afford one.</p>
          <Link href="/login" className="btn btn-primary">
            Request Access
          </Link>
        </div>
      </section>

      <footer>
        <div className="wrap footer-inner">
          <span>© {new Date().getFullYear()} The Lyceum. Built to spec. Forgotten on schedule.</span>
          <span>thelyceum.app</span>
        </div>
      </footer>
    </>
  );
}
