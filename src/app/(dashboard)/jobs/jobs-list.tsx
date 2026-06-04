"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Briefcase,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FilterBar,
  applyFilters,
  type FilterField,
  type FilterRule,
} from "@/components/ui/filter-bar";
import type { JobListItem } from "./actions";

const PAGE_SIZE = 12;

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

const JOB_FILTER_FIELDS = (
  jobs: JobListItem[],
): FilterField<JobListItem>[] => {
  const skills = Array.from(
    new Set(jobs.flatMap((j) => j.requiredSkills)),
  ).sort();
  return [
    { key: "skill", label: "Skill", control: { kind: "select", options: skills }, accessor: (j) => j.requiredSkills },
    { key: "experience", label: "Experience", control: { kind: "number" }, accessor: (j) => j.minExperience ?? null },
    { key: "company", label: "Company", control: { kind: "text" }, accessor: (j) => j.company ?? "" },
    { key: "title", label: "Title", control: { kind: "text" }, accessor: (j) => j.title },
  ];
};

export function JobsList({ jobs }: { jobs: JobListItem[] }) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [query, filters]);

  const filterFields = useMemo(() => JOB_FILTER_FIELDS(jobs), [jobs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const bySearch = !q
      ? jobs
      : jobs.filter(
          (j) =>
            j.title.toLowerCase().includes(q) ||
            (j.company?.toLowerCase().includes(q) ?? false) ||
            j.requiredSkills.some((s) => s.toLowerCase().includes(q)),
        );
    return applyFilters(bySearch, filters, filterFields);
  }, [jobs, query, filters, filterFields]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  if (jobs.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Briefcase className="size-6" />
          </span>
          <div>
            <p className="font-medium">No jobs yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first job posting to start screening candidates.
            </p>
          </div>
          <Button asChild>
            <Link href="/jobs/new">
              <Plus className="size-4" /> New job
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, company, or skill…"
            className="pl-9"
          />
        </div>
        <FilterBar fields={filterFields} rules={filters} onChange={setFilters} />
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        We&apos;ve found{" "}
        <span className="font-medium text-foreground">{filtered.length}</span>{" "}
        job{filtered.length === 1 ? "" : "s"}
      </p>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No jobs match “{query}”.
        </p>
      ) : (
        <div className="space-y-3">
          {paged.map((job, i) => {
            const initial = job.company?.trim()?.[0]?.toUpperCase();
            const accent = ACCENTS[i % ACCENTS.length];
            const skills = job.requiredSkills;
            const extra = skills.length - 3;
            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.25) }}
              >
                {/* Whole card is the link — no menu on the row, so no stacking
                    needed. Edit/delete stay on the job detail page. */}
                <Link
                  href={`/jobs/${job.id}`}
                  className="group relative flex items-center gap-3.5 overflow-hidden rounded-lg border border-border/60 bg-card/60 py-3 pl-6 pr-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md hover:shadow-primary/10"
                >
                  {/* 4px solid accent bar — always visible */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-y-0 left-0 w-1",
                      accent.bar,
                    )}
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
                    {job.company && (
                      <p className="truncate text-xs text-muted-foreground">
                        {job.company}
                      </p>
                    )}
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

      {filtered.length > PAGE_SIZE && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4" /> Prev
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
