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
  ["01", "REAL SITUATION", "Start with what actually happened."],
  ["02", "YOUR RESPONSE", "Look at the move you made."],
  ["03", "EFFECTIVENESS", "Measure what it produced."],
  ["04", "HIGH-SKILL RESPONSE", "See another way through."],
  ["05", "REVERSE ENGINEER", "Find the principle underneath."],
  ["06", "MICRO-PRINCIPLE", "Name what was happening."],
  ["07", "THE MOVE", "Make the response precise."],
  ["08", "SIMULATION", "Enter the moment again."],
  ["09", "RETRY", "Change one variable."],
  ["10", "REFLECTION", "Keep what works."],
];

const packs = [
  ["Strategic No", "Protect your time without turning cold."],
  ["Pressure & Emotional Noise", "Stay in choice when the room gets loud."],
  ["Reading People", "Recognise the pattern before reacting to it."],
  ["Relationship Hard Situations", "Navigate inconsistency, distance, and repair."],
  ["Starting Attachments", "Build connection without abandoning your centre."],
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
          <button onClick={() => goTo("method")} type="button">Method</button>
          <button onClick={() => goTo("experience")} type="button">Experience</button>
          <button onClick={() => goTo("packs")} type="button">Packs</button>
          <button onClick={() => goTo("philosophy")} type="button">Philosophy</button>
        </nav>
        <div className="nav-actions">
          <button className="nav-apply" onClick={openApply} type="button">Apply <ArrowUpRight size={14} /></button>
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
              <p className="eyebrow">PRACTICAL PSYCHOLOGY <span>— 001</span></p>
              <h1>Think clearly<br /><em>when emotions are loud.</em></h1>
              <p className="hero-subtitle">Psychology for unscripted moments.</p>
              <button className="gold-cta" onClick={openApply} type="button">Get on the list <ArrowUpRight size={18} strokeWidth={1.6} /></button>
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
            <Reveal><p className="display-statement">Most people need less information.</p></Reveal>
            <Reveal delay={90}><p className="display-statement accent-line">Better <em>responses.</em></p></Reveal>
            <div className="manifesto-lower">
              <p>Real situations are fast, social, and personal.</p>
              <div className="situation-list">
                {["Difficult conversation", "Unwanted request", "Sudden change in someone’s behavior", "Pressure", "Uncertainty"].map((item, index) => (
                  <div key={item}><span>0{index + 1}</span>{item}</div>
                ))}
              </div>
              <p className="manifesto-end">This is what we train.</p>
            </div>
          </div>
        </section>

        <section className="argument section-dark" id="experience">
          <div className="container argument-layout">
            <div className="argument-head">
              <SectionTag number="03">THE ARGUMENT</SectionTag>
              <Reveal><h2>Knowing isn’t enough.<br /><em>Recognize it. Respond.</em></h2></Reveal>
            </div>
            <div className="know-do-grid">
              <Reveal className="contrast-column muted-column">
                <span className="column-kicker">KNOW</span>
                <div>Concepts</div><div>Definitions</div><div>Theory</div>
              </Reveal>
              <Reveal className="contrast-column active-column" delay={120}>
                <span className="column-kicker">DO</span>
                <div>Notice <span>↗</span></div><div>Respond <span>↗</span></div><div>Adapt <span>↗</span></div><div>Practice <span>↗</span></div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="method section-beige" id="method">
          <div className="container">
            <div className="section-heading-row">
              <SectionTag number="04">THE METHOD</SectionTag>
              <Reveal><h2 className="dark-heading">You don’t study<br />the situation.<br /><em>You enter it.</em></h2></Reveal>
              <p className="heading-aside">A loop that turns friction into skill.</p>
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
              <SectionTag number="05">REAL SITUATIONS</SectionTag>
              <Reveal><h2>Where the work<br /><em>actually happens.</em></h2></Reveal>
              <p>No theory. Just the moments that decide what happens next.</p>
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
            <SectionTag number="06">STRATEGIC DETACHMENT</SectionTag>
            <Reveal><h2>Feel it.<br /><em>Don’t let it decide.</em></h2></Reveal>
            <p>The goal isn’t to become emotionless.<br />It is to keep your ability to choose when emotion is present.</p>
            <div className="detachment-mark"><Activity size={16} /><span>ABILITY TO CHOOSE / PRESERVED</span></div>
          </div>
        </section>

        <section className="practice section-beige">
          <div className="container practice-layout">
            <div>
              <SectionTag number="07">PRACTICE</SectionTag>
              <Reveal><h2 className="dark-heading">Information is cheap.<br /><em>Response is a skill.</em></h2></Reveal>
            </div>
            <div className="practice-table">
              {[["LESS THEORY", "MORE PRACTICE"], ["LESS MEMORIZATION", "MORE RECOGNITION"], ["LESS PASSIVE LEARNING", "MORE RESPONSE TRAINING"]].map(([less, more], index) => (
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
              <SectionTag number="08">AI SIMULATION</SectionTag>
              <Reveal><h2>Practice before<br />the moment <em>arrives.</em></h2></Reveal>
              <p>Test the move. Notice what changes. Try again.</p>
              <button className="text-link" onClick={() => setSimulationActive(!simulationActive)} type="button">
                <span>{simulationActive ? "Reset simulation" : "Run the simulation"}</span><Play size={13} fill="currentColor" />
              </button>
            </div>
            <Reveal className="simulation-window" delay={120}>
              <div className="window-bar"><span><i /> LIVE SIMULATION</span><span>SCENARIO / 04</span></div>
              <div className="sim-block"><small>THE SITUATION</small><p>“I need an answer right now.”</p></div>
              <div className="sim-block response-block"><small>YOUR RESPONSE</small><div className={`response-field ${simulationActive ? "active" : ""}`}>{simulationActive ? "I want to give you a considered answer. I’ll come back to you by tomorrow." : "Write what you would say…"}<span>↗</span></div></div>
              <div className="sim-result"><div><small>STRATEGIC EFFECTIVENESS</small><strong>{simulationActive ? "86" : "72"}<sup>%</sup></strong></div><div className="result-note"><small>WHAT YOU MISSED</small><p>{simulationActive ? "You made the time boundary explicit." : "The pressure was part of the situation."}</p></div></div>
              <div className="window-footer"><span>POWERED BY PRACTICE</span><span>◒</span></div>
            </Reveal>
          </div>
        </section>

        <section className="diagnostic section-beige">
          <div className="container diagnostic-layout">
            <div className="diagnostic-copy">
              <SectionTag number="09">DIAGNOSTIC SCORE</SectionTag>
              <Reveal><h2 className="dark-heading">A score for the<br /><em>response, not the person.</em></h2></Reveal>
              <p>A score for the response—not the person.</p>
              <div className="score-legend"><SlidersHorizontal size={16} /><span>Six dimensions / one live picture</span></div>
            </div>
            <Reveal className="metrics-card" delay={100}>
              <div className="metrics-header"><span>RESPONSE DIAGNOSTIC</span><span>SESSION 001</span></div>
              {metrics.map(([label, score]) => (
                <div className="metric-row" key={label as string}><div><span>{label}</span><b>{score}</b></div><div className="metric-bar"><i style={{ width: `${score}%` }} /></div></div>
              ))}
              <div className="metrics-footer"><span>STRATEGIC EFFECTIVENESS</span><strong>72<span>%</span></strong></div>
            </Reveal>
          </div>
        </section>

        <section className="packs section-sky" id="packs">
          <div className="container packs-layout">
            <div className="packs-intro">
              <SectionTag number="10">PACKS</SectionTag>
              <Reveal><h2>Choose a point<br />of entry.</h2></Reveal>
              <p>Role → pack → lesson → practice.</p>
            </div>
            <div className="packs-list">
              <div className="pack-feature"><span>ESSENTIAL</span><strong>37 micro-lessons</strong><ArrowUpRight size={17} /></div>
              {packs.map(([name, description], index) => (
                <div className={`pack-item ${expandedPack === index ? "open" : ""}`} key={name}>
                  <button onClick={() => setExpandedPack(expandedPack === index ? null : index)} type="button" aria-expanded={expandedPack === index}>
                    <span>{name}</span>{expandedPack === index ? <X size={16} /> : <Plus size={16} />}
                  </button>
                  <div className="pack-description">{description}</div>
                </div>
              ))}
              <button className="browse-link" onClick={openApply} type="button">See what’s inside <ArrowUpRight size={15} /></button>
            </div>
          </div>
        </section>

        <section className="access section-dark" id="access">
          <div className="container access-layout">
            <div className="access-copy">
              <SectionTag number="11">ACCESS</SectionTag>
              <Reveal><p className="access-kicker">FOUNDING MEMBERSHIP</p><h2>Four months<br />of guided<br /><em>psychological training.</em></h2></Reveal>
            </div>
            <div className="access-card">
              <div className="price"><span>$</span>249</div>
              <p className="price-note">One complete training experience.</p>
              <ul>
                {["Personalized learning path", "Practical psychology curriculum", "AI simulations", "Speech practice", "Progress diagnostics", "Progressive training releases"].map((item) => <li key={item}><Check size={14} />{item}</li>)}
              </ul>
              <button className="primary-cta" onClick={openApply} type="button">Apply for access <ArrowUpRight size={16} /></button>
              <p className="fine-print">Applications are reviewed for fit.</p>
            </div>
          </div>
        </section>

        <section className="philosophy section-beige" id="philosophy">
          <div className="container philosophy-layout">
            <div><SectionTag number="12">PHILOSOPHY</SectionTag><p className="philosophy-label">THE IDEA BEHIND THE METHOD</p></div>
            <Reveal className="philosophy-copy"><h2>Most education stops<br />when you understand<br />the concept.</h2><p>Real life begins when someone responds differently than the textbook predicted.</p><p>This method was built around that gap.</p></Reveal>
          </div>
        </section>

        <section className="final-manifesto section-sky">
          <div className="container final-layout">
            <div className="final-index"><span>13</span><span>FINAL MANIFESTO</span></div>
            <Reveal><p>You can’t control every situation.</p><p>Control <em>what you notice.</em></p><p>Control <em>what you choose.</em></p><p>Become harder to destabilize.</p><h2>Psychology,<br /><em>practiced.</em></h2><ArrowCta onClick={openApply}>Apply for access</ArrowCta></Reveal>
          </div>
        </section>
      </main>

      <footer className="site-footer section-dark">
        <div className="container footer-top"><div className="footer-brand"><a className="wordmark" href="#top" onClick={(event) => { event.preventDefault(); goTo("top"); }}><span className="wordmark-mark">◦</span><span>The Lyceum</span></a><p>Applied psychology. Practiced.</p></div><div className="footer-nav"><div><span>Explore</span><button onClick={() => goTo("method")} type="button">Method</button><button onClick={() => goTo("experience")} type="button">Experience</button><button onClick={() => goTo("packs")} type="button">Packs</button><button onClick={() => goTo("philosophy")} type="button">Philosophy</button></div><div><span>Elsewhere</span><a href="#privacy">Privacy</a><a href="#terms">Terms</a><a href="mailto:hello@thelyceum.studio">Contact</a></div></div></div>
        <div className="container footer-bottom"><span>© 2026 The Lyceum</span><span>FEEL IT. DON’T LET IT DECIDE.</span><span>BUILT FOR THE MOMENT.</span></div>
      </footer>

      {applyOpen && <div className="modal-backdrop" role="presentation" onClick={(event) => event.target === event.currentTarget && setApplyOpen(false)}><div className="apply-modal" role="dialog" aria-modal="true" aria-labelledby="apply-title"><button className="modal-close" onClick={() => setApplyOpen(false)} aria-label="Close application" type="button"><X size={18} /></button>{submitted ? <div className="submitted-state"><div className="submitted-icon"><Check size={22} /></div><p className="eyebrow">APPLICATION RECEIVED</p><h2>Interest noted.</h2><p>We’ll be in touch.</p><button className="primary-cta" onClick={() => setApplyOpen(false)} type="button">Return to The Lyceum <ArrowUpRight size={16} /></button></div> : <><p className="eyebrow">FOUNDING MEMBERSHIP</p><h2 id="apply-title">Start with a<br /><em>considered yes.</em></h2><p className="modal-intro">Tell us where you want more control.</p><form onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}><label>Name<input required name="name" placeholder="Your name" /></label><label>Email<input required name="email" type="email" placeholder="you@example.com" /></label><label>What is your role?<textarea required name="context" rows={3} placeholder="Founder, designer, manager, student…" /></label><label>What would you budget for a 3-month customized program?<select required name="budget"><option value="" disabled>Select a range</option><option value="under-500">Under $500</option><option value="500-1000">$500 — $1,000</option><option value="1000-2000">$1,000 — $2,000</option><option value="2000-plus">$2,000+</option></select></label><button className="primary-cta" type="submit">Apply for access <ArrowUpRight size={16} /></button></form><p className="fine-print">No pressure. Just intent.</p></>}</div></div>}
    </div>
  );
}
