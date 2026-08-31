/**
 * 100-Hooks Database for Founder-Led Content & AI Persona Classification.
 * Based on the comprehensive behavioral psychology research in harness/framework/100-hooks-database.md.
 */

export interface HookEntry {
  code: string; // e.g. "#001"
  category: "appearance" | "movement" | "voice" | "word" | "editing" | "rage_bait" | "complex";
  categoryLabel: string;
  stage: "ideation" | "building" | "marketing" | "series_a" | "series_b" | "series_c" | "all_stages";
  stageLabel: string;
  personaTags: string[];
  scenario: string;
  spokenHookExample?: string;
  actionCues: string;
  psychologicalMechanism: string;
  algorithmicImpact: string;
}

export const HOOKS_DATABASE: HookEntry[] = [
  // --- Appearance Hooks ---
  {
    code: "#001",
    category: "appearance",
    categoryLabel: "Appearance & Setting",
    stage: "ideation",
    stageLabel: "Ideation",
    personaTags: ["Obsessive Thinker", "Garage Hacker"],
    scenario: "Messy hair, faded t-shirt, dark under-eye circles under dim desk lighting.",
    spokenHookExample: "I just stayed awake for 48 hours to track down a bug that never should have existed.",
    actionCues: "Dim warm desk lamp, close-up face shot looking tired but intense.",
    psychologicalMechanism: "Hacker archetype conveying extreme cognitive dedication.",
    algorithmicImpact: "Immediate thumbstop due to unpolished raw authenticity.",
  },
  {
    code: "#002",
    category: "appearance",
    categoryLabel: "Appearance & Setting",
    stage: "ideation",
    stageLabel: "Ideation",
    personaTags: ["High Energy Ideator", "Endurance Athlete"],
    scenario: "Sweat-drenched workout clothes, speaking out of breath on a treadmill.",
    spokenHookExample: "The idea for my first million came when I was completely exhausted at mile 10.",
    actionCues: "Wiping sweat with towel while looking directly into camera, heavy breathing.",
    psychologicalMechanism: "Discipline and endorphin rush creating extreme urgency for the idea.",
    algorithmicImpact: "Boosts first 3s hook rate through dynamic energy.",
  },
  {
    code: "#005",
    category: "appearance",
    categoryLabel: "Appearance & Setting",
    stage: "building",
    stageLabel: "Building",
    personaTags: ["Deep Work Specialist", "Tech Savant"],
    scenario: "Blue-light glasses with terminal code reflecting rapidly off lenses in dark room.",
    spokenHookExample: "People think AI code is complicated, but this core snippet is exactly 12 lines.",
    actionCues: "Green terminal code reflecting across glasses, dark ambient room.",
    psychologicalMechanism: "Cyberpunk visual grammar turning the founder into an authoritative data processor.",
    algorithmicImpact: "Attracts technical audience, extending average view duration.",
  },
  {
    code: "#007",
    category: "appearance",
    categoryLabel: "Appearance & Setting",
    stage: "building",
    stageLabel: "Building",
    personaTags: ["Contrarian Provocateur", "Market Rebel"],
    scenario: "Holding a coffee mug with competitor logo crossed out in black permanent marker.",
    spokenHookExample: "Why our competitor's $1B solution is completely useless for you.",
    actionCues: "Turns mug to display crossed-out logo to lens, calmly takes a sip.",
    psychologicalMechanism: "Symbolic visual aggression displaying high-conviction challenger mindset.",
    algorithmicImpact: "Drives brand debate and comment engagement, increasing watch time.",
  },

  // --- Movement & Action Hooks ---
  {
    code: "#015",
    category: "movement",
    categoryLabel: "Movement & Action",
    stage: "building",
    stageLabel: "Building",
    personaTags: ["Contrarian Provocateur", "Direct Operator"],
    scenario: "Tossing a famous bestselling business book into a metal trash can on second one.",
    spokenHookExample: "Throw this book away if you actually want to survive this year.",
    actionCues: "Throws book with an audible thud into metal bin, locks eyes with camera.",
    psychologicalMechanism: "Iconoclasm: the brain is jolted when an authority symbol is discarded.",
    algorithmicImpact: "Spikes 3s hook rate and polarizes comments.",
  },
  {
    code: "#018",
    category: "movement",
    categoryLabel: "Movement & Action",
    stage: "marketing",
    stageLabel: "Marketing",
    personaTags: ["Radical Simplifier", "Speed Builder"],
    scenario: "Tearing a printed 5-year business plan into shreds and tossing pieces into the air.",
    spokenHookExample: "Your 5-year plan was obsolete the second you pressed print.",
    actionCues: "Tears A4 paper in two, throws confetti shreds into camera view.",
    psychologicalMechanism: "Destructive motion creating instant sensory satisfaction.",
    algorithmicImpact: "Keeps viewers waiting for rationale, boosting dwell time.",
  },
  {
    code: "#022",
    category: "movement",
    categoryLabel: "Movement & Action",
    stage: "marketing",
    stageLabel: "Marketing",
    personaTags: ["Data Pragmatist", "Growth Operator"],
    scenario: "Crossing out multiple zeroes on a whiteboard with red marker, turning 1,000,000 into 1.",
    spokenHookExample: "We don't need 1 million vanity users. We only track this single metric.",
    actionCues: "Strikes through zeros on whiteboard, firmly circles the digit 1.",
    psychologicalMechanism: "Elimination movement conveying ruthless simplification.",
    algorithmicImpact: "Visual transformation of numbers drives high save rates.",
  },

  // --- Voice & Sound Hooks ---
  {
    code: "#029",
    category: "voice",
    categoryLabel: "Voice & Tone",
    stage: "all_stages",
    stageLabel: "All Stages",
    personaTags: ["Insider Analyst", "Undercover Operator"],
    scenario: "Whispering closely into a lapel mic, looking around like sharing classified intel.",
    spokenHookExample: "Do not let your boss know about this...",
    actionCues: "Pulls clip mic right to mouth, delivers in a dramatic whisper.",
    psychologicalMechanism: "Forbidden knowledge psychology.",
    algorithmicImpact: "Forces viewers to turn up volume or stop scrolling to hear clearly.",
  },
  {
    code: "#034",
    category: "voice",
    categoryLabel: "Voice & Tone",
    stage: "building",
    stageLabel: "Building",
    personaTags: ["Speed Builder", "Obsessive Thinker"],
    scenario: "Absolute silence for first 3 seconds with rapid mechanical keyboard typing sound.",
    spokenHookExample: "(Silent 3s typing) ...I just automated what our agency charged $5,000 for.",
    actionCues: "Rapid typing on keyboard, suddenly stops and looks straight up into lens.",
    psychologicalMechanism: "Pattern interrupt through sudden acoustic break.",
    algorithmicImpact: "High retention during initial silence leading to punchy spoken drop.",
  },

  // --- Word & Text Hooks ---
  {
    code: "#041",
    category: "word",
    categoryLabel: "Word & Hook Copy",
    stage: "ideation",
    stageLabel: "Ideation",
    personaTags: ["Contrarian Provocateur", "Radical Simplifier"],
    scenario: "Black screen with bold white font: 'Everything you know about PMF is wrong.'",
    spokenHookExample: "Stop looking for Product-Market Fit. Find Problem-Founder Fit first.",
    actionCues: "High-contrast text appears with an audible click before founder cuts in.",
    psychologicalMechanism: "Direct cognitive assault triggering immediate defense/curiosity.",
    algorithmicImpact: "Short text reading time locks in initial view count.",
  },
  {
    code: "#047",
    category: "word",
    categoryLabel: "Word & Hook Copy",
    stage: "marketing",
    stageLabel: "Marketing",
    personaTags: ["Growth Operator", "Data Pragmatist"],
    scenario: "Staring deadpan into camera for 1 second, then delivering a razor-sharp counterintuitive stat.",
    spokenHookExample: "Our highest converting landing page has literally zero images and 42 words.",
    actionCues: "Deadpan look, slight pause, deliver stat with extreme calm.",
    psychologicalMechanism: "Extreme minimalism violating expectations of complex marketing advice.",
    algorithmicImpact: "High share rate among practitioners seeking actionable benchmarks.",
  },

  // --- Editing & Visual Pacing Hooks ---
  {
    code: "#061",
    category: "editing",
    categoryLabel: "Editing & Pacing",
    stage: "marketing",
    stageLabel: "Marketing",
    personaTags: ["Speed Builder", "High Energy Ideator"],
    scenario: "Snap zoom cutting in from wide room shot to extreme close-up of founder's eye in 0.5s.",
    spokenHookExample: "Look closely at this chart before you hire your next engineer.",
    actionCues: "Two-stage snap zoom timed with audio whoosh.",
    psychologicalMechanism: "Optical zoom reflexively grabs visual cortex attention.",
    algorithmicImpact: "Drastically cuts 0–1s drop-off rate.",
  },

  // --- Rage Bait & Contrarian Hooks ---
  {
    code: "#075",
    category: "rage_bait",
    categoryLabel: "Contrarian & Spicy",
    stage: "all_stages",
    stageLabel: "All Stages",
    personaTags: ["Contrarian Provocateur", "Market Rebel"],
    scenario: "Holding an iPhone showing a popular influencer productivity app, then deleting it.",
    spokenHookExample: "Productivity apps are designed to keep you unproductive. Here is the proof.",
    actionCues: "Presses 'Delete App' on camera screen, looks up calmly.",
    psychologicalMechanism: "Debunking mainstream habits triggers strong disagreement and comments.",
    algorithmicImpact: "Spikes comment velocity, causing algorithmic distribution loops.",
  },
  {
    code: "#080",
    category: "rage_bait",
    categoryLabel: "Contrarian & Spicy",
    stage: "series_a",
    stageLabel: "Series A",
    personaTags: ["Bootstrapped Purist", "Direct Operator"],
    scenario: "Writing 'VC Money' on a card, folding it up, and tucking it into back pocket.",
    spokenHookExample: "Raising capital is often just a disguised way to avoid building product.",
    actionCues: "Folds note with slight smirk, taps desk.",
    psychologicalMechanism: "Contrarian status signaling separating builders from pitch artists.",
    algorithmicImpact: "Heavy reposts on founder networks and high quote-share ratios.",
  },

  // --- Multi-modal Complex Hooks ---
  {
    code: "#091",
    category: "complex",
    categoryLabel: "Multi-modal Complex",
    stage: "all_stages",
    stageLabel: "All Stages",
    personaTags: ["Obsessive Thinker", "Data Pragmatist"],
    scenario: "Split screen showing real Stripe revenue graph next to founder's calm face.",
    spokenHookExample: "Here is the exact day our revenue went from zero to $10k MRR, and why.",
    actionCues: "Points to revenue graph spike, talks directly to viewers.",
    psychologicalMechanism: "Unimpeachable visual proof combined with transparent storytelling.",
    algorithmicImpact: "Maximum completion rate and bookmark rate.",
  },
  {
    code: "#092",
    category: "complex",
    categoryLabel: "Multi-modal Complex",
    stage: "building",
    stageLabel: "Building",
    personaTags: ["Garage Hacker", "Deep Work Specialist"],
    scenario: "Dynamic zoom into terminal showing error logs + rapid spoken diagnosis.",
    spokenHookExample: "Our entire backend went down at 3 AM. Here is what we found in line 402.",
    actionCues: "Points at terminal error trace, locks eye contact with camera.",
    psychologicalMechanism: "High-stakes crisis storytelling (War room energy).",
    algorithmicImpact: "Strong retention through narrative suspense.",
  },
  {
    code: "#100",
    category: "complex",
    categoryLabel: "Multi-modal Complex",
    stage: "all_stages",
    stageLabel: "All Stages",
    personaTags: ["Radical Simplifier", "Direct Operator"],
    scenario: "Founder stands in empty room with single microphone, speaking with absolute conviction.",
    spokenHookExample: "You already know what to say. Stop letting overproduction kill your message.",
    actionCues: "Direct eye contact, unmoving posture, crystal-clear vocal projection.",
    psychologicalMechanism: "Raw authentic authority without distraction.",
    algorithmicImpact: "High emotional resonance and viral shares across founders.",
  },
];

/**
 * Filter hooks based on founder context & stage.
 */
export function recommendHooksForContext(
  stage: HookEntry["stage"],
  personaTags: string[] = []
): HookEntry[] {
  const matches = HOOKS_DATABASE.filter(
    (h) =>
      (h.stage === stage || h.stage === "all_stages") &&
      (personaTags.length === 0 ||
        h.personaTags.some((tag) => personaTags.includes(tag)))
  );

  if (matches.length > 0) return matches;

  // Fallback to all matching stage
  const stageMatches = HOOKS_DATABASE.filter(
    (h) => h.stage === stage || h.stage === "all_stages"
  );
  return stageMatches.length > 0 ? stageMatches : HOOKS_DATABASE.slice(0, 5);
}
