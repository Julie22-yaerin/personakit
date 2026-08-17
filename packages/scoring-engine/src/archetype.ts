import { ARCHETYPES, type Archetype, type ArchetypeMixture, type PersonaVector } from "@personakit/shared-types";
import { personaDistance } from "./persona";

/**
 * DRM §15 lists the archetype vocabulary but not numeric exemplars, so
 * these are an explicit, tunable engineering default: one canonical
 * 8-dimension persona vector per archetype. Classification is nearest-
 * neighbor in persona space, not a semantic LLM judgment, so it stays
 * fully deterministic per DRM §24.
 */
export const ARCHETYPE_PROFILES: Record<Archetype, PersonaVector> = {
  Strategist: {
    arrogance: 60,
    charisma: 65,
    vulnerability: 20,
    dominance: 70,
    humor: 30,
    warmth: 35,
    enigma: 55,
    provocation: 40,
  },
  Provocateur: {
    arrogance: 75,
    charisma: 70,
    vulnerability: 15,
    dominance: 80,
    humor: 40,
    warmth: 20,
    enigma: 45,
    provocation: 90,
  },
  Expert: {
    arrogance: 55,
    charisma: 55,
    vulnerability: 25,
    dominance: 60,
    humor: 25,
    warmth: 45,
    enigma: 30,
    provocation: 30,
  },
  Storyteller: {
    arrogance: 30,
    charisma: 75,
    vulnerability: 60,
    dominance: 40,
    humor: 55,
    warmth: 70,
    enigma: 40,
    provocation: 25,
  },
  Challenger: {
    arrogance: 65,
    charisma: 60,
    vulnerability: 20,
    dominance: 85,
    humor: 35,
    warmth: 25,
    enigma: 35,
    provocation: 75,
  },
  Analyst: {
    arrogance: 40,
    charisma: 40,
    vulnerability: 20,
    dominance: 45,
    humor: 15,
    warmth: 40,
    enigma: 25,
    provocation: 20,
  },
  Performer: {
    arrogance: 55,
    charisma: 90,
    vulnerability: 35,
    dominance: 60,
    humor: 75,
    warmth: 60,
    enigma: 40,
    provocation: 45,
  },
  Mystery: {
    arrogance: 45,
    charisma: 60,
    vulnerability: 30,
    dominance: 55,
    humor: 20,
    warmth: 25,
    enigma: 90,
    provocation: 55,
  },
  Teacher: {
    arrogance: 25,
    charisma: 55,
    vulnerability: 40,
    dominance: 45,
    humor: 40,
    warmth: 75,
    enigma: 20,
    provocation: 20,
  },
  "Anti-hero": {
    arrogance: 70,
    charisma: 65,
    vulnerability: 55,
    dominance: 65,
    humor: 45,
    warmth: 20,
    enigma: 60,
    provocation: 70,
  },
};

/**
 * DRM §15 — "a creator can have multiple simultaneous archetypes." Weighs
 * every archetype by an exponentially-decaying function of its persona
 * distance (temperature controls how peaked the mixture is; 25 is a
 * documented default) and returns the top 3 plus the full distribution.
 */
export function classifyArchetypes(persona: PersonaVector, temperature = 25): ArchetypeMixture {
  const scored = ARCHETYPES.map((name) => {
    const distance = personaDistance(persona, ARCHETYPE_PROFILES[name]);
    return { name, weight: Math.exp(-distance / temperature) };
  });
  const total = scored.reduce((sum, s) => sum + s.weight, 0);
  const weights: Record<string, number> = {};
  for (const s of scored) weights[s.name] = total > 0 ? s.weight / total : 1 / scored.length;

  const ranked = [...scored].sort((a, b) => weights[b.name] - weights[a.name]);

  return {
    primary: ranked[0].name,
    secondary: ranked[1].name,
    tertiary: ranked[2].name,
    weights,
  };
}
