import { useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Menu,
  Play,
  Plus,
  SlidersHorizontal,
  X,
} from "lucide-react";

const situations = [
  { label: "PRESSURE", title: "Someone wants an immediate answer.", code: "01" },
  { label: "BOUNDARIES", title: "Someone keeps pushing after you said no.", code: "02" },
  { label: "RELATIONSHIPS", title: "Someone’s warmth becomes inconsistent.", code: "03" },
  { label: "MONEY", title: "Someone anchors the negotiation.", code: "04" },
  { label: "SOCIAL", title: "You enter a room where you know nobody.", code: "05" },
  { label: "CONFLICT", title: "Someone accuses you of something you disagree with.", code: "06" },
  { label: "OPPORTUNITY", title: "Someone creates artificial urgency.", code: "07" },
  { label: "FAMILY", title: "Someone uses emotional pressure.", code: "08" },
];

const methodSteps = [
  ["01", "ACTIVE THREAT", "Start with what actually happened."],
  ["02", "YOUR VERBATIM SCRIPT", "Look at the move you made."],
  ["03", "LEVERAGE", "Measure what it produced."],
  ["04", "COUNTER-MOVE", "See another way through."],
  ["05", "DECODE", "Find the principle underneath."],
  ["06", "TACTICAL PRINCIPLE", "Name what was happening."],
  ["07", "THE DEPLOYMENT", "Make the response precise."],
  ["08", "PRESSURE CHAMBER", "Enter the moment again."],
  ["09", "REDEPLOY", "Change one variable."],
  ["10", "AFTER-ACTION", "Keep what works."],
];

const packs = [
  ["Strategic No", "Protect your time without turning cold."],
  ["Pressure & Emotional Noise", "Stay in choice when the room gets loud."],
  ["Reading Predators", "Recognise the pattern before reacting to it."],
  ["Social Conflict", "Navigate inconsistency, distance, and repair."],
  ["Control the Frame", "Build connection without abandoning your centre."],
];

const metrics = [
  ["Emotional control", 84],
  ["Clarity", 76],
  ["Boundary preservation", 91],
  ["Context awareness", 68],
  ["Unnecessary explanation", 42],
  ["Strategic effectiveness", 72],
];

