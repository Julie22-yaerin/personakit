"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { getConsent, sendFeedback } from "../../lib/analytics";

/** Tiny "was this page helpful" widget — one vote per visitor per session. */
export function FeedbackWidget() {
  const [voted, setVoted] = useState<"up" | "down" | null>(null);

  const vote = (value: "up" | "down") => {
    if (voted) return;
    setVoted(value);
    if (typeof window !== "undefined" && getConsent() === "granted") {
      void sendFeedback(value, window.location.pathname);
    }
  };

  return (
    <div className="p-feedback" aria-live="polite">
      {voted ? (
        <span className="p-feedback-thanks">Thanks for the signal.</span>
      ) : (
        <>
          <span className="p-feedback-label">Was this useful?</span>
          <button
            type="button"
            className="p-feedback-btn"
            aria-label="Yes, helpful"
            onClick={() => vote("up")}
          >
            <ThumbsUp size={14} />
          </button>
          <button
            type="button"
            className="p-feedback-btn"
            aria-label="No, not helpful"
            onClick={() => vote("down")}
          >
            <ThumbsDown size={14} />
          </button>
        </>
      )}
    </div>
  );
}
