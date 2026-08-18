"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Restrained scroll-triggered fade/rise — not a slideshow, just enough motion to read as a live system. */
export function Reveal({
  children,
  delay = 0,
  y = 16,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
