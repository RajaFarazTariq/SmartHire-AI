"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Sparkles, Loader2, ArrowRight, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { STAGE_STYLES, isPipelineStage } from "@/lib/pipeline";
import { getJobRecommendations, type RecommendationItem } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function tone(score: number) {
  if (score >= 75) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-rose-600";
}

export function RecommendationsPanel({ jobId }: { jobId: string }) {
  const [items, setItems] = useState<RecommendationItem[] | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const res = await getJobRecommendations(jobId);
      if (res.ok) {
        setItems(res.items ?? []);
      } else {
        toast.error(res.error ?? "Could not load recommendations");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wand2 className="size-4 text-primary" />
            AI recommendations
          </CardTitle>
          <CardDescription>
            Best-fit candidates by semantic match — no scoring required.
          </CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={run} disabled={pending}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {items === null ? "Find matches" : "Refresh"}
        </Button>
      </CardHeader>
      <CardContent>
        {items === null ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Click “Find matches” to surface the candidates whose resumes best fit
            this role.
          </p>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No matches yet. Upload and extract candidate resumes, then try again.
          </p>
        ) : (
          <ul className="divide-y">
            {items.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/candidates/${c.id}`}
                  className="flex items-center gap-4 py-3 transition-colors hover:text-primary"
                >
                  <span className="flex w-12 shrink-0 flex-col items-center">
                    <span className={cn("text-lg font-bold tabular-nums", tone(c.similarity))}>
                      {c.similarity}%
                    </span>
                    <span className="text-[10px] text-muted-foreground">match</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {c.fullName ?? c.filename}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {c.currentTitle ?? "—"}
                      {c.extractedSkills.length > 0 &&
                        ` · ${c.extractedSkills.slice(0, 3).join(", ")}`}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                      isPipelineStage(c.stage) ? STAGE_STYLES[c.stage] : "bg-muted",
                    )}
                  >
                    {c.stage}
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
