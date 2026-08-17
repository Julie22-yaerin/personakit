import { z } from "zod";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

/**
 * DRM §21-22 — the founder logs these manually per published piece of
 * content. This app has no social-platform API integration (no OAuth to
 * Instagram/TikTok/YouTube/LinkedIn was built or requested), so there's
 * no way to pull reach/engagement automatically — the honest option is
 * founder-entered numbers, scored deterministically, rather than
 * fabricating analytics this app doesn't actually have.
 */
export const DistributionEntrySchema = z.object({
  loggedAt: z.string().min(1),
  label: z.string().min(1),
  reach: z.number().min(0),
  engagement: z.number().min(0),
  profileVisits: z.number().min(0),
  follows: z.number().min(0),
  qualifiedLeads: z.number().min(0),
  productSignups: z.number().min(0),
  customerConversions: z.number().min(0),
  hiringInbound: z.number().min(0),
  investorInbound: z.number().min(0),
  partnershipInbound: z.number().min(0),
});
export type DistributionEntry = z.infer<typeof DistributionEntrySchema>;

/**
 * DRM §21 — "the economic metric, not views." Every component is scored
 * relative to the founder's OWN trailing average for that metric, not an
 * absolute scale — this is the literal mechanism behind the DRM's own
 * example ("your last 10 posts generated 3.2x more qualified traffic
 * than your previous 10"). 50 = performing at your own historical
 * average, 100 = 2x or better. With no history yet, any nonzero value
 * reads as a neutral-favorable 100/50 split rather than a fabricated
 * baseline.
 */
function relativeScore(current: number, trailingAverage: number): number {
  if (trailingAverage <= 0) return current > 0 ? 100 : 50;
  return clamp((current / trailingAverage) * 50, 0, 100);
}

export interface FDSComponents {
  reachQuality: number;
  recognition: number;
  engagement: number;
  companyIntent: number;
  conversion: number;
}

function conversionTotal(entry: DistributionEntry): number {
  return entry.qualifiedLeads + entry.productSignups + entry.customerConversions;
}

/**
 * DRM §21 — "FDS = Reach x Recognition x Engagement x Profile Intent x
 * Company Conversion," operationally 0.20 each of Reach Quality,
 * Recognition, Audience Engagement, Company Intent, Conversion (the
 * DRM's exact weights). Mapping from the app's logged fields:
 *   Reach Quality  <- reach
 *   Recognition    <- follows (choosing to keep following = memorability)
 *   Engagement     <- engagement
 *   Company Intent <- profileVisits (visiting the profile/bio = intent)
 *   Conversion     <- qualifiedLeads + productSignups + customerConversions
 * `history` should be prior entries only — the entry being scored is
 * never included in its own baseline.
 */
export function computeFDS(current: DistributionEntry, history: DistributionEntry[]): { score: number; components: FDSComponents } {
  const avg = (key: keyof DistributionEntry) => average(history.map((e) => e[key] as number));

  const components: FDSComponents = {
    reachQuality: relativeScore(current.reach, avg("reach")),
    recognition: relativeScore(current.follows, avg("follows")),
    engagement: relativeScore(current.engagement, avg("engagement")),
    companyIntent: relativeScore(current.profileVisits, avg("profileVisits")),
    conversion: relativeScore(conversionTotal(current), average(history.map(conversionTotal))),
  };

  const score = average(Object.values(components));
  return { score, components };
}

export type FDSLabel = "below your average" | "at your average" | "above your average" | "significantly outperforming";

export function classifyFDS(score: number): FDSLabel {
  if (score < 40) return "below your average";
  if (score < 60) return "at your average";
  if (score < 80) return "above your average";
  return "significantly outperforming";
}

export interface EDSWeights {
  qualifiedLeads: number;
  productSignups: number;
  customerConversions: number;
  hiringInbound: number;
  investorInbound: number;
  partnershipInbound: number;
}

/** Equal weight of 1 per component — the unweighted literal sum the DRM's own formula states, until the founder customizes it for their actual objective. */
export const DEFAULT_EDS_WEIGHTS: EDSWeights = {
  qualifiedLeads: 1,
  productSignups: 1,
  customerConversions: 1,
  hiringInbound: 1,
  investorInbound: 1,
  partnershipInbound: 1,
};

/** DRM §22 — "EDS = Qualified Leads + Product Signups + Customer Conversions + Hiring Inbound + Investor Inbound + Partnership Inbound," weighted per the founder's actual company objective. */
export function computeEDS(entry: DistributionEntry, weights: EDSWeights = DEFAULT_EDS_WEIGHTS): number {
  return (
    entry.qualifiedLeads * weights.qualifiedLeads +
    entry.productSignups * weights.productSignups +
    entry.customerConversions * weights.customerConversions +
    entry.hiringInbound * weights.hiringInbound +
    entry.investorInbound * weights.investorInbound +
    entry.partnershipInbound * weights.partnershipInbound
  );
}

export function computeEDSTotal(entries: DistributionEntry[], weights: EDSWeights = DEFAULT_EDS_WEIGHTS): number {
  return entries.reduce((sum, entry) => sum + computeEDS(entry, weights), 0);
}
