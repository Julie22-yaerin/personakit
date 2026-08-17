import { z } from "zod";

/** DRM §15 — the fixed archetype vocabulary. */
export const ARCHETYPES = [
  "Strategist",
  "Provocateur",
  "Expert",
  "Storyteller",
  "Challenger",
  "Analyst",
  "Performer",
  "Mystery",
  "Teacher",
  "Anti-hero",
] as const;

export const ArchetypeSchema = z.enum(ARCHETYPES);
export type Archetype = z.infer<typeof ArchetypeSchema>;

/** A creator can have multiple simultaneous archetypes (DRM §15). */
export const ArchetypeMixtureSchema = z.object({
  primary: ArchetypeSchema,
  secondary: ArchetypeSchema,
  tertiary: ArchetypeSchema,
  weights: z.record(z.string(), z.number()),
});
export type ArchetypeMixture = z.infer<typeof ArchetypeMixtureSchema>;
