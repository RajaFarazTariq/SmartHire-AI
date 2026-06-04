"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Search,
  Briefcase,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { BrowseJob } from "@/app/portal/jobs/actions";

// Restrained accent rotation within the existing palette: brand blue, muted
// purple, muted teal. Bar = solid left edge; avatar = matching tint.
const ACCENTS = [
  { bar: "bg-primary", avatar: "bg-primary/10 text-primary" },
  {
    bar: "bg-violet-500",
    avatar: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    bar: "bg-teal-500",
    avatar: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  },
];

export function JobsBrowser({
  jobs,
  appliedIds,
}: {
  jobs: BrowseJob[];
  appliedIds: string[];
}) {
  const [q, setQ] = useState("");
  const [skill, setSkill] = useState<string | null>(null);
  const applied = useMemo(() => new Set(appliedIds), [appliedIds]);

  const topSkills = useMemo(() => {
    const counts = new Map<string, number>();
    for (const j of jobs) {
      for (const s of j.requiredSkills) counts.set(s, (counts.get(s) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([s]) => s);
  }, [jobs]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return jobs.filter((j) => {
      const matchesTerm =
        !term ||
        j.title.toLowerCase().includes(term) ||
        (j.company ?? "").toLowerCase().includes(term) ||
        j.requiredSkills.some((s) => s.toLowerCase().includes(term));
      const matchesSkill =
        !skill ||
        j.requiredSkills.includes(skill) ||
        j.preferredSkills.includes(skill);
      return matchesTerm && matchesSkill;
    });
  }, [jobs, q, skill]);

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title, company, or skill…"
          className="h-11 pl-9"
        />
      </div>

      {/* Skill filters */}
      {topSkills.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <SlidersHorizontal className="size-3.5" /> Filter:
          </span>
          {topSkills.map((s) => (
            <button
              key={s}
              onClick={() => setSkill(skill === s ? null : s)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                skill === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {s}
            </button>
          ))}
          {skill && (
            <button
              onClick={() => setSkill(null)}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "role" : "roles"}
        {jobs.length !== filtered.length ? ` of ${jobs.length}` : ""}
      </p>

      {/* Results */}
      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <Briefcase className="size-8 text-muted-foreground" />
          <p className="font-medium">No matching roles</p>
          <p className="text-sm text-muted-foreground">
            Try a different search or clear your filters.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((job, i) => {
            const hasApplied = applied.has(job.id);
            const initial = job.company?.trim()?.[0]?.toUpperCase();
            const accent = ACCENTS[i % ACCENTS.length];
            const skills = job.requiredSkills;
            const extra = skills.length - 3;
            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
              >
                <Link
                  href={`/portal/jobs/${job.id}`}
                  className="group relative flex items-center gap-3.5 overflow-hidden rounded-lg border border-border/60 bg-card/60 py-3 pl-6 pr-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md hover:shadow-primary/10"
                >
                  {/* 4px solid accent bar — always visible */}
                  <span
                    aria-hidden
                    className={cn("absolute inset-y-0 left-0 w-1", accent.bar)}
                  />

                  {/* Avatar — company initial (tint matches accent) */}
                  <span
                    className={cn(
                      "flex size-[46px] shrink-0 items-center justify-center rounded-lg text-base font-semibold",
                      accent.avatar,
                    )}
                  >
                    {initial ?? <Briefcase className="size-5" />}
                  </span>

                  {/* Title + company */}
                  <div className="min-w-0 flex-1 md:w-56 md:flex-none">
                    <p className="truncate text-[15px] font-medium leading-tight">
                      {job.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {job.company ?? "Confidential"}
                    </p>
                  </div>

                  {/* Skill chips fill the middle (top 3 + overflow) */}
                  <div className="hidden min-w-0 flex-1 items-center gap-1.5 overflow-hidden md:flex">
                    {skills.slice(0, 3).map((s) => (
                      <span
                        key={s}
                        className="shrink-0 rounded-md border border-border/60 bg-muted/30 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                      >
                        {s}
                      </span>
                    ))}
                    {extra > 0 && (
                      <span className="shrink-0 text-[11px] font-medium text-muted-foreground/70">
                        +{extra}
                      </span>
                    )}
                  </div>

                  {/* Applied status (kept — candidate-specific) */}
                  {hasApplied && (
                    <Badge className="shrink-0 gap-1 border-0 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400">
                      <CheckCircle2 className="size-3" /> Applied
                    </Badge>
                  )}

                  {/* Experience pill */}
                  <span className="hidden shrink-0 rounded-md border border-border/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:inline-block">
                    {job.minExperience != null
                      ? `${job.minExperience}+ yrs`
                      : "Any"}
                  </span>

                  {/* Chevron */}
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground/50 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
