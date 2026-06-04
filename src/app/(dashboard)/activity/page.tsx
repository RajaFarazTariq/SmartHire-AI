import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { activityIcon, timeAgo } from "@/lib/activity-meta";
import { getOrgActivity } from "./actions";
import { ActivityFilters } from "./activity-filters";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { FilterRule } from "@/components/ui/filter-bar";

function buildQuery(params: { f?: string; page?: number }) {
  const sp = new URLSearchParams();
  if (params.f) sp.set("f", params.f);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const q = sp.toString();
  return q ? `/activity?${q}` : "/activity";
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? "1") || 1;

  let rules: FilterRule[] = [];
  try {
    if (sp.f) {
      const parsed = JSON.parse(sp.f);
      if (Array.isArray(parsed)) {
        rules = parsed.map((r, i) => ({
          id: typeof r?.id === "string" ? r.id : `flt-${i}`,
          field: String(r?.field ?? ""),
          operator: String(r?.operator ?? ""),
          value: String(r?.value ?? ""),
        }));
      }
    }
  } catch {
    /* malformed filter param — ignore */
  }

  const { items, total, pageSize } = await getOrgActivity({ rules, page });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilters = rules.length > 0;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Activity log"
        description="An audit trail of actions taken across your organization."
      />

      {/* Filter */}
      <div className="mb-6 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {total} event{total === 1 ? "" : "s"}
        </p>
        <ActivityFilters rules={rules} />
      </div>

      <Card>
        <CardContent className="py-2">
          {items.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No activity recorded{hasFilters ? " for these filters" : ""} yet.
            </p>
          ) : (
            <ul className="divide-y">
              {items.map((a) => {
                const Icon = activityIcon(a.type);
                const actor =
                  a.user.fullName ??
                  a.user.username ??
                  a.user.email.split("@")[0];
                return (
                  <li key={a.id} className="flex items-start gap-3 py-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug">{a.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {actor} · {timeAgo(a.createdAt)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              disabled={page <= 1}
              className={page <= 1 ? "pointer-events-none opacity-50" : ""}
            >
              <Link href={buildQuery({ f: sp.f, page: page - 1 })}>
                <ChevronLeft className="size-4" /> Prev
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
            >
              <Link href={buildQuery({ f: sp.f, page: page + 1 })}>
                Next <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
