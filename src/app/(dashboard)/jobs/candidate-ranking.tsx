"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Score, Candidate } from "@prisma/client";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MatchSummary } from "./match-summary";

type ScoreWithCandidate = Score & { candidate: Candidate };

const SORTS = [
  { key: "overallScore", label: "Overall" },
  { key: "semanticScore", label: "Semantic" },
  { key: "skillMatchScore", label: "Skills" },
  { key: "experienceScore", label: "Experience" },
] as const;

type SortKey = (typeof SORTS)[number]["key"];

function tone(score: number) {
  if (score >= 75) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-rose-600";
}

function barTone(score: number) {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-rose-500";
}

function SubScore({ label, value }: { label: string; value: number }) {
  const v = Math.round(value);
  return (
    <div className="flex-1">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{v}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", barTone(v))}
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  );
}

export function CandidateRanking({
  scores,
}: {
  scores: ScoreWithCandidate[];
}) {
  const [sortKey, setSortKey] = useState<SortKey>("overallScore");

  const sorted = useMemo(
    () => [...scores].sort((a, b) => b[sortKey] - a[sortKey]),
    [scores, sortKey],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Sort by</span>
        <div className="inline-flex rounded-lg border bg-muted/40 p-0.5">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSortKey(s.key)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                sortKey === s.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {sorted.map((s, i) => {
        const overall = Math.round(s.overallScore);
        return (
          <Card key={s.id}>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                    {i + 1}
                  </span>
                  <div>
                    <Link
                      href={`/candidates/${s.candidateId}`}
                      className="font-semibold hover:text-primary"
                    >
                      {s.candidate.fullName ?? s.candidate.filename}
                    </Link>
                    {s.candidate.currentTitle && (
                      <p className="text-xs text-muted-foreground">
                        {s.candidate.currentTitle}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("text-2xl font-bold leading-none", tone(overall))}>
                    {overall}
                  </p>
                  <p className="text-xs text-muted-foreground">overall</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
                <SubScore label="Semantic" value={s.semanticScore} />
                <SubScore label="Skills" value={s.skillMatchScore} />
                <SubScore label="Experience" value={s.experienceScore} />
              </div>

              {(s.matchedSkills.length > 0 || s.missingSkills.length > 0) && (
                <div className="flex flex-wrap gap-1.5">
                  {s.matchedSkills.map((skill) => (
                    <Badge key={`m-${skill}`} variant="success" className="gap-1 font-normal">
                      <CheckCircle2 className="size-3" />
                      {skill}
                    </Badge>
                  ))}
                  {s.missingSkills.map((skill) => (
                    <Badge key={`x-${skill}`} variant="outline" className="gap-1 font-normal text-muted-foreground">
                      <XCircle className="size-3" />
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}

              {s.aiSummary && <MatchSummary summary={s.aiSummary} />}

              <Link
                href={`/candidates/${s.candidateId}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                View candidate <ArrowRight className="size-3.5" />
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
