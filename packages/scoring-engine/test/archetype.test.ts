import { describe, expect, it } from "vitest";
import { ARCHETYPE_PROFILES, classifyArchetypes } from "../src/archetype";

describe("classifyArchetypes", () => {
  it("picks the exact-match archetype as primary and weights it highest", () => {
    const mixture = classifyArchetypes(ARCHETYPE_PROFILES.Mystery);
    expect(mixture.primary).toBe("Mystery");
    const maxWeight = Math.max(...Object.values(mixture.weights));
    expect(mixture.weights.Mystery).toBeCloseTo(maxWeight, 10);
  });

  it("returns a full distribution that sums to ~1", () => {
    const mixture = classifyArchetypes(ARCHETYPE_PROFILES.Storyteller);
    const total = Object.values(mixture.weights).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 6);
  });

  it("returns three distinct archetypes for primary/secondary/tertiary", () => {
    const mixture = classifyArchetypes(ARCHETYPE_PROFILES.Provocateur);
    const names = new Set([mixture.primary, mixture.secondary, mixture.tertiary]);
    expect(names.size).toBe(3);
  });
});
