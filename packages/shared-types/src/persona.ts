import { z } from "zod";

/**
 * DRM §2 — Persona Vector: P = (A, C, V, D, H, W, E, S), each dimension 0-100.
 * Field names spell out the DRM letter each one stands for.
 */
export const PersonaVectorSchema = z.object({
  arrogance: z.number().min(0).max(100), // A
  charisma: z.number().min(0).max(100), // C
  vulnerability: z.number().min(0).max(100), // V
  dominance: z.number().min(0).max(100), // D
  humor: z.number().min(0).max(100), // H
  warmth: z.number().min(0).max(100), // W
  enigma: z.number().min(0).max(100), // E
  provocation: z.number().min(0).max(100), // S (Social Provocation)
});

export type PersonaVector = z.infer<typeof PersonaVectorSchema>;

export const PERSONA_DIMENSIONS = [
  "arrogance",
  "charisma",
  "vulnerability",
  "dominance",
  "humor",
  "warmth",
  "enigma",
  "provocation",
] as const;

export type PersonaDimension = (typeof PERSONA_DIMENSIONS)[number];
