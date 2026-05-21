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

import { Card, CardContent } from "@/components/ui/card";

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
  }[] = [
    { label: "Jobs", value: String(jobs), icon: Briefcase, tint: "bg-blue-500/10 text-blue-600" },
    { label: "Candidates", value: String(candidates), icon: Users, tint: "bg-violet-500/10 text-violet-600" },
    { label: "Avg match", value: `${avgMatch}%`, icon: Gauge, tint: "bg-primary/10 text-primary" },
    { label: "Hired", value: String(hired), icon: Award, tint: "bg-emerald-500/10 text-emerald-600" },
    { label: "Processing", value: String(processing), icon: Clock, tint: "bg-amber-500/10 text-amber-600" },
    { label: "Ready", value: String(ready), icon: CheckCircle2, tint: "bg-teal-500/10 text-teal-600" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05, ease: "easeOut" }}
          >
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center justify-between gap-2 px-4">
                <div className="min-w-0">
                  <p className="truncate text-xs text-muted-foreground">
                    {c.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
                    {c.value}
                  </p>
                </div>
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${c.tint}`}
                >
                  <Icon className="size-5" />
                </span>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
