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

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { JobCardMenu } from "./job-card-menu";
import type { JobListItem } from "./actions";

const PAGE_SIZE = 12;

export function JobsList({ jobs }: { jobs: JobListItem[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        (j.company?.toLowerCase().includes(q) ?? false) ||
        j.requiredSkills.some((s) => s.toLowerCase().includes(q)),
    );
  }, [jobs, query]);

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
      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, company, or skill…"
          className="pl-9"
        />
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
        <div className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60 bg-card">
          {paged.map((job, i) => {
            const initial = job.company?.trim()?.[0]?.toUpperCase();
            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.25) }}
              >
                <div className="group relative flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-primary/[0.04]">
                  {/* Accent indicator on hover (brand colour) */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-0 w-0.5 bg-primary opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                  />
                  {/* Stretched link keeps the whole row clickable (under the menu).
                      Siblings stay un-positioned so the link paints on top. */}
                  <Link
                    href={`/jobs/${job.id}`}
                    aria-label={job.title}
                    className="absolute inset-0 z-0"
                  />

                  {/* Icon anchor — company initial, else a job glyph */}
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
                    {initial ?? <Briefcase className="size-4" />}
                  </span>

                  {/* Title + company */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold leading-tight">
                      {job.title}
                    </p>
                    {job.company && (
                      <p className="truncate text-xs text-muted-foreground">
                        {job.company}
                      </p>
                    )}
                  </div>

                  {/* Experience pill */}
                  <span className="hidden shrink-0 rounded-md border border-border/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:inline-block">
                    {job.minExperience != null
                      ? `${job.minExperience}+ yrs`
                      : "Any"}
                  </span>

                  {/* Three-dot menu — above the stretched link */}
                  <div className="relative z-10 shrink-0">
                    <JobCardMenu jobId={job.id} jobTitle={job.title} />
                  </div>
                </div>
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
