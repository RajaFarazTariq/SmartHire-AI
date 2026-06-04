"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Briefcase,
  ArrowRight,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion } from "motion/react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      <div className="relative mb-6 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, company, or skill…"
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No jobs match “{query}”.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paged.map((job, i) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
            >
              <Card className="group relative flex h-full flex-col gap-0 overflow-hidden rounded-lg border-border/60 bg-card py-0 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md hover:shadow-primary/15">
                {/* Subtle engineered top accent line (brand accent) */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-40 transition-opacity duration-150 group-hover:opacity-100"
                />
                {/* Stretched link makes the whole card clickable (sits under the menu) */}
                <Link
                  href={`/jobs/${job.id}`}
                  aria-label={job.title}
                  className="absolute inset-0 z-0"
                />

                {/* NOTE: this wrapper must stay UN-positioned (no `relative`)
                    so the stretched Link below paints on top and keeps the
                    whole card clickable. The menu opts above it via z-10. */}
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[15px] font-semibold leading-snug tracking-tight">
                      {job.title}
                    </h3>
                    <div className="relative z-10 -mr-1.5 -mt-1.5">
                      <JobCardMenu jobId={job.id} jobTitle={job.title} />
                    </div>
                  </div>

                  {job.company && (
                    <p className="-mt-2 text-xs text-muted-foreground">
                      {job.company}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {job.requiredSkills.slice(0, 4).map((s) => (
                      <Badge
                        key={s}
                        variant="outline"
                        className="rounded-md border-border/60 bg-muted/30 px-2 py-0 text-[11px] font-medium text-muted-foreground"
                      >
                        {s}
                      </Badge>
                    ))}
                    {job.requiredSkills.length > 4 && (
                      <Badge
                        variant="outline"
                        className="rounded-md border-border/60 px-2 py-0 text-[11px] font-medium text-muted-foreground/70"
                      >
                        +{job.requiredSkills.length - 4}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
                    <span className="font-medium uppercase tracking-wide">
                      {job.minExperience != null
                        ? `${job.minExperience}+ yrs`
                        : "Any experience"}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-primary opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                      View <ArrowRight className="size-3" />
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
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