function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = document.querySelectorAll<HTMLElement>(".reveal");
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && setVisible(true)),
      { threshold: 0.12 },
    );
    node.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`reveal ${visible ? "is-visible" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function SectionTag({ number, children }: { number: string; children: ReactNode }) {
  return (
    <div className="section-tag">
      <span>{number}</span>
      <span>{children}</span>
    </div>
  );
}

function ArrowCta({ children, onClick, light = false }: { children: ReactNode; onClick?: () => void; light?: boolean }) {
  return (
    <button className={`arrow-cta ${light ? "arrow-cta-light" : ""}`} onClick={onClick} type="button">
      <span>{children}</span>
      <ArrowUpRight size={16} strokeWidth={1.5} />
    </button>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [simulationActive, setSimulationActive] = useState(false);
  const [expandedPack, setExpandedPack] = useState<number | null>(null);

  const goTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const openApply = () => {
    setApplyOpen(true);
    setSubmitted(false);
  };

  return (
    <div className="site-shell">
      <div className="grain" aria-hidden="true" />
      <header className="site-nav">
        <a className="wordmark" href="#top" onClick={(event) => { event.preventDefault(); goTo("top"); }} aria-label="The Lyceum home">
          <span className="wordmark-mark">◦</span>
          <span>The Lyceum</span>
        </a>
        <nav className={`desktop-nav ${menuOpen ? "mobile-nav-open" : ""}`} aria-label="Main navigation">
          <button onClick={() => goTo("method")} type="button">Protocol</button>
          <button onClick={() => goTo("experience")} type="button">Simulator</button>
          <button onClick={() => goTo("packs")} type="button">Emergency Kits</button>
          <button onClick={() => goTo("philosophy")} type="button">Doctrine</button>
          <a href="/sample" onClick={() => setMenuOpen(false)}>Sample</a>
        </nav>
        <div className="nav-actions">
          <button className="nav-apply" onClick={openApply} type="button">Unlock <ArrowUpRight size={14} /></button>
          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} type="button">
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero section-dark">
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-copy">
            <Reveal>
              <p className="eyebrow">TACTICAL SELF-DEFENSE <span>— 001</span></p>
              <h1>Stop letting them control<br /><em>the situation.</em></h1>
              <p className="hero-subtitle">Applied dark psychology for pressure, conflict, and power.</p>
              <button className="gold-cta" onClick={openApply} type="button">Unlock the protocol <ArrowUpRight size={18} strokeWidth={1.6} /></button>
            </Reveal>
          </div>
          <div className="hero-aside">
            <Reveal delay={120}>
              <div className="hero-orbit">
                <div className="orbit orbit-one" />
                <div className="orbit orbit-two" />
                <div className="orbit-dot" />
                <div className="orbit-label top-label">OBSERVE</div>
                <div className="orbit-label bottom-label">CHOOSE</div>
              </div>
              <div className="hero-side-note"><span>01</span><span>THE SPACE<br />BETWEEN FEELING<br />AND ACTION</span></div>
            </Reveal>
          </div>
          <div className="hero-foot"><span>THE LYCEUM / 2026</span><span>SCROLL TO BEGIN <ChevronDown size={14} /></span></div>
        </section>

        <section className="manifesto section-beige">
          <div className="manifesto-rail"><span>02</span><span>THE PREMISE</span></div>
          <div className="manifesto-content">
            <Reveal><p className="display-statement">Most people need<br />an exit.</p></Reveal>
            <Reveal delay={90}><p className="display-statement accent-line">Better <em>leverage.</em></p></Reveal>
            <div className="manifesto-lower">
              <p>The threat is social. The response is tactical.</p>
              <div className="situation-list">
                {["Difficult conversation", "Unwanted request", "Sudden change in someone’s behavior", "Pressure", "Uncertainty"].map((item, index) => (
                  <div key={item}><span>0{index + 1}</span>{item}</div>
                ))}
              </div>
              <p className="manifesto-end">This is what we deploy.</p>
            </div>
          </div>
        </section>

        <section className="argument section-dark" id="experience">
          <div className="container argument-layout">
            <div className="argument-head">
              <SectionTag number="03">THE ADVANTAGE</SectionTag>
              <Reveal><h2>Kindness isn’t enough.<br /><em>Recognize it. Neutralize it.</em></h2></Reveal>
            </div>
            <div className="know-do-grid">
              <Reveal className="contrast-column muted-column">
                <span className="column-kicker">KNOW</span>
                <div>Advice</div><div>Labels</div><div>Advice</div>
              </Reveal>
              <Reveal className="contrast-column active-column" delay={120}>
                <span className="column-kicker">DO</span>
                <div>Read <span>↗</span></div><div>Frame <span>↗</span></div><div>Counter <span>↗</span></div><div>Execute <span>↗</span></div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="method section-beige" id="method">
          <div className="container">
            <div className="section-heading-row">
              <SectionTag number="04">THE PROTOCOL</SectionTag>
              <Reveal><h2 className="dark-heading">You don’t study<br />the threat.<br /><em>You enter prepared.</em></h2></Reveal>
              <p className="heading-aside">A protocol that turns pressure into control.</p>
            </div>
            <div className="method-track">
              {methodSteps.map(([number, title, description], index) => (
                <Reveal key={number} delay={Math.min(index * 35, 280)} className="method-step">
                  <span className="step-number">{number}</span>
                  <span className="step-line" />
                  <span className="step-title">{title}</span>
                  <span className="step-description">{description}</span>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="situations section-sky">
          <div className="container">
            <div className="situations-intro">
              <SectionTag number="05">ACTIVE THREATS</SectionTag>
              <Reveal><h2>Where pressure<br /><em>becomes leverage.</em></h2></Reveal>
              <p>No theory. Just the moments that leave a mark.</p>
            </div>
            <div className="situations-grid">
              {situations.map((situation, index) => (
                <Reveal key={situation.label} delay={Math.min(index * 45, 280)} className="situation-card">
                  <div className="situation-card-top"><span>{situation.code}</span><span>{situation.label}</span></div>
                  <h3>{situation.title}</h3>
                  <ArrowUpRight className="card-arrow" size={18} strokeWidth={1.2} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="detachment section-navy">
          <div className="detachment-grid" aria-hidden="true"><span /><span /><span /><span /><span /><span /></div>
          <div className="container detachment-inner">
            <SectionTag number="06">TACTICAL DETACHMENT</SectionTag>
            <Reveal><h2>Feel the pressure.<br /><em>Keep the advantage.</em></h2></Reveal>
            <p>Emotion is data.<br />Choice is control.</p>
            <div className="detachment-mark"><Activity size={16} /><span>ABILITY TO CHOOSE / PRESERVED</span></div>
          </div>
        </section>

        <section className="practice section-beige">
          <div className="container practice-layout">
            <div>
              <SectionTag number="07">EXECUTION</SectionTag>
              <Reveal><h2 className="dark-heading">Information is cheap.<br /><em>Execution is power.</em></h2></Reveal>
            </div>
            <div className="practice-table">
              {[["LESS THEORY", "MORE EXECUTION"], ["LESS MEMORY", "MORE RECOGNITION"], ["LESS PASSIVE INPUT", "MORE COMBAT TRAINING"]].map(([less, more], index) => (
                <Reveal className="practice-row" key={less} delay={index * 80}>
                  <span>{less}</span><ArrowRight size={16} /><strong>{more}</strong>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="simulation section-dark">
          <div className="container simulation-layout">
            <div className="simulation-copy">
              <SectionTag number="08">S2S COMBAT SIMULATOR</SectionTag>
              <Reveal><h2>Pressure-test your words<br /><em>before they need to work.</em></h2></Reveal>
              <p>Deploy the response. Watch the pressure break.</p>
              <button className="text-link" onClick={() => setSimulationActive(!simulationActive)} type="button">
                <span>{simulationActive ? "Reset chamber" : "Enter the pressure chamber"}</span><Play size={13} fill="currentColor" />
              </button>
            </div>
            <Reveal className="simulation-window" delay={120}>
              <div className="window-bar"><span><i /> LIVE PRESSURE CHAMBER</span><span>THREAT / 04</span></div>
              <div className="sim-block"><small>THE THREAT</small><p>“I need an answer right now.”</p></div>
              <div className="sim-block response-block"><small>YOUR VERBATIM SCRIPT</small><div className={`response-field ${simulationActive ? "active" : ""}`}>{simulationActive ? "I want to give you a considered answer. I’ll come back to you by tomorrow." : "Write the words that stop it…"}<span>↗</span></div></div>
              <div className="sim-result"><div><small>EXECUTION READINESS</small><strong>{simulationActive ? "86" : "72"}<sup>%</sup></strong></div><div className="result-note"><small>WHAT YOU MISSED</small><p>{simulationActive ? "You denied them the deadline." : "The pressure was the weapon."}</p></div></div>
              <div className="window-footer"><span>POWERED BY TACTICAL AI</span><span>◒</span></div>
            </Reveal>
          </div>
        </section>

        <section className="diagnostic section-beige">
          <div className="container diagnostic-layout">
            <div className="diagnostic-copy">
              <SectionTag number="09">EXECUTION READINESS</SectionTag>
              <Reveal><h2 className="dark-heading">A score for the<br /><em>move, not the operator.</em></h2></Reveal>
              <p>Measures whether your move served the objective.</p>
              <div className="score-legend"><SlidersHorizontal size={16} /><span>Six vectors / one tactical read</span></div>
            </div>
            <Reveal className="metrics-card" delay={100}>
              <div className="metrics-header"><span>RESPONSE DIAGNOSTIC</span><span>SESSION 001</span></div>
              {metrics.map(([label, score]) => (
                <div className="metric-row" key={label as string}><div><span>{label}</span><b>{score}</b></div><div className="metric-bar"><i style={{ width: `${score}%` }} /></div></div>
              ))}
              <div className="metrics-footer"><span>STRATEGIC LEVERAGE</span><strong>72<span>%</span></strong></div>
            </Reveal>
          </div>
        </section>

        <section className="packs section-sky" id="packs">
          <div className="container packs-layout">
            <div className="packs-intro">
              <SectionTag number="10">PACKS</SectionTag>
              <Reveal><h2>Choose your<br />emergency kit.</h2></Reveal>
              <p>Role → kit → protocol → deployment.</p>
            </div>
            <div className="packs-list">
              <div className="pack-feature"><span>OPERATOR KIT</span><strong>37 tactical protocols</strong><ArrowUpRight size={17} /></div>
              {packs.map(([name, description], index) => (
                <div className={`pack-item ${expandedPack === index ? "open" : ""}`} key={name}>
                  <button onClick={() => setExpandedPack(expandedPack === index ? null : index)} type="button" aria-expanded={expandedPack === index}>
                    <span>{name}</span>{expandedPack === index ? <X size={16} /> : <Plus size={16} />}
                  </button>
                  <div className="pack-description">{description}</div>
                </div>
              ))}
              <button className="browse-link" onClick={openApply} type="button">Access the emergency kit <ArrowUpRight size={15} /></button>
            </div>
          </div>
        </section>

        <section className="access section-dark" id="access">
          <div className="container access-layout">
            <div className="access-copy">
              <SectionTag number="11">OPERATOR ACCESS</SectionTag>
              <Reveal><p className="access-kicker">PROTOCOL ACCESS</p><h2>One protocol.<br />Three months.<br /><em>Combat-ready.</em></h2></Reveal>
            </div>
            <div className="access-card">
              <div className="price"><span>$</span>249</div>
              <p className="price-note">Immediate access to the protocol.</p>
              <ul>
                {["Personalized action plan", "Applied dark psychology protocols", "S2S combat simulator", "Verbatim script deployment", "Execution readiness diagnostics", "Progressive tactical releases"].map((item) => <li key={item}><Check size={14} />{item}</li>)}
              </ul>
              <button className="primary-cta" onClick={openApply} type="button">Unlock the protocol <ArrowUpRight size={16} /></button>
              <p className="fine-print">Applications are reviewed for fit.</p>
            </div>
          </div>
        </section>

        <section className="philosophy section-beige" id="philosophy">
          <div className="container philosophy-layout">
            <div><SectionTag number="12">THE DOCTRINE</SectionTag><p className="philosophy-label">THE IDEA BEHIND THE PROTOCOL</p></div>
            <Reveal className="philosophy-copy"><h2>Kindness stops<br />where leverage<br /><em>begins.</em></h2><p>Predators do not follow the textbook.</p><p>This protocol was built for that gap.</p></Reveal>
          </div>
        </section>

        <section className="final-manifesto section-sky">
          <div className="container final-layout">
            <div className="final-index"><span>13</span><span>FINAL MANIFESTO</span></div>
            <Reveal><p>You can’t control every threat.</p><p>Control <em>what you read.</em></p><p>Control <em>what you deploy.</em></p><p>Become harder to destabilize.</p><h2>Self-defense,<br /><em>deployed.</em></h2><ArrowCta onClick={openApply}>Unlock the protocol</ArrowCta></Reveal>
          </div>
        </section>
      </main>

      <footer className="site-footer section-dark">
        <div className="container footer-top"><div className="footer-brand"><a className="wordmark" href="#top" onClick={(event) => { event.preventDefault(); goTo("top"); }}><span className="wordmark-mark">◦</span><span>The Lyceum</span></a><p>Applied dark psychology. Deployed.</p></div><div className="footer-nav"><div><span>Navigate</span><button onClick={() => goTo("method")} type="button">Protocol</button><button onClick={() => goTo("experience")} type="button">Simulator</button><button onClick={() => goTo("packs")} type="button">Emergency Kits</button><button onClick={() => goTo("philosophy")} type="button">Philosophy</button></div><div><span>Elsewhere</span><a href="#privacy">Privacy</a><a href="#terms">Terms</a><a href="mailto:hello@thelyceum.studio">Contact</a></div></div></div>
        <div className="container footer-bottom"><span>© 2026 The Lyceum</span><span>READ THE ROOM. CONTROL THE MOVE.</span><span>BUILT FOR THE THREAT.</span></div>
      </footer>

      {applyOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={(event) => event.target === event.currentTarget && setApplyOpen(false)}
        >
          <div className="apply-modal" role="dialog" aria-modal="true" aria-labelledby="apply-title">
            <button
              className="modal-close"
              onClick={() => setApplyOpen(false)}
              aria-label="Close application"
              type="button"
            >
              <X size={18} />
            </button>
            {submitted ? (
              <div className="submitted-state">
                <div className="submitted-icon">
                  <Check size={22} />
                </div>
                <p className="eyebrow">APPLICATION RECEIVED</p>
                <h2>Threat profile logged.</h2>
                <p>Protocol queued.</p>
                <button className="primary-cta" onClick={() => setApplyOpen(false)} type="button">
                  Return to The Lyceum <ArrowUpRight size={16} />
                </button>
              </div>
            ) : (
              <>
                <p className="eyebrow">PROTOCOL ACCESS</p>
                <h2 id="apply-title">
                  Stop the bleed.<br />
                  <em>Deploy the protocol.</em>
                </h2>
                <p className="modal-intro">Tell us where the pressure is.</p>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formEl = event.currentTarget;
                    const formData = new FormData(formEl);
                    const payload = {
                      name: String(formData.get("name") || "").trim(),
                      email: String(formData.get("email") || "").trim(),
                      context: String(formData.get("context") || "").trim(),
                      budget: String(formData.get("budget") || "").trim(),
                    };
                    fetch("/api/apply", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    }).catch(() => {});
                    setSubmitted(true);
                  }}
                >
                  <label>
                    Name
                    <input required name="name" placeholder="Your name" />
                  </label>
                  <label>
                    Email
                    <input required name="email" type="email" placeholder="you@example.com" />
                  </label>
                  <label>
                    What is your role, operator?
                    <textarea
                      required
                      name="context"
                      rows={3}
                      placeholder="Founder, designer, manager, operator…"
                    />
                  </label>
                  <label>
                    What would you budget for a 3-month tactical deployment?
                    <select required name="budget" defaultValue="">
                      <option value="" disabled>
                        Select a range
                      </option>
                      <option value="under-500">Under $500</option>
                      <option value="500-1000">$500 — $1,000</option>
                      <option value="1000-2000">$1,000 — $2,000</option>
                      <option value="2000-plus">$2,000+</option>
                    </select>
                  </label>
                  <button className="primary-cta" type="submit">
                    Unlock the protocol <ArrowUpRight size={16} />
                  </button>
                </form>
                <p className="fine-print">No pressure. Just deployment.</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
