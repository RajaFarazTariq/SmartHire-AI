"use client";

import { motion } from "motion/react";
import {
  Briefcase,
  Users,
  Gauge,
  Award,
  Clock,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { CARD_HOVER, CARD_HOVER_BASE, type CardAccent } from "@/lib/card-accents";
import { Card } from "@/components/ui/card";

// Decorative sparkline waves (purely visual, like the reference). Stretched to
// each card's width via preserveAspectRatio="none"; coloured via currentColor.
const WAVES = [
  "M0,22 C12,14 20,14 32,19 C44,24 56,9 68,13 C80,17 90,22 100,15",
  "M0,15 C12,21 22,8 36,12 C50,16 58,25 72,19 C86,14 94,9 100,13",
  "M0,20 C10,12 22,23 34,17 C48,10 58,21 70,15 C84,9 92,17 100,11",
];

function Sparkline({ index, id }: { index: number; id: string }) {
  const line = WAVES[index % WAVES.length];
  const area = `${line} L100,32 L0,32 Z`;
  return (
    <svg
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      className="h-full w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.3} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.55}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function KpiCards({
  jobs,
  candidates,
  avgMatch,
  hired,
  processing,
  ready,
}: {
  jobs: number;
  candidates: number;
  avgMatch: number;
  hired: number;
  processing: number;
  ready: number;
}) {
  const cards: {
    label: string;
    value: string;
    icon: LucideIcon;
    tint: string;
    wave: string;
    accent: CardAccent;
  }[] = [
    { label: "Jobs", value: String(jobs), icon: Briefcase, tint: "bg-blue-500/10 text-blue-600 dark:text-blue-400", wave: "text-blue-500", accent: "blue" },
    { label: "Candidates", value: String(candidates), icon: Users, tint: "bg-violet-500/10 text-violet-600 dark:text-violet-400", wave: "text-violet-500", accent: "violet" },
    { label: "Avg match", value: `${avgMatch}%`, icon: Gauge, tint: "bg-primary/10 text-primary", wave: "text-primary", accent: "primary" },
    { label: "Hired", value: String(hired), icon: Award, tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", wave: "text-emerald-500", accent: "emerald" },
    { label: "Processing", value: String(processing), icon: Clock, tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400", wave: "text-amber-500", accent: "amber" },
    { label: "Ready", value: String(ready), icon: CheckCircle2, tint: "bg-teal-500/10 text-teal-600 dark:text-teal-400", wave: "text-teal-500", accent: "teal" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05, ease: "easeOut" }}
          >
            <Card
              className={cn(
                "relative gap-0 overflow-hidden py-0",
                CARD_HOVER_BASE,
                CARD_HOVER[c.accent],
              )}
            >
              {/* Content (pb reserves room for the wave so they never overlap) */}
              <div className="relative z-10 px-4 pb-11 pt-4">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-md",
                      c.tint,
                    )}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {c.label}
                  </p>
                </div>
                <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">
                  {c.value}
                </p>
              </div>

              {/* Soft accent gradient sparkline anchored to the bottom edge */}
              <div
                className={cn(
                  "pointer-events-none absolute inset-x-0 bottom-0 h-12",
                  c.wave,
                )}
              >
                <Sparkline index={i} id={`kpi-spark-${i}`} />
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
