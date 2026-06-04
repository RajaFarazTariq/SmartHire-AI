import Link from "next/link";
import { redirect } from "next/navigation";
import { Hourglass, Building2, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

import { Brand } from "@/components/brand";
import { requireDbUser } from "@/lib/auth";
import { getActiveOrgId } from "@/lib/access";
import { timeAgo } from "@/lib/activity-meta";
import { cn } from "@/lib/utils";
import { getMyJoinRequests } from "../actions";
import { CancelRequestButton } from "./cancel-button";
import { EnterOrgButton } from "./enter-org-button";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rejected: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

export default async function PendingPage() {
  await requireDbUser();
  if (await getActiveOrgId()) redirect("/dashboard");

  const requests = await getMyJoinRequests();

  // No requests at all — bounce back to the onboarding chooser.
  if (requests.length === 0) redirect("/onboarding");

  const pending = requests.find((r) => r.status === "pending");
  // Show the "enter" CTA for an approved org when nothing is still pending.
  const approved = !pending
    ? requests.find((r) => r.status === "approved")
    : undefined;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/30 p-6">
      <Brand />

      <div className="w-full max-w-md space-y-3 rounded-xl border bg-card p-6 text-center shadow-card">
        <span
          className={cn(
            "mx-auto flex size-12 items-center justify-center rounded-full",
            approved
              ? "bg-emerald-500/15 text-emerald-500"
              : "bg-amber-500/15 text-amber-500",
          )}
        >
          {approved ? (
            <CheckCircle2 className="size-6" />
          ) : (
            <Hourglass className="size-6" />
          )}
        </span>
        <h1 className="text-lg font-semibold">
          {pending
            ? "Waiting for approval"
            : approved
              ? "You're approved!"
              : "Your join requests"}
        </h1>
        {pending ? (
          <p className="text-sm text-muted-foreground">
            We've notified the admin of <strong>{pending.orgName}</strong>.
            You'll be able to sign in to the recruiter dashboard once they
            approve your request.
          </p>
        ) : approved ? (
          <p className="text-sm text-muted-foreground">
            Your request to join <strong>{approved.orgName}</strong> was
            approved. Enter your workspace to get started.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            None of your requests are awaiting a decision. You can join another
            organization or create your own.
          </p>
        )}

        {approved && (
          <div className="pt-1">
            <EnterOrgButton
              orgId={approved.orgId}
              orgName={approved.orgName}
              className="w-full"
            />
          </div>
        )}
      </div>

      <div className="w-full max-w-md space-y-2">
        {requests.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-3 rounded-xl border bg-card p-3"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              {r.status === "approved" ? (
                <CheckCircle2 className="size-4 text-emerald-500" />
              ) : r.status === "rejected" ? (
                <XCircle className="size-4 text-rose-500" />
              ) : (
                <Building2 className="size-4" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{r.orgName}</p>
              <p className="text-xs text-muted-foreground">
                Requested {timeAgo(r.createdAt)}
                {r.decidedAt
                  ? ` · ${r.status === "approved" ? "approved" : "declined"} ${timeAgo(r.decidedAt)}`
                  : ""}
              </p>
            </div>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                STATUS_STYLES[r.status] ?? "",
              )}
            >
              {r.status}
            </span>
            {r.status === "pending" && <CancelRequestButton id={r.id} />}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to options
        </Link>
        <span className="text-muted-foreground">·</span>
        <Link
          href="/onboarding/join"
          className="font-medium text-primary hover:underline"
        >
          Search another organization
        </Link>
      </div>
    </div>
  );
}
