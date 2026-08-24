"use client";

import { useScroll, useSpring, useTransform, motion } from "motion/react";
import { useRef, type ReactNode } from "react";

/**
 * ScrollHero — the reference "hero scroll animation" adapted to PERSONA's
 * brand: the hero is pinned full-screen; as the visitor scrolls, it
 * scales down, tilts a few degrees and dims while the rest of the page
 * slides up over it. Content is passed through unchanged — only the
 * wrapper moves.
 *
 * The raw scroll position is stepped (wheel/tick), which reads as janky
 * on the pinned hero. A critically-damped spring smooths every value
 * without adding noticeable lag.
 */
export function ScrollHero({ children }: { children: ReactNode }) {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end start"],
  });

  const smooth = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    restDelta: 0.001,
  });

  const scale = useTransform(smooth, [0, 1], [1, 0.82]);
  const rotate = useTransform(smooth, [0, 1], [0, -3.5]);
  const opacity = useTransform(smooth, [0, 0.85], [1, 0.15]);
  const contentY = useTransform(smooth, [0, 1], [0, -60]);

  return (
    <div ref={container} className="p-hero-scroll">
      <motion.section
        style={{ scale, rotate, opacity }}
        className="p-hero-pinned"
      >
        {/* blueprint grid mask over the pinned hero */}
        <div className="p-hero-grid-overlay" aria-hidden />
        <motion.div style={{ y: contentY }} className="p-hero-inner">
          {children}
        </motion.div>
      </motion.section>
    </div>
  );
}
