import { z } from "zod";

/**
 * DRM §16 — a controlled direction to mutate a script in, expressed as
 * target emphasis levels rather than free-form instructions, so the LLM
 * mutates toward a specific, comparable point instead of "make it better".
 */
export const VariantSpecSchema = z.object({
  label: z.string().min(1),
  curiosityEmphasis: z.enum(["low", "medium", "high"]),
  provocationEmphasis: z.enum(["low", "medium", "high"]),
  mysteryEmphasis: z.enum(["low", "medium", "high"]),
});
export type VariantSpec = z.infer<typeof VariantSpecSchema>;

export const DEFAULT_VARIANT_SPECS: VariantSpec[] = [
  {
    label: "High curiosity / low provocation",
    curiosityEmphasis: "high",
    provocationEmphasis: "low",
    mysteryEmphasis: "medium",
  },
  {
    label: "Medium curiosity / high provocation",
    curiosityEmphasis: "medium",
    provocationEmphasis: "high",
    mysteryEmphasis: "low",
  },
  {
    label: "High mystery / medium provocation",
    curiosityEmphasis: "medium",
    provocationEmphasis: "medium",
    mysteryEmphasis: "high",
  },
];
