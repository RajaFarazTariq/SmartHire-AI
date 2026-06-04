"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Building2, Clock, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { CARD_HOVER, CARD_HOVER_BASE } from "@/lib/card-accents";
import { timeAgo } from "@/lib/activity-meta";
import { PIPELINE_STAGES } from "@/lib/pipeline";
import { StatusBadge } from "@/components/portal/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  FilterBar,
  applyFilters,
  type FilterField,
  type FilterRule,
} from "@/components/ui/filter-bar";
import type { MyApplication } from "@/app/portal/applications/actions";

export function ApplicationsList({
  applications,
}: {
  applications: MyApplication[];
}) {
  const [filters, setFilters] = useState<FilterRule[]>([]);

  const filterFields = useMemo<FilterField<MyApplication>[]>(() => {
    const companies = Array.from(
      new Set(applications.map((a) => a.company).filter(Boolean) as string[]),
    ).sort();
    return [
      { key: "stage", label: "Stage", control: { kind: "select", options: [...PIPELINE_STAGES] }, accessor: (a) => a.stage },
      { key: "company", label: "Company", control: companies.length ? { kind: "select", options: companies } : { kind: "text" }, accessor: (a) => a.company ?? "" },
      { key: "job", label: "Job", control: { kind: "text" }, accessor: (a) => a.jobTitle },
      { key: "applied", label: "Applied date", control: { kind: "date" }, accessor: (a) => a.createdAt },
    ];
  }, [applications]);

  const filtered = useMemo(
    () => applyFilters(applications, filters, filterFields),
    [applications, filters, filterFields],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {filtered.length} application{filtered.length === 1 ? "" : "s"}
        </p>
        <FilterBar fields={filterFields} rules={filters} onChange={setFilters} />
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No applications match your filters.
        </p>
      ) : (
        filtered.map((a) => (
          <Link
            key={a.id}
            href={`/portal/applications/${a.id}`}
            className="block"
          >
            <Card
              className={cn("group gap-0", CARD_HOVER_BASE, CARD_HOVER.primary)}
            >
              <CardContent className="flex items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold transition-colors group-hover:text-primary">
                    {a.jobTitle}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="size-3.5" />
                      {a.company ?? "Confidential"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5" /> Applied {timeAgo(a.createdAt)}
                    </span>
                  </p>
                </div>
                <StatusBadge stage={a.stage} />
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </CardContent>
            </Card>
          </Link>
        ))
      )}
    </div>
  );
}
