"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";

interface AuthProgressProps {
  label?: string;
  sublabel?: string;
}

export function AuthProgress({
  label = "Authenticating session...",
  sublabel = "Verifying access and loading your workspace",
}: AuthProgressProps) {
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    const timer1 = setTimeout(() => setProgress(45), 150);
    const timer2 = setTimeout(() => setProgress(75), 450);
    const timer3 = setTimeout(() => setProgress(92), 900);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="auth-progress-container">
      <div className="auth-progress-card">
        <div className="auth-progress-logo">
          <Logo size={28} />
        </div>
        <div className="auth-progress-bar-track">
          <div
            className="auth-progress-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="auth-progress-text">
          <span className="auth-progress-label">{label}</span>
          <span className="auth-progress-percentage">{progress}%</span>
        </div>
        <p className="auth-progress-sublabel">{sublabel}</p>
      </div>
    </div>
  );
}
