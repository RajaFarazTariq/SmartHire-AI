"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ClipboardList,
  Loader2,
  CalendarCheck,
  Trophy,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { CARD_HOVER, type CardAccent } from "@/lib/card-accents";
import { Card } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/dashboard/animated-counter";

export function PortalStatCards({
  applications,
  inReview,
  interviews,
  offers,
}: {
  applications: number;
  inReview: number;
  interviews: number;
  offers: number;
}) {
  const cards: {
    label: string;
    sub: string;
    value: number;
    icon: LucideIcon;
    accent: CardAccent;
    tile: string;
    glow: string;
  }[] = [
    {
      label: "Applications",
      sub: "Total submitted",
      value: applications,
      icon: ClipboardList,
      accent: "blue",
      tile: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
      glow: "from-blue-500/10",
    },
    {
      label: "In review",
      sub: "Being evaluated",
      value: inReview,
      icon: Loader2,
      accent: "amber",
      tile: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
      glow: "from-amber-500/10",
    },
    {
      label: "Interviews",
      sub: "Scheduled + assessment",
      value: interviews,
      icon: CalendarCheck,
      accent: "violet",
      tile: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
      glow: "from-violet-500/10",
    },
    {
      label: "Offers",
      sub: "Roles won",
      value: offers,
      icon: Trophy,
      accent: "emerald",
      tile: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
      glow: "from-emerald-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06, ease: "easeOut" }}
          >
            <Link href="/portal/applications" className="block h-full">
              <Card
                className={cn(
                  "group relative h-full gap-0 overflow-hidden py-5 transition-all duration-200 hover:-translate-y-0.5",
                  CARD_HOVER[c.accent],
                )}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-gradient-to-br to-transparent blur-2xl",
                    c.glow,
                  )}
                />
                <div className="relative flex items-start justify-between px-5">
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-xl",
                      c.tile,
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground/50 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                </div>
                <div className="relative mt-3 px-5">
                  <AnimatedCounter
                    value={c.value}
                    className="text-3xl font-bold tracking-tight tabular-nums"
                  />
                  <p className="mt-0.5 text-sm font-medium">{c.label}</p>
                  <p className="text-xs text-muted-foreground">{c.sub}</p>
                </div>
              </Card>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
