"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/** Safe reveal animation that never hides content if scroll observer lags. */
export function Reveal({
  children,
  delay = 0,
  y = 12,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0.9, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: "some" }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{ opacity: 1 }}
    >
      {children}
    </motion.div>
  );
}
