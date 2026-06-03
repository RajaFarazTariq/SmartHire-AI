"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const [stageFilter, setStageFilter] = useState<string>("All");
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [query, stageFilter, sortKey]);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = { All: candidates.length };
    for (const s of PIPELINE_STAGES) counts[s] = 0;
    for (const c of candidates) {
      for (const s of c.stages) {
        if (s in counts) counts[s] += 1;
      }
    }
    return counts;
  }, [candidates]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = candidates.filter((c) => {
      if (stageFilter !== "All" && !c.stages.includes(stageFilter)) return false;
      if (!q) return true;
      const name = displayName(c).toLowerCase();
      return (
        name.includes(q) ||
        (c.currentTitle?.toLowerCase().includes(q) ?? false) ||
        (c.email?.toLowerCase().includes(q) ?? false) ||
        c.extractedSkills.some((s) => s.toLowerCase().includes(q)) ||
        c.applications.some((a) =>
          a.jobTitle?.toLowerCase().includes(q) ?? false,
        )
      );
    });
    return [...list].sort((a, b) => {
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
  }, [candidates, query, stageFilter, sortKey]);

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

      {/* Stage filter */}
      <div className="flex flex-wrap gap-1.5">
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

      {/* Directory table */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-9 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={togglePage}
                    aria-label="Select all on this page"
                    className="cursor-pointer"
                  />
                </th>
                <th className="px-3 py-2.5">Candidate</th>
                <th className="hidden px-3 py-2.5 lg:table-cell">Skills</th>
                <th className="px-3 py-2.5">Applications</th>
                <th className="px-3 py-2.5">Stage</th>
                <th className="hidden px-3 py-2.5 xl:table-cell">Recruiter</th>
                <th className="hidden px-3 py-2.5 md:table-cell">
                  Last activity
                </th>
                <th className="w-9 px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paged.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-12 text-center text-sm text-muted-foreground"
                  >
                    No candidates match your filters.
                  </td>
                </tr>
              ) : (
                paged.map((c) => (
                  <CandidateRow
                    key={c.dedupKey}
                    candidate={c}
                    selected={selected.has(c.dedupKey)}
                    onToggle={() => toggleOne(c.dedupKey)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {visible.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t px-3 py-2.5 text-xs text-muted-foreground">
            <span>
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, visible.length)} of{" "}
              {visible.length}
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7"
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
                variant="ghost"
                className="h-7"
                onClick={() =>
                  setPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage >= totalPages}
              >
                Next <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CandidateRow({
  candidate: c,
  selected,
  onToggle,
}: {
  candidate: CandidateDirectoryRow;
  selected: boolean;
  onToggle: () => void;
}) {
  const name = displayName(c);
  const profileHref = `/candidates/${c.primaryId}`;
  const SKILLS_SHOWN = 3;
  const extraSkills = Math.max(0, c.extractedSkills.length - SKILLS_SHOWN);

  return (
    <tr className="transition-colors hover:bg-accent/30">
      <td className="px-3 py-2.5 align-top">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          aria-label={`Select ${name}`}
          className="mt-0.5 cursor-pointer"
        />
      </td>

      {/* Candidate identity */}
      <td className="px-3 py-2.5 align-top">
        <Link href={profileHref} className="flex items-start gap-3 group">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials(name)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-foreground group-hover:text-primary">
              {name}
            </span>
            {c.currentTitle && (
              <span className="block truncate text-xs text-muted-foreground">
                {c.currentTitle}
                {c.yearsExperience != null && c.yearsExperience > 0 && (
                  <> · {c.yearsExperience} yr{c.yearsExperience === 1 ? "" : "s"}</>
                )}
              </span>
            )}
            {c.email && (
              <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                <Mail className="size-3" />
                <span className="truncate">{c.email}</span>
              </span>
            )}
          </span>
        </Link>
      </td>

      {/* Skills */}
      <td className="hidden px-3 py-2.5 align-top lg:table-cell">
        {c.extractedSkills.length === 0 ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {c.extractedSkills.slice(0, SKILLS_SHOWN).map((s) => (
              <Badge key={s} variant="secondary" className="font-normal">
                {s}
              </Badge>
            ))}
            {extraSkills > 0 && (
              <Badge variant="outline" className="font-normal">
                +{extraSkills}
              </Badge>
            )}
          </div>
        )}
      </td>

      {/* Applications */}
      <td className="px-3 py-2.5 align-top">
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
          <DropdownMenuContent align="start" className="w-72">
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
      </td>

      {/* Stage */}
      <td className="px-3 py-2.5 align-top">
        <div className="flex flex-wrap gap-1">
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
      </td>

      {/* Recruiter */}
      <td className="hidden px-3 py-2.5 align-top xl:table-cell">
        <span className="text-xs text-muted-foreground">
          {c.uploaderName ?? "—"}
        </span>
      </td>

      {/* Last activity */}
      <td className="hidden px-3 py-2.5 align-top md:table-cell">
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3.5" /> {timeAgo(c.lastActivity)}
        </span>
      </td>

      {/* Actions */}
      <td className="px-3 py-2.5 align-top">
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
      </td>
    </tr>
  );
}
