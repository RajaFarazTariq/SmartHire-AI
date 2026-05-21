import Link from "next/link";
import type { Score, Candidate, Job } from "@prisma/client";
import { Trophy, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

type TopMatch = Score & { candidate: Candidate; job: Job };

function scoreTone(n: number) {
  if (n >= 75) return "bg-emerald-500/10 text-emerald-600";
  if (n >= 50) return "bg-amber-500/10 text-amber-600";
  return "bg-rose-500/10 text-rose-600";
}

export function TopMatches({ matches }: { matches: TopMatch[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trophy className="size-4 text-amber-500" />
          <CardTitle>Top matches</CardTitle>
        </div>
        <CardDescription>
          Your highest-scoring candidate–job matches
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {matches.map((m) => {
            const overall = Math.round(m.overallScore);
            return (
              <li key={m.id}>
                <Link
                  href={`/candidates/${m.candidateId}`}
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
                      {m.candidate.fullName ?? m.candidate.filename}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      for {m.job.title}
                      {m.matchedSkills.length > 0 &&
                        ` · ${m.matchedSkills.slice(0, 3).join(", ")}`}
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
