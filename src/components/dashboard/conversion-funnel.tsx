"use client";

import { motion } from "motion/react";

import {
  TRACK_STAGES,
  STAGE_CHART_COLORS,
  type PipelineStage,
} from "@/lib/pipeline";

export function ConversionFunnel({
  stageCounts,
}: {
  stageCounts: Record<PipelineStage, number>;
}) {
  // "Reached at least this stage" = candidates currently at this stage or later
  // on the track (assumes forward movement; Rejected is excluded).
  const reached = TRACK_STAGES.map((_, i) =>
    TRACK_STAGES.slice(i).reduce((sum, st) => sum + (stageCounts[st] ?? 0), 0),
  );
  const top = reached[0];

  if (top === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No candidates in the pipeline yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {TRACK_STAGES.map((stage, i) => {
        const value = reached[i];
        const pct = Math.round((value / top) * 100);
        const color = STAGE_CHART_COLORS[stage];
        return (
          <div key={stage}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium">{stage}</span>
              <span className="tabular-nums text-muted-foreground">
                {value}
                <span className="mx-1 opacity-40">·</span>
                {pct}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.06, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${color}, ${color}99)` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
