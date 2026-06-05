"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Search, Briefcase, CheckCircle2, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  FilterBar,
  applyFilters,
  type FilterField,
  type FilterRule,
} from "@/components/ui/filter-bar";
import type { BrowseJob } from "@/app/portal/jobs/actions";

// Restrained accent rotation within the existing palette: brand blue, violet,
// emerald. Bar = solid left edge; avatar + skill chips share the tint.
const ACCENTS = [
  {
    bar: "bg-primary",
    avatar: "bg-primary/10 text-primary",
    chip: "border-primary/30 bg-primary/10 text-primary",
  },
  {
    bar: "bg-violet-500",
    avatar: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    chip: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    bar: "bg-emerald-500",
    avatar: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
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
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const applied = useMemo(() => new Set(appliedIds), [appliedIds]);

  const filterFields = useMemo<FilterField<BrowseJob>[]>(() => {
    const skills = Array.from(
      new Set(jobs.flatMap((j) => [...j.requiredSkills, ...j.preferredSkills])),
    ).sort();
    return [
      { key: "skill", label: "Skill", control: { kind: "select", options: skills }, accessor: (j) => [...j.requiredSkills, ...j.preferredSkills] },
      { key: "experience", label: "Experience", control: { kind: "number" }, accessor: (j) => j.minExperience ?? null },
      { key: "company", label: "Company", control: { kind: "text" }, accessor: (j) => j.company ?? "" },
      { key: "title", label: "Title", control: { kind: "text" }, accessor: (j) => j.title },
      { key: "application", label: "Application", control: { kind: "select", options: ["Applied", "Not applied"] }, accessor: (j) => (applied.has(j.id) ? "Applied" : "Not applied") },
    ];
  }, [jobs, applied]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const bySearch = !term
      ? jobs
      : jobs.filter(
          (j) =>
            j.title.toLowerCase().includes(term) ||
            (j.company ?? "").toLowerCase().includes(term) ||
            j.requiredSkills.some((s) => s.toLowerCase().includes(term)),
        );
    return applyFilters(bySearch, filters, filterFields);
  }, [jobs, q, filters, filterFields]);

  return (
    <div className="space-y-5">
      {/* Search + filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, company, or skill…"
            className="h-11 pl-9"
          />
        </div>
        <FilterBar fields={filterFields} rules={filters} onChange={setFilters} />
      </div>

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
                        className={cn(
                          "shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-medium",
                          accent.chip,
                        )}
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
