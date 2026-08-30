"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/landing/Logo";

export default function FaceScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [doodleImage, setDoodleImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access camera. Please check permissions.");
      }
    }
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setCapturedImage(dataUrl);

    // Stop the camera once we have the photo
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    // Call Mock API
    setIsGenerating(true);
    try {
      const response = await fetch("/api/onboarding/generate-doodle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: dataUrl })
      });

      const data = await response.json();
      if (response.ok && data.doodleUrl) {
        setDoodleImage(data.doodleUrl);
      } else {
        throw new Error(data.error || "Failed to generate doodle");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate doodle.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContinue = async () => {
    if (!doodleImage) return;

    setIsGenerating(true);
    try {
      const response = await fetch("/api/onboarding/save-doodle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doodleUrl: doodleImage })
      });

      if (!response.ok) {
        throw new Error("Failed to save doodle");
      }

      router.push("/board");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save doodle.");
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-page" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="p-nav">
        <div className="p-nav-inner" style={{ padding: "14px 24px" }}>
          <Logo />
          <span className="p-mono" style={{ fontSize: 11, color: "var(--p-text-secondary)" }}>
            STAGE 08 OF 08
          </span>
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 600, width: "100%", textAlign: "center" }}>
          <h1 className="p-h1" style={{ marginBottom: 16 }}>Your Founder Avatar</h1>
          <p style={{ color: "var(--p-text-secondary)", marginBottom: 40, lineHeight: 1.6 }}>
            Let's grab a quick photo to generate your custom doodle illustration using Muse Spark. This will be your visual identity on the platform.
          </p>

          {error && (
            <div style={{ padding: 16, background: "rgba(255, 50, 50, 0.1)", border: "1px solid rgba(255, 50, 50, 0.3)", borderRadius: 8, color: "#ff8080", marginBottom: 24 }}>
              {error}
            </div>
          )}

          <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--p-border)", borderRadius: 16, padding: 24, marginBottom: 32 }}>
            {!capturedImage ? (
              <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", background: "#000", aspectRatio: "4/3", marginBottom: 24 }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            ) : doodleImage ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <div style={{ width: 240, height: 240, borderRadius: 120, overflow: "hidden", border: "4px solid #00f0ff" }}>
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={doodleImage} alt="Generated Doodle" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <span style={{ color: "#00f0ff", fontWeight: 600 }}>Doodle Generated!</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "40px 0", marginBottom: 24 }}>
                <div style={{ color: "var(--p-text-secondary)" }}>
                  {isGenerating ? "Analyzing face and generating your doodle illustration..." : "Processing image..."}
                </div>
              </div>
            )}

            {/* Hidden canvas for capturing the frame */}
            <canvas ref={canvasRef} style={{ display: "none" }} />

            {!capturedImage ? (
              <button
                type="button"
                className="p-btn p-btn-primary"
                onClick={capturePhoto}
                style={{ width: "100%", justifyContent: "center" }}
              >
                Capture Photo
              </button>
            ) : doodleImage ? (
              <button
                type="button"
                className="p-btn p-btn-primary"
                onClick={handleContinue}
                style={{ width: "100%", justifyContent: "center" }}
              >
                Continue to Dashboard
              </button>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
