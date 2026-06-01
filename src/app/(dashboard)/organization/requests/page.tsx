import Link from "next/link";
import { ArrowLeft, UserPlus, Mail, Clock, Inbox } from "lucide-react";

import { requireWorkspace } from "@/lib/org";
import { isAdmin } from "@/lib/rbac";
import { timeAgo } from "@/lib/activity-meta";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getOrgJoinRequests } from "./actions";
import { RequestRowActions } from "./row-actions";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rejected: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

export default async function OrgRequestsPage() {
  const { role } = await requireWorkspace();
  const { pending, decided } = await getOrgJoinRequests();
  const admin = isAdmin(role);

  return (
    <div>
      <Link
        href="/organization"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Organization
      </Link>

      <PageHeader
        title="Join requests"
        description={
          admin
            ? "Approve or reject recruiters asking to join your organization."
            : "Pending requests are reviewed by an organization admin."
        }
      />

      {pending.length === 0 && decided.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Inbox className="size-6" />
          </span>
          <div>
            <p className="font-medium">No join requests yet</p>
            <p className="text-sm text-muted-foreground">
              When someone requests to join your team, it'll show up here.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <section>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
              Pending ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pending requests.
              </p>
            ) : (
              <div className="space-y-2">
                {pending.map((r) => (
                  <Card key={r.id} className="gap-0">
                    <CardContent className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <UserPlus className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {r.requesterName ?? r.requesterEmail}
                        </p>
                        <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="size-3.5" /> {r.requesterEmail}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="size-3.5" /> {timeAgo(r.createdAt)}
                          </span>
                        </p>
                        {r.message && (
                          <p className="mt-1.5 rounded-md bg-muted/40 p-2 text-xs">
                            {r.message}
                          </p>
                        )}
                      </div>
                      {admin && <RequestRowActions id={r.id} />}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {decided.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
                Decided ({decided.length})
              </h2>
              <div className="space-y-2">
                {decided.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 rounded-xl border bg-card p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {r.requesterName ?? r.requesterEmail}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.requesterEmail} ·{" "}
                        {r.decidedAt ? timeAgo(r.decidedAt) : timeAgo(r.createdAt)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                        STATUS_STYLES[r.status] ?? "",
                      )}
                    >
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
