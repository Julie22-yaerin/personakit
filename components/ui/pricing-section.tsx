"use client";

import React, { useEffect, useRef, useState } from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import NumberFlow from "@number-flow/react";
import { motion } from "motion/react";
import {
  Briefcase,
  CheckCheck,
  Database,
  Server,
  Sparkles,
  Zap,
  Shield,
  Layers,
  Camera,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TimelineContent } from "@/components/ui/timeline-animation";

export interface Tier {
  name: "Starter" | "Pro" | "Advanced";
  badge?: string;
  stageName: string;
  description: string;
  price: number;
  yearlyPrice: number;
  buttonText: string;
  buttonVariant: "default" | "outline";
  popular?: boolean;
  priceId: { month: string; year: string };
  features: { text: string; icon: React.ReactNode }[];
  includes: string[];
}

export const PRICING_TIERS: Tier[] = [
  {
    name: "Starter",
    stageName: "IDEA & MVP STAGE",
    description: "For solo founders and early builders preparing their first structured takes.",
    price: 19,
    yearlyPrice: 159,
    buttonText: "Start with Starter",
    buttonVariant: "outline",
    priceId: {
      month: process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER_MONTHLY || "pri_starter_monthly",
      year: process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER_YEARLY || "pri_starter_yearly",
    },
    features: [
      { text: "Up to 10 Content Boards & Scripts", icon: <Layers size={18} /> },
      { text: "Live Studio HUD & Smile Intensity Gauge", icon: <Camera size={18} /> },
      { text: "Real-time Speech Pacing (WPM) Meter", icon: <Zap size={18} /> },
      { text: "Local In-Browser Privacy (0 Video Stored)", icon: <Shield size={18} /> },
    ],
    includes: [
      "Starter includes:",
      "7-Stage Script Graph Structuring",
      "Rule-of-Thirds & Eye Horizon Framing",
      "Single-Shot Action Checklist",
      "Full export in WebM / 1080p",
    ],
  },
  {
    name: "Pro",
    stageName: "LAUNCH & FIRST USERS",
    description: "The complete Content Command Center for active founders building distribution.",
    price: 49,
    yearlyPrice: 399,
    buttonText: "Scale with Pro",
    buttonVariant: "default",
    popular: true,
    priceId: {
      month: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY || "pri_pro_monthly",
      year: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_YEARLY || "pri_pro_yearly",
    },
    features: [
      { text: "Unlimited Content Boards & Workspaces", icon: <Briefcase size={18} /> },
      { text: "Live Off-Topic Drift Protection & Auto-Cut", icon: <Zap size={18} /> },
      { text: "Visual Consistency Scoring (VCS)", icon: <Database size={18} /> },
      { text: "Props & Accessory Recognition (CV Tags)", icon: <Server size={18} /> },
    ],
    includes: [
      "Everything in Starter, plus:",
      "Unlimited 1-Take Studio Filming",
      "NVIDIA NIM Stylist & Extractor Acceleration",
      "Closed Reality Feedback Loops",
      "Smart Jump-Cut Pre-Planning",
    ],
  },
  {
    name: "Advanced",
    stageName: "GROWTH & MULTI-MEMBER TEAM",
    description: "For high-velocity startups and teams scaling multiple executive & founder voices.",
    price: 99,
    yearlyPrice: 899,
    buttonText: "Get Enterprise Power",
    buttonVariant: "outline",
    priceId: {
      month: process.env.NEXT_PUBLIC_PADDLE_PRICE_ADVANCED_MONTHLY || "pri_advanced_monthly",
      year: process.env.NEXT_PUBLIC_PADDLE_PRICE_ADVANCED_YEARLY || "pri_advanced_yearly",
    },
    features: [
      { text: "Multi-Founder Persona Management", icon: <Briefcase size={18} /> },
      { text: "Team Workspace Collaboration & Seats", icon: <Layers size={18} /> },
      { text: "Custom GTM Content & Redline Audits", icon: <Server size={18} /> },
      { text: "Priority 24/7 Builder & API Support", icon: <Shield size={18} /> },
    ],
    includes: [
      "Everything in Pro, plus:",
      "Custom Persona Vector Calibration",
      "Unlimited High-Speed Video Processing",
      "Dedicated Onboarding & Strategy Call",
      "Custom Webhooks & Content Sync",
    ],
  },
];

interface PricingSwitchProps {
  isYearly: boolean;
  onToggle: (yearly: boolean) => void;
}

