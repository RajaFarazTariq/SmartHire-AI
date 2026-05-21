"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Candidate } from "@prisma/client";
import {
  Search,
  Users,
  UploadCloud,
  ArrowRight,
  ArrowUpDown,
  Loader2,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
  PIPELINE_STAGES,
  STAGE_STYLES,
  STAGE_CHART_COLORS,
  isPipelineStage,
} from "@/lib/pipeline";
import { bulkUpdateStageAction } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type SortKey = "recent" | "name" | "stage";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "Most recent" },
  { key: "name", label: "Name (A–Z)" },
  { key: "stage", label: "Pipeline stage" },
];

function statusVariant(status: string) {
  if (status === "ready") return "success" as const;
  if (status === "error") return "destructive" as const;
  return "warning" as const;
}

function displayName(c: Candidate) {
  return c.fullName ?? c.filename;
}

export function CandidatesList({ candidates }: { candidates: Candidate[] }) {
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("All");
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = { All: candidates.length };
    for (const s of PIPELINE_STAGES) counts[s] = 0;
    for (const c of candidates) {
      if (c.stage in counts) counts[c.stage] += 1;
    }
    return counts;
  }, [candidates]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = candidates.filter((c) => {
      if (stageFilter !== "All" && c.stage !== stageFilter) return false;
      if (!q) return true;
      return (
        (c.fullName?.toLowerCase().includes(q) ?? false) ||
        c.filename.toLowerCase().includes(q) ||
        (c.currentTitle?.toLowerCase().includes(q) ?? false) ||
        c.extractedSkills.some((s) => s.toLowerCase().includes(q))
      );
    });
    return [...list].sort((a, b) => {
      if (sortKey === "name") {
        return displayName(a).localeCompare(displayName(b));
      }
      if (sortKey === "stage") {
        return (
          PIPELINE_STAGES.indexOf(a.stage as never) -
          PIPELINE_STAGES.indexOf(b.stage as never)
        );
      }
      return b.uploadedAt.getTime() - a.uploadedAt.getTime();
    });
  }, [candidates, query, stageFilter, sortKey]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function applyBulkStage(stage: string) {
    const ids = [...selected];
    startTransition(async () => {
      const res = await bulkUpdateStageAction(ids, stage);
      if (res.ok) {
        toast.success(
          `Moved ${res.count} candidate${res.count === 1 ? "" : "s"} to ${stage}`,
        );
        setSelected(new Set());
        router.refresh();
      } else {
        toast.error(res.error ?? "Bulk update failed");
      }
    });
  }

  if (candidates.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Users className="size-6" />
          </span>
          <div>
            <p className="font-medium">No candidates yet</p>
            <p className="text-sm text-muted-foreground">
              Upload resumes to start building your candidate pool.
            </p>
          </div>
          <Button asChild>
            <Link href="/upload">
              <UploadCloud className="size-4" /> Upload resumes
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search candidates…"
            className="pl-9"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <ArrowUpDown className="size-4" />
              {SORTS.find((s) => s.key === sortKey)?.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {SORTS.map((s) => (
              <DropdownMenuItem key={s.key} onSelect={() => setSortKey(s.key)}>
                {s.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stage filter */}
      <div className="flex flex-wrap gap-2">
        {["All", ...PIPELINE_STAGES].map((s) => (
          <button
            key={s}
            onClick={() => setStageFilter(s)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              stageFilter === s
                ? "border-primary bg-primary/10 text-primary"
                : "border-transparent bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {s}
            <span className="ml-1.5 opacity-70">{stageCounts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-accent/50 px-4 py-2.5">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" disabled={pending}>
                  {pending && <Loader2 className="size-4 animate-spin" />}
                  Move to stage
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Set pipeline stage</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {PIPELINE_STAGES.map((s) => (
                  <DropdownMenuItem key={s} onSelect={() => applyBulkStage(s)}>
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: STAGE_CHART_COLORS[s] }}
                    />
                    {s}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected(new Set())}
            >
              <X className="size-4" /> Clear
            </Button>
          </div>
        </div>
      )}

      {/* Grid */}
      {visible.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No candidates match your filters.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
            >
              <Card
                className={cn(
                  "group relative h-full gap-3 py-5 transition-all hover:border-primary/30 hover:shadow-md",
                  selected.has(c.id) && "border-primary ring-1 ring-primary/30",
                )}
              >
                <Link
                  href={`/candidates/${c.id}`}
                  aria-label={displayName(c)}
                  className="absolute inset-0 z-0 rounded-xl"
                />
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggle(c.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select ${displayName(c)}`}
                      className="relative z-10 mt-1 size-4 cursor-pointer accent-[var(--primary)]"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold leading-tight">
                        {displayName(c)}
                      </h3>
                      {c.currentTitle && (
                        <p className="truncate text-sm text-muted-foreground">
                          {c.currentTitle}
                        </p>
                      )}
                    </div>
                    <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                  </div>
                  {c.extractedSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {c.extractedSkills.slice(0, 4).map((s) => (
                        <Badge key={s} variant="secondary" className="font-normal">
                          {s}
                        </Badge>
                      ))}
                      {c.extractedSkills.length > 4 && (
                        <Badge variant="outline" className="font-normal">
                          +{c.extractedSkills.length - 4}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Skills not yet extracted
                    </p>
                  )}
                </CardContent>
                <CardFooter className="justify-between text-xs text-muted-foreground">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      isPipelineStage(c.stage) ? STAGE_STYLES[c.stage] : "bg-muted",
                    )}
                  >
                    {c.stage}
                  </span>
                  <span className="relative z-10 flex items-center gap-1 font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
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
