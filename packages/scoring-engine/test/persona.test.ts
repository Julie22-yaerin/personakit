import type { PersonaVector } from "@personakit/shared-types";
import { describe, expect, it } from "vitest";
import {
  classifyPersonaConsistency,
  personaConsistencyScore,
  personaDistance,
  personaDriftBreakdown,
} from "../src/persona.js";

const target: PersonaVector = {
  arrogance: 78,
  charisma: 84,
  vulnerability: 31,
  dominance: 81,
  humor: 52,
  warmth: 28,
  enigma: 76,
  provocation: 88,
};

function shiftAll(vector: PersonaVector, delta: number): PersonaVector {
  return Object.fromEntries(
    Object.entries(vector).map(([k, v]) => [k, v + delta]),
  ) as PersonaVector;
}

describe("personaDistance / personaConsistencyScore", () => {
  it("is 0 / 100 for an identical vector", () => {
    expect(personaDistance(target, target)).toBe(0);
    expect(personaConsistencyScore(target, target)).toBe(100);
  });

  it("matches the normalized Euclidean distance formula for a uniform shift", () => {
    // every dimension shifted by the same delta -> distance == |delta|
    const sample = shiftAll(target, 10);
    expect(personaDistance(target, sample)).toBeCloseTo(10, 10);
    expect(personaConsistencyScore(target, sample)).toBeCloseTo(90, 10);
  });

  it("classifies PCS bands per DRM §3", () => {
    expect(classifyPersonaConsistency(90)).toBe("highly_consistent");
    expect(classifyPersonaConsistency(80)).toBe("acceptable");
    expect(classifyPersonaConsistency(65)).toBe("weak");
    expect(classifyPersonaConsistency(45)).toBe("drift");
  });

  it("clamps PCS to [0, 100] even for extreme distances", () => {
    const sample: PersonaVector = {
      arrogance: 0,
      charisma: 0,
      vulnerability: 100,
      dominance: 0,
      humor: 100,
      warmth: 100,
      enigma: 0,
      provocation: 0,
    };
    const pcs = personaConsistencyScore(target, sample);
    expect(pcs).toBeGreaterThanOrEqual(0);
    expect(pcs).toBeLessThanOrEqual(100);
  });
});

describe("personaDriftBreakdown", () => {
  it("ranks dimensions by absolute delta, largest first", () => {
    const sample: PersonaVector = {
      ...target,
      warmth: target.warmth + 40, // biggest swing
      humor: target.humor - 5, // small swing
    };
    const breakdown = personaDriftBreakdown(target, sample);
    expect(breakdown[0].dimension).toBe("warmth");
    expect(breakdown[0].delta).toBeCloseTo(40, 10);
    expect(breakdown.at(-1)?.dimension).not.toBe("warmth");
  });
});