const PricingSwitch = ({ isYearly, onToggle }: PricingSwitchProps) => {
  return (
    <div className="flex justify-center">
      <div className="relative z-20 mx-auto flex w-fit rounded-full bg-slate-900/80 border border-slate-700/60 p-1 backdrop-blur-xl shadow-xl">
        <button
          type="button"
          onClick={() => onToggle(false)}
          className={`relative z-10 w-fit sm:h-11 h-9 rounded-full sm:px-6 px-4 font-semibold text-sm transition-colors ${
            !isYearly ? "text-white" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {!isYearly && (
            <motion.span
              layoutId="pricing-switch"
              className="absolute inset-0 rounded-full border border-cyan-400/40 bg-gradient-to-r from-blue-600 to-cyan-500 shadow-md shadow-cyan-500/20"
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
            />
          )}
          <span className="relative z-10">Monthly</span>
        </button>

        <button
          type="button"
          onClick={() => onToggle(true)}
          className={`relative z-10 w-fit sm:h-11 h-9 rounded-full sm:px-6 px-4 font-semibold text-sm transition-colors flex items-center gap-2 ${
            isYearly ? "text-white" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {isYearly && (
            <motion.span
              layoutId="pricing-switch"
              className="absolute inset-0 rounded-full border border-cyan-400/40 bg-gradient-to-r from-blue-600 to-cyan-500 shadow-md shadow-cyan-500/20"
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
            />
          )}
          <span className="relative z-10">Yearly</span>
          <span className="relative z-10 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
            Save 20%
          </span>
        </button>
      </div>
    </div>
  );
};

interface PricingSectionProps {
  countryCode?: string;
  userEmail?: string;
  className?: string;
}

export default function PricingSection({
  countryCode,
  userEmail,
  className = "",
}: PricingSectionProps) {
  const [isYearly, setIsYearly] = useState(false);
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [localizedPrices, setLocalizedPrices] = useState<Record<string, string>>({});
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);
  const pricingRef = useRef<HTMLDivElement>(null);

  // Initialize Paddle.js
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    const environment = (process.env.NEXT_PUBLIC_PADDLE_ENV || "production") as "production" | "sandbox";

    if (!token) {
      console.warn("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is not set. Paddle Checkout is in preview mode.");
      return;
    }

    initializePaddle({
      token,
      environment,
      eventCallback: (data) => {
        if (data.name === "checkout.completed") {
          window.location.href = "/welcome";
        }
      },
    }).then((paddleInstance) => {
      if (paddleInstance) {
        setPaddle(paddleInstance);

        // Fetch localized price previews
        const allPriceIds = PRICING_TIERS.flatMap((t) => [t.priceId.month, t.priceId.year]).filter(
          (id) => id.startsWith("pri_")
        );

        if (allPriceIds.length > 0) {
          const previewParams: Parameters<typeof paddleInstance.PricePreview>[0] = {
            items: allPriceIds.map((priceId) => ({ priceId, quantity: 1 })),
          };
          if (countryCode && countryCode !== "OTHERS") {
            previewParams.address = { countryCode };
          }

          paddleInstance
            .PricePreview(previewParams)
            .then((preview) => {
              const map: Record<string, string> = {};
              preview.data.details.lineItems.forEach((item) => {
                map[item.price.id] = item.formattedTotals.total;
              });
              setLocalizedPrices(map);
            })
            .catch((err) => {
              console.warn("Paddle PricePreview notice:", err);
            });
        }
      }
    });
  }, [countryCode]);

  const handleSubscribe = async (tier: Tier) => {
    const priceId = isYearly ? tier.priceId.year : tier.priceId.month;
    setLoadingCheckout(tier.name);

    try {
      if (paddle && priceId.startsWith("pri_")) {
        paddle.Checkout.open({
          items: [{ priceId, quantity: 1 }],
          customer: userEmail ? { email: userEmail } : undefined,
          settings: {
            displayMode: "overlay",
            theme: "dark",
            variant: "one-page",
            successUrl: `${window.location.origin}/welcome`,
          },
        });
      } else {
        // Direct redirect to onboarding/login if Paddle token or live price is pending
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Paddle Checkout error:", err);
    } finally {
      setLoadingCheckout(null);
    }
  };

  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: { delay: i * 0.1, duration: 0.45 },
    }),
    hidden: {
      filter: "blur(6px)",
      y: 16,
      opacity: 0,
    },
  };

  return (
    <section
      id="pricing"
      className={`px-4 py-24 relative overflow-hidden text-white ${className}`}
      ref={pricingRef}
    >
      {/* Background Radial Glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(0, 240, 255, 0.12) 0%, rgba(59, 130, 246, 0.05) 50%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="text-center mb-10 max-w-3xl mx-auto relative z-10">
        <TimelineContent
          as="div"
          animationNum={0}
          timelineRef={pricingRef}
          customVariants={revealVariants}
          className="p-hero-badge-pill mx-auto mb-4"
        >
          <Sparkles size={13} color="#00f0ff" />
          <span>STARTUP-STAGE PRICING</span>
        </TimelineContent>

        <TimelineContent
          as="h2"
          animationNum={1}
          timelineRef={pricingRef}
          customVariants={revealVariants}
          className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4"
        >
          Plans built for where you are{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 bg-clip-text text-transparent">
            right now.
          </span>
        </TimelineContent>

        <TimelineContent
          as="p"
          animationNum={2}
          timelineRef={pricingRef}
          customVariants={revealVariants}
          className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto"
        >
          No bloated per-seat gouging. Turn your authentic thoughts into continuous distribution.
        </TimelineContent>
      </div>

      <TimelineContent
        as="div"
        animationNum={3}
        timelineRef={pricingRef}
        customVariants={revealVariants}
        className="mb-12"
      >
        <PricingSwitch isYearly={isYearly} onToggle={setIsYearly} />
      </TimelineContent>

      {/* 3-Tier Grid */}
      <div className="grid md:grid-cols-3 max-w-6xl gap-6 mx-auto relative z-10">
        {PRICING_TIERS.map((tier, index) => {
          const currentPriceId = isYearly ? tier.priceId.year : tier.priceId.month;
          const localizedDisplay = localizedPrices[currentPriceId];

          return (
            <TimelineContent
              key={tier.name}
              as="div"
              animationNum={4 + index}
              timelineRef={pricingRef}
              customVariants={revealVariants}
              className="flex"
            >
              <Card
                className={`relative flex flex-col justify-between w-full rounded-2xl border backdrop-blur-2xl transition-all duration-300 ${
                  tier.popular
                    ? "bg-slate-900/90 border-cyan-500/60 shadow-2xl shadow-cyan-500/20 ring-1 ring-cyan-400/50"
                    : "bg-slate-900/70 border-slate-800 hover:border-slate-700 shadow-xl"
                }`}
              >
                <CardHeader className="p-7 pb-4 text-left">
                  <div className="flex justify-between items-center mb-2">
                    <span className="p-mono text-xs font-bold tracking-wider text-cyan-400">
                      {tier.stageName}
                    </span>
                    {tier.popular && (
                      <span className="rounded-full bg-cyan-500/20 border border-cyan-400/50 px-3 py-0.5 text-xs font-bold text-cyan-300">
                        RECOMMENDED
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-6 min-h-[40px]">
                    {tier.description}
                  </p>

                  <div className="flex items-baseline gap-1 pt-2 pb-1 border-t border-slate-800">
                    {localizedDisplay ? (
                      <span className="text-4xl font-extrabold text-white tracking-tight">
                        {localizedDisplay}
                      </span>
                    ) : (
                      <>
                        <span className="text-4xl font-extrabold text-white tracking-tight">
                          $
                          <NumberFlow
                            value={isYearly ? tier.yearlyPrice : tier.price}
                            className="font-extrabold"
                          />
                        </span>
                        <span className="text-sm text-slate-400 font-medium ml-1">
                          /{isYearly ? "year" : "month"}
                        </span>
                      </>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-7 pt-2 flex-1 flex flex-col justify-between">
                  <div>
                    <button
                      type="button"
                      onClick={() => handleSubscribe(tier)}
                      disabled={loadingCheckout === tier.name}
                      className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer mb-6 ${
                        tier.popular
                          ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold shadow-lg shadow-cyan-500/30 border border-cyan-300/40"
                          : "bg-white/10 hover:bg-white/15 text-white border border-white/15"
                      }`}
                    >
                      {loadingCheckout === tier.name ? "Opening Checkout..." : tier.buttonText}
                    </button>

                    <ul className="space-y-3 mb-6">
                      {tier.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start text-sm text-slate-200">
                          <span className="text-cyan-400 mr-2.5 mt-0.5 flex-shrink-0">
                            {feature.icon}
                          </span>
                          <span className="leading-snug">{feature.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80">
                    <span className="p-mono text-xs font-semibold text-slate-400 block mb-2.5">
                      {tier.includes[0]}
                    </span>
                    <ul className="space-y-2">
                      {tier.includes.slice(1).map((inc, iIdx) => (
                        <li key={iIdx} className="flex items-center text-xs text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mr-2 flex-shrink-0" />
                          <span>{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TimelineContent>
          );
        })}
      </div>
    </section>
  );
}
