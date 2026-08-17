import { z } from "zod";

/**
 * DRM §19-20 — the founder's own ground truth about their product, used
 * only to check factual/product claims in their content against reality.
 * This is entered directly by the founder, not inferred by an LLM —
 * guessing at "what the product actually does" would risk fabricating
 * the exact thing this feature exists to catch.
 */
export const CompanyContextSchema = z.object({
  productDescription: z.string().min(1),
  accurateClaims: z.array(z.string().min(1)),
  falseClaims: z.array(z.string().min(1)),
  brandVoice: z.string(),
  positioning: z.string(),
});
export type CompanyContext = z.infer<typeof CompanyContextSchema>;

export const MIN_PRODUCT_DESCRIPTION_WORDS = 5;

export function isCompanyContextSubstantive(productDescription: string): boolean {
  return productDescription.trim().split(/\s+/).filter(Boolean).length >= MIN_PRODUCT_DESCRIPTION_WORDS;
}

export const EMPTY_COMPANY_CONTEXT: CompanyContext = {
  productDescription: "",
  accurateClaims: [],
  falseClaims: [],
  brandVoice: "",
  positioning: "",
};
