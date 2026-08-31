"use client";

import React from "react";
import { Compare } from "@/components/ui/compare";
import FolderInteraction from "@/components/ui/folder-interaction";

export function CompareDemo() {
  return (
    <div className="p-4 border rounded-3xl dark:bg-neutral-900 bg-neutral-100 border-neutral-200 dark:border-neutral-800 px-4">
      <Compare
        firstImage="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop"
        secondImage="https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=800&auto=format&fit=crop"
        firstImageClassName="object-cover object-left-top"
        secondImageClassname="object-cover object-left-top"
        className="h-[250px] w-[200px] md:h-[400px] md:w-[400px]"
        slideMode="hover"
      />
    </div>
  );
}

export function FolderInteractionDemo() {
  return (
    <div className="flex items-center justify-center w-full min-h-screen bg-background p-8">
      <FolderInteraction />
    </div>
  );
}

import { Typewriter } from "@/components/ui/typewriter-text";

export function DemoVariant1() {
  return (
    <div className="flex items-center justify-center p-8">
      <Typewriter
        text={["Welcome to HextaUI", "Build awesome websites.", "hextaui.com"]}
        speed={100}
        loop={true}
        className="text-xl font-medium text-white"
      />
    </div>
  );
}

export default function Demo() {
  return (
    <div className="flex flex-col gap-8 items-center justify-center w-full min-h-screen bg-background p-8">
      <FolderInteraction />
      <CompareDemo />
      <DemoVariant1 />
    </div>
  );
}
