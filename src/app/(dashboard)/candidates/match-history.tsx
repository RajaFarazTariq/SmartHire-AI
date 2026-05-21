import Link from "next/link";
import type { Score, Job } from "@prisma/client";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type ScoreWithJob = Score & { job: Job };

function scoreTone(n: number) {
  if (n >= 75) return "bg-emerald-500/10 text-emerald-600";
  if (n >= 50) return "bg-amber-500/10 text-amber-600";
  return "bg-rose-500/10 text-rose-600";
}

export function MatchHistory({ scores }: { scores: ScoreWithJob[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Job match history</CardTitle>
        <CardDescription>
          How this candidate scores against your jobs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {scores.map((s) => {
            const overall = Math.round(s.overallScore);
            const total = s.matchedSkills.length + s.missingSkills.length;
            return (
              <li key={s.id}>
                <Link
                  href={`/jobs/${s.jobId}`}
                  className="flex items-center gap-4 py-3 transition-colors hover:text-primary"
                >
                  <span
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold tabular-nums",
                      scoreTone(overall),
                    )}
                  >
                    {overall}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {s.job.title}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {s.job.company ? `${s.job.company} · ` : ""}
                      {total > 0
                        ? `${s.matchedSkills.length}/${total} skills matched`
                        : "no required skills"}
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
