"use client";

import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Layers } from "lucide-react";

export interface FrostedGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  containerClassName?: string;
  tiltIntensity?: number;
  glowColor?: string;
  enableTilt?: boolean;
}

export const FrostedGlassCard: React.FC<FrostedGlassCardProps> = ({
  children,
  className,
  containerClassName,
  tiltIntensity = 10,
  glowColor = "rgba(255, 255, 255, 0.15)",
  enableTilt = true,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      if (enableTilt) {
        const rotateY = ((x - centerX) / centerX) * tiltIntensity;
        const rotateX = ((y - centerY) / centerY) * -tiltIntensity;
        card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      }
      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
    };

    const handleMouseLeave = () => {
      if (enableTilt) {
        card.style.transform = "rotateX(0deg) rotateY(0deg)";
      }
      card.style.setProperty("--mouse-x", "-1000px");
      card.style.setProperty("--mouse-y", "-1000px");
    };

    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [tiltIntensity, enableTilt]);

  return (
    <div className={cn("card-container", containerClassName)}>
      <div
        ref={cardRef}
        className={cn(
          "card w-full rounded-3xl p-8 text-white shadow-2xl transition-all duration-150",
          !children && "max-w-md",
          className
        )}
        style={
          {
            "--glow-color": glowColor,
          } as React.CSSProperties
        }
        {...props}
      >
        {children ? (
          children
        ) : (
          <>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Layers className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Glassmorphism UI</h2>
                <p className="text-indigo-300 font-medium">A New Design Trend</p>
              </div>
            </div>
            <p className="text-gray-300 leading-relaxed">
              This card uses the &ldquo;glassmorphism&rdquo; effect to create a sense of depth and transparency. The 3D tilt and dynamic glare are powered by JavaScript to create a futuristic and engaging user experience.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default FrostedGlassCard;
