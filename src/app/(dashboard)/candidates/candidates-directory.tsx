"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Search,
  Users,
  UploadCloud,
  ArrowUpDown,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Mail,
  Clock,
  MoreHorizontal,
  ExternalLink,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { PIPELINE_STAGES, STAGE_STYLES, isPipelineStage } from "@/lib/pipeline";
import { timeAgo } from "@/lib/activity-meta";
import {
  bulkUpdateStageAction,
  type CandidateDirectoryRow,
} from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  FilterBar,
  applyFilters,
  type FilterField,
  type FilterRule,
} from "@/components/ui/filter-bar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type SortKey = "recent" | "name" | "stage" | "applications";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "Most recent" },
  { key: "name", label: "Name (A–Z)" },
  { key: "stage", label: "Pipeline stage" },
  { key: "applications", label: "Most applications" },
];

const PAGE_SIZE = 15;

// Restrained accent rotation within the existing palette: brand blue, violet,
// emerald — matches the Jobs row-cards. Bar = solid left edge; avatar + skill
// chips share the tint.
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

function displayName(c: CandidateDirectoryRow) {
  return c.fullName ?? c.email ?? "Unnamed candidate";
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

export function CandidatesDirectory({
  candidates,
}: {
  candidates: CandidateDirectoryRow[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [query, filters, sortKey]);

  const filterFields = useMemo<FilterField<CandidateDirectoryRow>[]>(() => {
    const skills = Array.from(
      new Set(candidates.flatMap((c) => c.extractedSkills)),
    ).sort();
    return [
      { key: "skill", label: "Skill", control: { kind: "select", options: skills }, accessor: (c) => c.extractedSkills },
      { key: "stage", label: "Stage", control: { kind: "select", options: [...PIPELINE_STAGES] }, accessor: (c) => c.stages },
      { key: "status", label: "Status", control: { kind: "select", options: ["processing", "ready", "error"] }, accessor: (c) => c.applications.map((a) => a.status) },
      { key: "experience", label: "Experience", control: { kind: "number" }, accessor: (c) => c.yearsExperience ?? null },
      { key: "applied", label: "Applied date", control: { kind: "date" }, accessor: (c) => c.lastActivity },
    ];
  }, [candidates]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const bySearch = candidates.filter((c) => {
      if (!q) return true;
      const name = displayName(c).toLowerCase();
      return (
        name.includes(q) ||
        (c.currentTitle?.toLowerCase().includes(q) ?? false) ||
        (c.email?.toLowerCase().includes(q) ?? false) ||
        c.extractedSkills.some((s) => s.toLowerCase().includes(q)) ||
        c.applications.some((a) => a.jobTitle?.toLowerCase().includes(q) ?? false)
      );
    });
    const byFilters = applyFilters(bySearch, filters, filterFields);
    return [...byFilters].sort((a, b) => {
      if (sortKey === "name") return displayName(a).localeCompare(displayName(b));
      if (sortKey === "applications")
        return b.applications.length - a.applications.length;
      if (sortKey === "stage") {
        return (
          PIPELINE_STAGES.indexOf(a.primaryStage as never) -
          PIPELINE_STAGES.indexOf(b.primaryStage as never)
        );
      }
      return b.lastActivity.getTime() - a.lastActivity.getTime();
    });
  }, [candidates, query, filters, sortKey, filterFields]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = visible.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const allOnPageSelected =
    paged.length > 0 && paged.every((c) => selected.has(c.dedupKey));

  function toggleOne(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function togglePage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) paged.forEach((c) => next.delete(c.dedupKey));
      else paged.forEach((c) => next.add(c.dedupKey));
      return next;
    });
  }

  function applyBulkStage(stage: string) {
    if (!isPipelineStage(stage)) return;
    // Selected dedupKeys map to multiple candidate row ids — fan out all of them.
    const ids: string[] = [];
    for (const c of visible) {
      if (selected.has(c.dedupKey)) {
        for (const a of c.applications) ids.push(a.candidateId);
      }
    }
    if (ids.length === 0) return;
    startTransition(async () => {
      const res = await bulkUpdateStageAction(ids, stage);
      if (res.ok) {
        toast.success(
          `Moved ${res.count} application${res.count === 1 ? "" : "s"} to ${stage}`,
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
            <p className="font-medium">No applicants yet</p>
            <p className="text-sm text-muted-foreground">
              People who apply to your jobs through the candidate portal will
              appear here. Resumes you upload directly live in your talent pool.
            </p>
          </div>
          <Button asChild>
            <Link href="/jobs">
              <UploadCloud className="size-4" /> View jobs
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
            placeholder="Search by name, email, title, skill, or job…"
            className="pl-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Clear"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">
            {visible.length} {visible.length === 1 ? "candidate" : "candidates"}
          </p>
          <FilterBar
            fields={filterFields}
            rules={filters}
            onChange={setFilters}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ArrowUpDown className="size-4" />
                {SORTS.find((s) => s.key === sortKey)?.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {SORTS.map((s) => (
                <DropdownMenuItem
                  key={s.key}
                  onSelect={() => setSortKey(s.key)}
                >
                  {s.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-primary/5 px-3 py-2">
          <p className="text-sm">
            <span className="font-semibold">{selected.size}</span> selected
          </p>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" disabled={pending}>
                  {pending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Move to stage"
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Pipeline stage</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {PIPELINE_STAGES.map((s) => (
                  <DropdownMenuItem
                    key={s}
                    onSelect={() => applyBulkStage(s)}
                  >
                    {s}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelected(new Set())}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Select-all (this page) */}
      {paged.length > 0 && (
        <label className="flex w-fit cursor-pointer items-center gap-2 px-1 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={allOnPageSelected}
            onChange={togglePage}
            aria-label="Select all on this page"
            className="size-3.5 cursor-pointer"
          />
          Select all on this page
        </label>
      )}

      {/* Directory — elevated row-cards */}
      {paged.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No candidates match your filters.
        </p>
      ) : (
        <div className="space-y-3">
          {paged.map((c, i) => (
            <motion.div
              key={c.dedupKey}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.25) }}
            >
              <CandidateRow
                candidate={c}
                selected={selected.has(c.dedupKey)}
                onToggle={() => toggleOne(c.dedupKey)}
                accent={ACCENTS[i % ACCENTS.length]}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {visible.length > PAGE_SIZE && (
        <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
          <span>
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, visible.length)} of{" "}
            {visible.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="size-4" /> Prev
            </Button>
            <span className="px-2 tabular-nums">
              {currentPage} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function CandidateRow({
  candidate: c,
  selected,
  onToggle,
  accent,
}: {
  candidate: CandidateDirectoryRow;
  selected: boolean;
  onToggle: () => void;
  accent: (typeof ACCENTS)[number];
}) {
  const name = displayName(c);
  const profileHref = `/candidates/${c.primaryId}`;
  const SKILLS_SHOWN = 3;
  const extraSkills = Math.max(0, c.extractedSkills.length - SKILLS_SHOWN);

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 overflow-hidden rounded-lg border bg-card/60 py-3 pl-6 pr-3 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md hover:shadow-primary/10",
        selected ? "border-primary/50 bg-primary/[0.04]" : "border-border/60",
      )}
    >
      {/* 4px solid accent bar — always visible */}
      <span
        aria-hidden
        className={cn("absolute inset-y-0 left-0 w-1", accent.bar)}
      />

      {/* Whole card navigates to the profile. This sits UNDER the content
          (z-0); interactive controls below lift themselves to z-10 so they
          stay clickable. Non-interactive content stays unpositioned so clicks
          fall through to this link. */}
      <Link
        href={profileHref}
        aria-label={`View ${name}`}
        className="absolute inset-0 z-0"
      />

      {/* Select checkbox */}
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        aria-label={`Select ${name}`}
        className="relative z-10 size-4 shrink-0 cursor-pointer"
      />

      {/* Avatar — initials (tint matches accent) */}
      <span
        className={cn(
          "flex size-[46px] shrink-0 items-center justify-center rounded-lg text-sm font-semibold",
          accent.avatar,
        )}
      >
        {initials(name)}
      </span>

      {/* Identity */}
      <div className="min-w-0 flex-1 md:w-60 md:flex-none">
        <p className="truncate text-[15px] font-medium leading-tight transition-colors group-hover:text-primary">
          {name}
        </p>
        {c.currentTitle && (
          <p className="truncate text-xs text-muted-foreground">
            {c.currentTitle}
            {c.yearsExperience != null && c.yearsExperience > 0 && (
              <> · {c.yearsExperience} yr{c.yearsExperience === 1 ? "" : "s"}</>
            )}
          </p>
        )}
        {c.email && (
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <Mail className="size-3 shrink-0" />
            <span className="truncate">{c.email}</span>
          </p>
        )}
      </div>

      {/* Skill chips fill the middle (top 3 + overflow) */}
      <div className="hidden min-w-0 flex-1 items-center gap-1.5 overflow-hidden lg:flex">
        {c.extractedSkills.slice(0, SKILLS_SHOWN).map((s) => (
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
        {extraSkills > 0 && (
          <span className="shrink-0 text-[11px] font-medium text-muted-foreground/70">
            +{extraSkills}
          </span>
        )}
      </div>

      {/* Applications dropdown */}
      <div className="relative z-10 hidden shrink-0 sm:block">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-xs font-medium transition-colors hover:border-border hover:bg-accent"
            >
              <Briefcase className="size-3.5 text-muted-foreground" />
              {c.applications.length}
              <span className="text-muted-foreground">
                {c.applications.length === 1 ? "job" : "jobs"}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="text-xs">
              Applications
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {c.applications.map((a) => (
              <DropdownMenuItem
                key={a.candidateId}
                asChild
                className="flex flex-col items-start gap-0.5 py-2"
              >
                <Link href={`/candidates/${a.candidateId}`}>
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                      {a.jobTitle ?? "Untitled job"}
                    </span>
                    <Badge
                      className={cn(
                        "shrink-0 border-0",
                        (STAGE_STYLES as Record<string, string>)[a.stage] ??
                          "",
                      )}
                    >
                      {a.stage}
                    </Badge>
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Applied {timeAgo(a.uploadedAt)}
                  </span>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stage */}
      <div className="flex shrink-0 items-center gap-1">
        <Badge
          className={cn(
            "border-0",
            (STAGE_STYLES as Record<string, string>)[c.primaryStage] ??
              "bg-muted text-muted-foreground",
          )}
        >
          {c.primaryStage}
        </Badge>
        {c.stages.length > 1 && (
          <Badge variant="outline" className="text-[11px] font-normal">
            +{c.stages.length - 1}
          </Badge>
        )}
      </div>

      {/* Last activity */}
      <span className="hidden shrink-0 items-center gap-1 text-xs text-muted-foreground md:inline-flex">
        <Clock className="size-3.5" /> {timeAgo(c.lastActivity)}
      </span>

      {/* Actions */}
      <div className="relative z-10 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Actions"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={profileHref}>
                <ExternalLink className="size-3.5" /> View profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a
                href={`/api/candidates/${c.primaryId}/file`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileText className="size-3.5" /> Open resume
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
