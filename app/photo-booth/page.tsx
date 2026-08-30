"use client";

import { useEffect, useRef, useState } from "react";
import { PhotoBoothOverlay } from "../../components/photo-booth/PhotoBoothOverlay";
import { PhotoBoothSimulator } from "../../components/photo-booth/PhotoBoothSimulator";
import { INITIAL_PHOTO_BOOTH_STATE, PhotoBoothState } from "../../lib/photo-booth/types";
import "./photo-booth.css";

export default function PhotoBoothPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<PhotoBoothState>(INITIAL_PHOTO_BOOTH_STATE);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false // audio handled by simulator for now
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        setCameraError(err.message || "Could not access camera");
      }
    }
    setupCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="pb-page">
      <div className="pb-studio-container">
        {/* Background Camera Layer */}
        <div className="pb-camera-layer">
          {cameraError ? (
            <div className="pb-camera-error">Camera Error: {cameraError}</div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="pb-camera-video"
            />
          )}
        </div>

        {/* UI Overlay */}
        <PhotoBoothOverlay state={state} />
      </div>

      {/* Developer Simulator */}
      <PhotoBoothSimulator state={state} setState={setState} />
    </div>
  );
}
