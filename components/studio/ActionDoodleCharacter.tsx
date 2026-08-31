"use client";

import React from "react";

interface ActionDoodleCharacterProps {
  actionText: string;
}

/**
 * Animated Doodle Character SVG generator.
 * Renders hand-drawn minimal character animations performing specific physical actions.
 */
export function ActionDoodleCharacter({ actionText }: ActionDoodleCharacterProps) {
  const text = (actionText || "").toLowerCase();

  // 1. Close Laptop / Gập laptop
  if (text.includes("close") && (text.includes("laptop") || text.includes("computer") || text.includes("máy tính") || text.includes("màn hình"))) {
    return (
      <div className="relative w-44 h-44 flex flex-col items-center justify-center">
        <svg viewBox="0 0 200 200" className="w-full h-full" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* Desk Line */}
          <line x1="30" y1="160" x2="170" y2="160" stroke="#64748b" strokeWidth="3" />

          {/* Doodle Guy Body & Head */}
          <circle cx="80" cy="70" r="22" stroke="#00f0ff" strokeWidth="3.5" fill="#0b1120" />
          {/* Eyes & determined expression */}
          <circle cx="75" cy="68" r="2.5" fill="#00f0ff" />
          <circle cx="87" cy="68" r="2.5" fill="#00f0ff" />
          <path d="M74 78 Q80 82 86 78" stroke="#00f0ff" strokeWidth="2.5" />
          {/* Eyebrows */}
          <path d="M71 62 L78 64" stroke="#00f0ff" strokeWidth="2" />
          <path d="M84 64 L91 62" stroke="#00f0ff" strokeWidth="2" />

          {/* Body */}
          <path d="M80 92 L80 150" stroke="#00f0ff" strokeWidth="3.5" />

          {/* Laptop Base on Desk */}
          <path d="M105 158 L160 158" stroke="#38bdf8" strokeWidth="4" />

          {/* Animated Laptop Lid Closing */}
          <g className="animate-doodle-laptop" style={{ transformOrigin: "115px 158px" }}>
            <line x1="115" y1="158" x2="148" y2="115" stroke="#38bdf8" strokeWidth="4" />
            <line x1="148" y1="115" x2="160" y2="115" stroke="#38bdf8" strokeWidth="3" />
          </g>

          {/* Animated Arm slamming laptop */}
          <g className="animate-doodle-arm" style={{ transformOrigin: "80px 105px" }}>
            <path d="M80 105 Q110 115 140 125" stroke="#00f0ff" strokeWidth="3.5" />
          </g>

          {/* Impact stars / Action lines */}
          <g className="animate-ping" style={{ animationDuration: "1.6s", transformOrigin: "145px 135px" }}>
            <path d="M145 105 L145 95 M160 115 L170 110 M155 135 L165 140" stroke="#f59e0b" strokeWidth="2" />
          </g>
        </svg>
        <span className="text-[11px] font-mono tracking-widest text-[#38bdf8] uppercase bg-black/80 px-2.5 py-0.5 rounded border border-[#38bdf8]/40">
          DOODLE: CLOSING LAPTOP
        </span>
      </div>
    );
  }

  // 2. Coffee Mug / Drink / Uống cafe / Cầm cốc
  if (text.includes("coffee") || text.includes("mug") || text.includes("drink") || text.includes("cốc") || text.includes("uống") || text.includes("ly")) {
    return (
      <div className="relative w-44 h-44 flex flex-col items-center justify-center">
        <svg viewBox="0 0 200 200" className="w-full h-full" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* Doodle Guy */}
          <circle cx="90" cy="70" r="24" stroke="#00f0ff" strokeWidth="3.5" fill="#0b1120" />
          <circle cx="84" cy="68" r="2.5" fill="#00f0ff" />
          <circle cx="96" cy="68" r="2.5" fill="#00f0ff" />
          <path d="M85 80 Q90 84 95 80" stroke="#00f0ff" strokeWidth="2.5" />
          {/* Body */}
          <path d="M90 94 L90 160" stroke="#00f0ff" strokeWidth="3.5" />

          {/* Left Rest Arm */}
          <path d="M90 105 L60 135 L45 130" stroke="#00f0ff" strokeWidth="3" />

          {/* Animated Drinking Arm & Mug */}
          <g className="animate-bounce" style={{ animationDuration: "2s", transformOrigin: "90px 105px" }}>
            <path d="M90 105 L115 110 L108 85" stroke="#00f0ff" strokeWidth="3.5" />
            {/* Coffee Mug */}
            <rect x="102" y="70" width="18" height="20" rx="3" fill="#0b1120" stroke="#f59e0b" strokeWidth="2.5" />
            <path d="M120 74 Q127 80 120 86" stroke="#f59e0b" strokeWidth="2" />
            {/* Steam waves */}
            <path d="M106 64 Q108 58 106 52 M114 64 Q116 58 114 52" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
          </g>
        </svg>
        <span className="text-[11px] font-mono tracking-widest text-[#f59e0b] uppercase bg-black/80 px-2.5 py-0.5 rounded border border-[#f59e0b]/40">
          DOODLE: DRINKING COFFEE
        </span>
      </div>
    );
  }

  // 3. Throw Paper / Trash Can / Vứt thùng rác
  if (text.includes("throw") || text.includes("trash") || text.includes("bin") || text.includes("vứt") || text.includes("rác") || text.includes("book") || text.includes("shred")) {
    return (
      <div className="relative w-44 h-44 flex flex-col items-center justify-center">
        <svg viewBox="0 0 200 200" className="w-full h-full" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* Trash Bin */}
          <path d="M140 130 L145 170 L175 170 L180 130 Z" stroke="#ef4444" strokeWidth="3" fill="#0b1120" />
          <line x1="135" y1="130" x2="185" y2="130" stroke="#ef4444" strokeWidth="3" />
          <line x1="152" y1="140" x2="154" y2="162" stroke="#ef4444" strokeWidth="1.5" />
          <line x1="168" y1="140" x2="166" y2="162" stroke="#ef4444" strokeWidth="1.5" />

          {/* Doodle Guy */}
          <circle cx="70" cy="70" r="22" stroke="#00f0ff" strokeWidth="3.5" fill="#0b1120" />
          <circle cx="66" cy="68" r="2.5" fill="#00f0ff" />
          <circle cx="78" cy="68" r="2.5" fill="#00f0ff" />
          <path d="M68 79 Q73 83 78 79" stroke="#00f0ff" strokeWidth="2.5" />
          <path d="M70 92 L70 160" stroke="#00f0ff" strokeWidth="3.5" />

          {/* Animated Throwing Arm */}
          <g className="animate-doodle-throw" style={{ transformOrigin: "70px 105px" }}>
            <path d="M70 105 Q100 80 125 90" stroke="#00f0ff" strokeWidth="3.5" />
            {/* Paper Ball Falling Trajectory */}
            <circle cx="132" cy="92" r="7" stroke="#fbbf24" strokeWidth="2.5" fill="#0b1120" />
          </g>
          <path d="M130 96 Q150 105 160 130" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4 4" />
        </svg>
        <span className="text-[11px] font-mono tracking-widest text-[#ef4444] uppercase bg-black/80 px-2.5 py-0.5 rounded border border-[#ef4444]/40">
          DOODLE: TOSSING INTO BIN
        </span>
      </div>
    );
  }

  // 4. Point at Screen / Camera / Chỉ tay vào màn hình/camera
  if (text.includes("point") || text.includes("punch") || text.includes("chỉ tay") || text.includes("tay") || text.includes("gesture") || text.includes("screen")) {
    return (
      <div className="relative w-44 h-44 flex flex-col items-center justify-center">
        <svg viewBox="0 0 200 200" className="w-full h-full" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* Doodle Guy */}
          <circle cx="85" cy="70" r="24" stroke="#00f0ff" strokeWidth="3.5" fill="#0b1120" />
          <circle cx="80" cy="68" r="2.5" fill="#00f0ff" />
          <circle cx="92" cy="68" r="2.5" fill="#00f0ff" />
          <path d="M80 80 Q86 85 92 80" stroke="#00f0ff" strokeWidth="2.5" />
          <path d="M85 94 L85 160" stroke="#00f0ff" strokeWidth="3.5" />

          {/* Animated Pointing Arm Extending Out */}
          <g className="animate-doodle-point" style={{ transformOrigin: "85px 105px" }}>
            <path d="M85 105 L130 100" stroke="#00f0ff" strokeWidth="4" />
            {/* Hand & Pointing Finger */}
            <path d="M130 100 L160 100 M145 92 L145 108" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
            <circle cx="165" cy="100" r="6" fill="#10b981" />
          </g>

          {/* Dynamic Flash Lines at target */}
          <g className="animate-pulse" style={{ animationDuration: "1s" }}>
            <path d="M175 90 L185 85 M175 110 L185 115 M180 100 L192 100" stroke="#10b981" strokeWidth="2" />
          </g>
        </svg>
        <span className="text-[11px] font-mono tracking-widest text-[#10b981] uppercase bg-black/80 px-2.5 py-0.5 rounded border border-[#10b981]/40">
          DOODLE: POINTING AT CAMERA
        </span>
      </div>
    );
  }

  // 5. Shake head / Contrarian / Rage bait / Lắc đầu
  if (text.includes("shake") || text.includes("head") || text.includes("lắc đầu") || text.includes("contrarian") || text.includes("rage") || text.includes("disagree")) {
    return (
      <div className="relative w-44 h-44 flex flex-col items-center justify-center">
        <svg viewBox="0 0 200 200" className="w-full h-full" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* Animated Shaking Head */}
          <g className="animate-doodle-shake" style={{ transformOrigin: "100px 70px" }}>
            <circle cx="100" cy="70" r="25" stroke="#f59e0b" strokeWidth="3.5" fill="#0b1120" />
            {/* Skeptical Eyes & Eyebrows */}
            <line x1="90" y1="62" x2="98" y2="65" stroke="#f59e0b" strokeWidth="2" />
            <line x1="104" y1="65" x2="112" y2="60" stroke="#f59e0b" strokeWidth="2" />
            <circle cx="94" cy="69" r="2.5" fill="#f59e0b" />
            <circle cx="106" cy="69" r="2.5" fill="#f59e0b" />
            {/* Wavy mouth */}
            <path d="M92 82 Q100 78 108 83" stroke="#f59e0b" strokeWidth="2.5" />
          </g>

          {/* Body */}
          <path d="M100 95 L100 160" stroke="#00f0ff" strokeWidth="3.5" />

          {/* Arms out in disagreement */}
          <path d="M100 110 L65 125 L50 105" stroke="#00f0ff" strokeWidth="3" />
          <path d="M100 110 L135 125 L150 105" stroke="#00f0ff" strokeWidth="3" />

          {/* Rejection 'NO' waves */}
          <g className="animate-pulse">
            <path d="M60 60 Q55 70 60 80 M140 60 Q145 70 140 80" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 3" />
          </g>
        </svg>
        <span className="text-[11px] font-mono tracking-widest text-[#f59e0b] uppercase bg-black/80 px-2.5 py-0.5 rounded border border-[#f59e0b]/40">
          DOODLE: SHAKING HEAD NO
        </span>
      </div>
    );
  }

  // 6. Type Fast / Code / Typing / Gõ phím
  if (text.includes("type") || text.includes("code") || text.includes("keyboard") || text.includes("terminal") || text.includes("gõ")) {
    return (
      <div className="relative w-44 h-44 flex flex-col items-center justify-center">
        <svg viewBox="0 0 200 200" className="w-full h-full" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* Desk */}
          <line x1="30" y1="160" x2="170" y2="160" stroke="#64748b" strokeWidth="3" />

          {/* Doodle Guy */}
          <circle cx="85" cy="70" r="23" stroke="#00f0ff" strokeWidth="3.5" fill="#0b1120" />
          <circle cx="80" cy="68" r="2.5" fill="#00f0ff" />
          <circle cx="92" cy="68" r="2.5" fill="#00f0ff" />
          <path d="M82 80 L90 80" stroke="#00f0ff" strokeWidth="2" />
          <path d="M85 93 L85 155" stroke="#00f0ff" strokeWidth="3.5" />

          {/* Keyboard on Desk */}
          <rect x="110" y="145" width="45" height="12" rx="2" stroke="#a855f7" strokeWidth="2" fill="#0b1120" />

          {/* Fast Typing Arms */}
          <g className="animate-bounce" style={{ animationDuration: "0.35s" }}>
            <path d="M85 105 L115 135 L125 142" stroke="#00f0ff" strokeWidth="3" />
            <path d="M85 105 L125 130 L140 142" stroke="#00f0ff" strokeWidth="3" />
          </g>

          {/* Code spark particles */}
          <g className="animate-ping" style={{ animationDuration: "0.8s" }}>
            <text x="135" y="115" fill="#a855f7" fontSize="16" fontWeight="bold">&lt;/&gt;</text>
          </g>
        </svg>
        <span className="text-[11px] font-mono tracking-widest text-[#a855f7] uppercase bg-black/80 px-2.5 py-0.5 rounded border border-[#a855f7]/40">
          DOODLE: RAPID TYPING
        </span>
      </div>
    );
  }

  // 7. Direct Eye Contact / Serious Look / Nhìn thẳng ống kính
  return (
    <div className="relative w-44 h-44 flex flex-col items-center justify-center">
      <svg viewBox="0 0 200 200" className="w-full h-full" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Doodle Guy Focused */}
        <g className="animate-pulse" style={{ animationDuration: "2s" }}>
          <circle cx="100" cy="70" r="26" stroke="#00f0ff" strokeWidth="3.5" fill="#0b1120" />
          {/* Intense Eyes */}
          <circle cx="91" cy="68" r="3.5" fill="#00f0ff" />
          <circle cx="109" cy="68" r="3.5" fill="#00f0ff" />
          {/* Concentrated Brows */}
          <path d="M86 60 L96 64" stroke="#00f0ff" strokeWidth="2.5" />
          <path d="M104 64 L114 60" stroke="#00f0ff" strokeWidth="2.5" />
          {/* Confident mouth */}
          <path d="M93 83 Q100 86 107 83" stroke="#00f0ff" strokeWidth="2.5" />
        </g>

        {/* Body */}
        <path d="M100 96 L100 160" stroke="#00f0ff" strokeWidth="3.5" />

        {/* Confident Hand gestures */}
        <g className="animate-bounce" style={{ animationDuration: "1.8s", transformOrigin: "100px 105px" }}>
          <path d="M100 110 L70 130 L55 120" stroke="#00f0ff" strokeWidth="3" />
          <path d="M100 110 L130 130 L145 120" stroke="#00f0ff" strokeWidth="3" />
        </g>
      </svg>
      <span className="text-[11px] font-mono tracking-widest text-[#00f0ff] uppercase bg-black/80 px-2.5 py-0.5 rounded border border-[#00f0ff]/40">
        DOODLE: DIRECT ACTION
      </span>
    </div>
  );
}
