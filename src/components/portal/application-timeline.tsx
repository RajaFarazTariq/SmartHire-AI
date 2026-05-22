"use client";

import { motion } from "motion/react";
import { Check, Circle, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  TRACK_STAGES,
  STAGE_CHART_COLORS,
  STAGE_DESCRIPTIONS,
  trackIndex,
} from "@/lib/pipeline";

export function ApplicationTimeline({ stage }: { stage: string }) {
  const rejected = stage === "Rejected";
  const currentIndex = rejected ? -1 : trackIndex(stage);

  return (
    <div>
      {rejected && (
        <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
          <XCircle className="mt-0.5 size-4 shrink-0" />
          <span>{STAGE_DESCRIPTIONS.Rejected}</span>
        </div>
      )}

      <ol className="relative">
        {TRACK_STAGES.map((s, i) => {
          const state =
            i < currentIndex ? "done" : i === currentIndex ? "active" : "upcoming";
          const color = STAGE_CHART_COLORS[s];
          const isLast = i === TRACK_STAGES.length - 1;

          return (
            <li key={s} className="relative flex gap-4 pb-7 last:pb-0">
              {!isLast && (
                <span
                  className="absolute left-4 top-8 h-[calc(100%-1rem)] w-0.5 -translate-x-1/2 rounded-full"
                  style={{
                    background:
                      i < currentIndex ? color : "var(--border)",
                  }}
                />
              )}

              <span
                className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2"
                style={
                  state === "upcoming"
                    ? { borderColor: "var(--border)", background: "var(--background)" }
                    : {
                        borderColor: color,
                        background: state === "done" ? color : "var(--background)",
                      }
                }
              >
                {state === "done" ? (
                  <Check className="size-4 text-white" strokeWidth={3} />
                ) : state === "active" ? (
                  <motion.span
                    className="size-3 rounded-full"
                    style={{ background: color }}
                    animate={{ scale: [1, 1.25, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  />
                ) : (
                  <Circle className="size-2 text-muted-foreground" />
                )}
              </span>

              <div className="pt-1">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    state === "upcoming" && "text-muted-foreground",
                  )}
                >
                  {s}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {STAGE_DESCRIPTIONS[s]}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
