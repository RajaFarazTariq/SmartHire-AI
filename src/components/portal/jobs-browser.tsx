"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Search,
  Briefcase,
  Clock,
  CheckCircle2,
  Building2,
  SlidersHorizontal,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { CARD_HOVER, CARD_HOVER_BASE } from "@/lib/card-accents";
import { timeAgo } from "@/lib/activity-meta";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { BrowseJob } from "@/app/portal/jobs/actions";

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
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((job, i) => {
            const hasApplied = applied.has(job.id);
            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
              >
                <Link href={`/portal/jobs/${job.id}`} className="block h-full">
                  <Card
                    className={cn(
                      "group h-full gap-0 p-5",
                      CARD_HOVER_BASE,
                      CARD_HOVER.primary,
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold transition-colors group-hover:text-primary">
                          {job.title}
                        </h3>
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Building2 className="size-3.5 shrink-0" />
                          {job.company ?? "Confidential"}
                        </p>
                      </div>
                      {hasApplied && (
                        <Badge className="shrink-0 gap-1 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400">
                          <CheckCircle2 className="size-3" /> Applied
                        </Badge>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {job.requiredSkills.slice(0, 4).map((s) => (
                        <Badge key={s} variant="secondary" className="font-normal">
                          {s}
                        </Badge>
                      ))}
                      {job.requiredSkills.length > 4 && (
                        <Badge variant="secondary" className="font-normal">
                          +{job.requiredSkills.length - 4}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5" /> {timeAgo(job.createdAt)}
                      </span>
                      {job.minExperience != null && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="size-3.5" /> {job.minExperience}+ yrs
                        </span>
                      )}
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
