"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const UnicornScene = dynamic(() => import("unicornstudio-react"), {
  ssr: false,
  loading: () => null,
});

export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

export const Component = () => {

  const { width, height } = useWindowSize();

  return (
    <div className={cn("flex flex-col items-center")}>
        <UnicornScene
        production={true} projectId="9tVO0xGS8DIar1DF4Sqc" width={width} height={height} />
    </div>
  );
};

/**
 * Full-viewport fixed backdrop that renders the UnicornStudio scene
 * behind page content. Content sits above it via its own stacking
 * context (relative z-index), so nothing needs to change inside pages.
 */
export const AnimationBackground = ({ className }: { className?: string }) => (
  <div
    aria-hidden="true"
    className={cn("pointer-events-none fixed inset-0 z-0 overflow-hidden", className)}
  >
    <Component />
  </div>
);
