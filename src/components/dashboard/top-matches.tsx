import Link from "next/link";
import type { Score, Candidate, Job } from "@prisma/client";
import { Sparkles, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { CARD_HOVER, CARD_HOVER_BASE } from "@/lib/card-accents";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScoreRing } from "./score-ring";

type TopMatch = Score & { candidate: Candidate; job: Job };

export function TopMatches({ matches }: { matches: TopMatch[] }) {
  return (
    <Card className={cn(CARD_HOVER_BASE, CARD_HOVER.amber)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
            <Sparkles className="size-4" />
          </span>
          <CardTitle>Top AI matches</CardTitle>
        </div>
        <CardDescription>
          Your highest-scoring candidate–job matches
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {matches.map((m, i) => {
            const overall = Math.round(m.overallScore);
            return (
              <li key={m.id}>
                <Link
                  href={`/candidates/${m.candidateId}`}
                  className="group flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-accent"
                >
                  <span className="w-4 shrink-0 text-center text-sm font-semibold tabular-nums text-muted-foreground">
                    {i + 1}
                  </span>
                  <ScoreRing value={overall} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium transition-colors group-hover:text-primary">
                      {m.candidate.fullName ?? m.candidate.filename}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      for {m.job.title}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      {m.matchedSkills.slice(0, 3).map((s) => (
                        <Badge
                          key={s}
                          variant="secondary"
                          className="rounded-md px-1.5 py-0 text-[10px] font-normal"
                        >
                          {s}
                        </Badge>
                      ))}
                      {m.missingSkills.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {m.missingSkills.length} gap
                          {m.missingSkills.length === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
