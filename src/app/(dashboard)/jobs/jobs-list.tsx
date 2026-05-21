"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Job } from "@prisma/client";
import { Search, Briefcase, ArrowRight, Plus } from "lucide-react";
import { motion } from "motion/react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { JobCardMenu } from "./job-card-menu";

export function JobsList({ jobs }: { jobs: Job[] }) {
  const [query, setQuery] = useState("");

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
          {filtered.map((job, i) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
            >
              <Card className="group relative h-full gap-4 py-5 transition-all hover:border-primary/30 hover:shadow-md">
                {/* Stretched link makes the whole card clickable (sits under the menu) */}
                <Link
                  href={`/jobs/${job.id}`}
                  aria-label={job.title}
                  className="absolute inset-0 z-0 rounded-xl"
                />
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-tight">{job.title}</h3>
                    <div className="relative z-10">
                      <JobCardMenu jobId={job.id} jobTitle={job.title} />
                    </div>
                  </div>
                  {job.company && (
                    <p className="text-sm text-muted-foreground">{job.company}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {job.requiredSkills.slice(0, 4).map((s) => (
                      <Badge key={s} variant="secondary" className="font-normal">
                        {s}
                      </Badge>
                    ))}
                    {job.requiredSkills.length > 4 && (
                      <Badge variant="outline" className="font-normal">
                        +{job.requiredSkills.length - 4}
                      </Badge>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="justify-between text-xs text-muted-foreground">
                  <span>
                    {job.minExperience != null
                      ? `${job.minExperience}+ yrs`
                      : "Any experience"}
                  </span>
                  <span className="flex items-center gap-1 font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    View <ArrowRight className="size-3.5" />
                  </span>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
