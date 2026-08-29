"use client";

import React from "react";
import { motion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";

interface TimelineContentProps extends React.HTMLAttributes<HTMLElement> {
  as?: "div" | "h2" | "h3" | "span" | "p" | "section";
  animationNum?: number;
  timelineRef?: React.RefObject<HTMLElement | null>;
  customVariants?: Variants;
  className?: string;
  children?: React.ReactNode;
}

export function TimelineContent({
  as = "div",
  animationNum = 0,
  timelineRef,
  customVariants,
  className,
  children,
  ...props
}: TimelineContentProps) {
  const defaultVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 16,
      filter: "blur(6px)",
    },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.1,
        duration: 0.45,
        ease: [0.21, 0.47, 0.32, 0.98],
      },
    }),
  };

  const variants = customVariants || defaultVariants;

  const MotionComponent = motion[as] as React.ElementType;

  return (
    <MotionComponent
      variants={variants}
      custom={animationNum}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      className={cn(className)}
      {...props}
    >
      {children}
    </MotionComponent>
  );
}
