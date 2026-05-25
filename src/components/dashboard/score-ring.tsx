"use client";

import { motion } from "motion/react";

function toneColor(value: number) {
  if (value >= 75) return "#10b981";
  if (value >= 50) return "#f59e0b";
  return "#f43f5e";
}

export function ScoreRing({
  value,
  size = 52,
  stroke = 5,
}: {
  value: number;
  size?: number;
  stroke?: number;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - clamped / 100);
  const color = toneColor(clamped);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums"
        style={{ color }}
      >
        {Math.round(clamped)}
      </span>
    </div>
  );
}
