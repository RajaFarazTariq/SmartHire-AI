"use client";

import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

export function AssistantCharacter({ className }: { className?: string }) {
  const reduce = useReducedMotion();

  const float = reduce ? {} : { y: [0, -12, 0] };
  const wave = reduce ? {} : { rotate: [0, 16, 0, 16, 0] };
  const pulse = reduce ? {} : { opacity: [1, 0.55, 1], scale: [1, 1.18, 1] };

  return (
    <motion.div
      className={cn("w-[220px] select-none", className)}
      initial={{ opacity: 0, scale: 0.9, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      whileHover={{ scale: 1.05, rotate: -2 }}
      aria-hidden="true"
    >
      <motion.div
        animate={float}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg
          viewBox="0 0 220 260"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-auto w-full drop-shadow-xl"
        >
          {/* floating shadow */}
          <motion.ellipse
            cx="110"
            cy="248"
            rx="56"
            ry="10"
            fill="var(--primary)"
            opacity="0.12"
            animate={reduce ? {} : { rx: [56, 46, 56], opacity: [0.12, 0.07, 0.12] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />

          {/* ambient sparkles */}
          <motion.g
            fill="var(--primary)"
            animate={reduce ? {} : { opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <path d="M30 70 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" />
          </motion.g>
          <motion.g
            fill="var(--primary)"
            animate={reduce ? {} : { opacity: [1, 0.3, 1] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <path d="M188 120 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 z" />
          </motion.g>

          {/* antenna */}
          <line x1="110" y1="46" x2="110" y2="26" stroke="var(--border)" strokeWidth="3" />
          <motion.circle
            cx="110"
            cy="20"
            r="6.5"
            fill="var(--primary)"
            animate={pulse}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />

          {/* head */}
          <rect x="38" y="46" width="144" height="98" rx="30" fill="var(--card)" stroke="var(--border)" strokeWidth="2" />
          {/* ears */}
          <rect x="30" y="80" width="10" height="30" rx="5" fill="var(--primary)" />
          <rect x="180" y="80" width="10" height="30" rx="5" fill="var(--primary)" />

          {/* face screen */}
          <rect x="56" y="62" width="108" height="66" rx="22" fill="#0e1730" />
          {/* eyes */}
          <circle className="assistant-eye" cx="89" cy="93" r="9" fill="#7dd3fc" />
          <circle className="assistant-eye" cx="131" cy="93" r="9" fill="#7dd3fc" />
          {/* smile */}
          <path d="M92 110 Q110 122 128 110" stroke="#7dd3fc" strokeWidth="3.5" strokeLinecap="round" fill="none" />

          {/* body */}
          <rect x="58" y="150" width="104" height="80" rx="26" fill="var(--card)" stroke="var(--border)" strokeWidth="2" />
          {/* chest light */}
          <motion.circle
            cx="110"
            cy="188"
            r="11"
            fill="var(--primary)"
            animate={reduce ? {} : { opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
          <circle cx="110" cy="188" r="4" fill="var(--primary-foreground)" opacity="0.9" />

          {/* left arm (static) */}
          <rect x="40" y="158" width="16" height="52" rx="8" fill="var(--card)" stroke="var(--border)" strokeWidth="2" />

          {/* right arm (waving) */}
          <motion.g
            animate={wave}
            transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }}
            style={{ transformBox: "fill-box", transformOrigin: "center top" }}
          >
            <rect x="164" y="150" width="16" height="52" rx="8" fill="var(--card)" stroke="var(--border)" strokeWidth="2" />
            <circle cx="172" cy="150" r="9" fill="var(--primary)" />
          </motion.g>
        </svg>
      </motion.div>
    </motion.div>
  );
}
