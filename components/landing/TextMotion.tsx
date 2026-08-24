"use client";

import { motion } from "motion/react";
import type { JSX } from "react";

/**
 * TextMotion — word-by-word staggered rise for headings. Each word fades
 * up with a slight blur-out as the block enters the viewport, so long
 * landing-page headlines read as one flowing reveal instead of a static
 * block of text.
 */
export function TextMotion({
  text,
  as = "h2",
  className,
  delay = 0,
  once = true,
}: {
  text: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  delay?: number;
  once?: boolean;
}) {
  const words = text.split(" ");
  const Tag = motion[as as "h2"];

  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-12% 0px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.055, delayChildren: delay } },
      }}
      aria-label={text}
    >
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          style={{ display: "inline-block", willChange: "transform, opacity, filter" }}
          variants={{
            hidden: { opacity: 0, y: 22, filter: "blur(6px)" },
            visible: {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
            },
          }}
        >
          {word}
          {i < words.length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </Tag>
  );
}

/**
 * Giant footer wordmark driven by scroll — letters brighten from left to
 * right as the page approaches the bottom, like the reference effect.
 */
export function FooterWordmark({ text }: { text: string }) {
  return (
    <motion.h1
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, margin: "-8% 0px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } },
      }}
      className="p-footer-wordmark"
    >
      {text.split("").map((ch, i) => (
        <motion.span
          key={`${ch}-${i}`}
          style={{ display: "inline-block" }}
          variants={{
            hidden: { opacity: 0.25, y: 30 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
          }}
        >
          {ch}
        </motion.span>
      ))}
    </motion.h1>
  );
}
