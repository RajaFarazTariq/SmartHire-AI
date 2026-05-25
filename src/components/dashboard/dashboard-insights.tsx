"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  CalendarClock,
  ClipboardCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { CARD_HOVER } from "@/lib/card-accents";
import { Card } from "@/components/ui/card";
import { AnimatedCounter } from "./animated-counter";

type Accent = "violet" | "amber" | "emerald" | "rose";

const ACCENTS: Record<Accent, { tile: string; glow: string; ring: string }> = {
  violet: {
    tile: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    glow: "from-violet-500/10",
    ring: "text-violet-500",
  },
  amber: {
    tile: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    glow: "from-amber-500/10",
    ring: "text-amber-500",
  },
  emerald: {
    tile: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    glow: "from-emerald-500/10",
    ring: "text-emerald-500",
  },
  rose: {
    tile: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    glow: "from-rose-500/10",
    ring: "text-rose-500",
  },
};

function InsightCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  href,
  delay,
  badge,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  sub: string;
  accent: Accent;
  href: string;
  delay: number;
  badge?: React.ReactNode;
}) {
  const a = ACCENTS[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
    >
      <Link href={href} className="block h-full">
        <Card
          className={cn(
            "group relative h-full gap-0 overflow-hidden py-5 transition-all duration-200 hover:-translate-y-0.5",
            CARD_HOVER[accent],
          )}
        >
          {/* soft corner glow */}
          <div
            className={cn(
              "pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-gradient-to-br to-transparent blur-2xl",
              a.glow,
            )}
          />
          <div className="relative flex items-start justify-between px-5">
            <span
              className={cn(
                "flex size-10 items-center justify-center rounded-xl",
                a.tile,
              )}
            >
              <Icon className="size-5" />
            </span>
            <ArrowUpRight className="size-4 text-muted-foreground/50 transition-all group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <div className="relative mt-3 px-5">
            <div className="flex items-end gap-2">
              <AnimatedCounter
                value={value}
                className="text-3xl font-bold tracking-tight tabular-nums"
              />
              {badge}
            </div>
            <p className="mt-0.5 text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

export function DashboardInsights({
  upcomingInterviews,
  pendingReviews,
  velocity,
}: {
  upcomingInterviews: number;
  pendingReviews: number;
  velocity: { thisWeek: number; lastWeek: number; deltaPct: number };
}) {
  const up = velocity.deltaPct > 0;
  const flat = velocity.deltaPct === 0;
  const TrendIcon = flat ? Minus : up ? TrendingUp : TrendingDown;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <InsightCard
        icon={CalendarClock}
        label="Upcoming interviews"
        value={upcomingInterviews}
        sub="Scheduled + technical stages"
        accent="violet"
        href="/candidates"
        delay={0}
      />
      <InsightCard
        icon={ClipboardCheck}
        label="Pending reviews"
        value={pendingReviews}
        sub="Applied + under review"
        accent="amber"
        href="/candidates"
        delay={0.06}
      />
      <InsightCard
        icon={TrendIcon}
        label="Hiring velocity"
        value={velocity.thisWeek}
        sub="New candidates this week"
        accent={flat ? "emerald" : up ? "emerald" : "rose"}
        href="/candidates"
        delay={0.12}
        badge={
          <span
            className={cn(
              "mb-1 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold",
              flat
                ? "bg-muted text-muted-foreground"
                : up
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
            )}
          >
            <TrendIcon className="size-3" />
            {Math.abs(velocity.deltaPct)}%
          </span>
        }
      />
    </div>
  );
}
