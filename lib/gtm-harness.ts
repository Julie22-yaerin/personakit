import { readFileSync } from "node:fs";
import path from "node:path";

const HARNESS_DIR = "harness";

const CORE_FILE = "SYSTEM_PROMPT.md";

const EXTENDED_FILES = [
  "framework/core-rules.md",
  "framework/b2b-roadmap.md",
  "framework/b2c-roadmap.md",
  "framework/content-calendar-system.md",
  "framework/case-studies.md",
  "framework/viral-vs-conversion.md",
  "framework/production-playbook.md",
  "templates/post-types.md",
  "templates/daily-checklist.md",
];

let coreCache: string | null = null;
let extendedCache: string | null = null;

function readHarnessFile(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), HARNESS_DIR, relativePath), "utf8");
}

export function getGtmHarnessCorePrompt(): string {
  if (!coreCache) coreCache = readHarnessFile(CORE_FILE);
  return coreCache;
}

export function getGtmHarnessExtendedPrompt(): string {
  if (!extendedCache) {
    extendedCache = EXTENDED_FILES.map((f) => readHarnessFile(path.join(HARNESS_DIR, f))).join(
      "\n\n---\n\n",
    );
  }
  return extendedCache;
}

export interface GtmState {
  model: "b2b" | "b2c";
  stage: "prepmf" | "mvp" | "scaling";
  product?: string;
  platforms?: string[];
}

export function buildGtmUserPrompt(question: string, state: GtmState): string {
  const lines = [
    `Market model: ${state.model}`,
    `Startup stage: ${state.stage}`,
    state.product ? `Product: ${state.product}` : null,
    state.platforms?.length ? `Platforms: ${state.platforms.join(", ")}` : null,
    "",
    `Founder's request:\n"""${question}"""`,
  ];
  return lines.filter((l) => l !== null).join("\n");
}
