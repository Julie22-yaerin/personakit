"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useMotionValue, useSpring } from "motion/react";

/** Counts up to `value` once it scrolls into view, with initial value rendered so it never shows 0 or blanks. */
export function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const motionValue = useMotionValue(value);
  const spring = useSpring(motionValue, { damping: 24, stiffness: 90 });
  const [display, setDisplay] = useState(value.toFixed(decimals));

  useEffect(() => {
    setDisplay(value.toFixed(decimals));
  }, [value, decimals]);

  useEffect(() => {
    if (inView) {
      motionValue.set(value);
    }
  }, [inView, value, motionValue]);

  useEffect(() => {
    return spring.on("change", (v) => setDisplay(v.toFixed(decimals)));
  }, [spring, decimals]);

  return <span ref={ref}>{display}</span>;
}
