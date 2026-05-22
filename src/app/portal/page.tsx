import Link from "next/link";
import {
  ClipboardList,
  Loader2,
  CalendarCheck,
  Trophy,
  ArrowRight,
  Building2,
  Search,
  UserRound,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

import { requireDbUser } from "@/lib/auth";
import { getCandidateContext, profileCompleteness } from "@/lib/candidate";
import { timeAgo } from "@/lib/activity-meta";
import { getMyApplications } from "./applications/actions";
import { listOpenJobs, getAppliedJobIds } from "./jobs/actions";
import { StatusBadge } from "@/components/portal/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

export default async function PortalHome() {
  const user = await requireDbUser();
  const [{ profile }, applications, jobs, appliedIds] = await Promise.all([
    getCandidateContext(),
    getMyApplications(),
    listOpenJobs(),
    getAppliedJobIds(),
  ]);

  const firstName =
    (user.fullName ?? user.username ?? user.email.split("@")[0]).split(" ")[0];

  const completion = profileCompleteness(profile);
  const appliedSet = new Set(appliedIds);
  const recommended = jobs.filter((j) => !appliedSet.has(j.id)).slice(0, 3);

  const stats: { label: string; value: number; icon: LucideIcon; tint: string }[] =
    [
      {
        label: "Applications",
        value: applications.length,
        icon: ClipboardList,
        tint: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      },
      {
        label: "In review",
        value: applications.filter(
          (a) => !["Hired", "Rejected", "Applied"].includes(a.stage),
        ).length,
        icon: Loader2,
        tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      },
      {
        label: "Interviews",
        value: applications.filter((a) =>
          ["Interview Scheduled", "Technical Assessment"].includes(a.stage),
        ).length,
        icon: CalendarCheck,
        tint: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
      },
      {
        label: "Offers",
        value: applications.filter((a) => a.stage === "Hired").length,
        icon: Trophy,
        tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      },
    ];

  const recent = applications.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s how your job search is going.
          </p>
        </div>
        <Button asChild>
          <Link href="/portal/jobs">
            <Search className="size-4" /> Browse jobs
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="gap-0 py-4 transition-shadow hover:shadow-sm">
              <CardContent className="flex items-center justify-between gap-2 px-4">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="mt-0.5 text-2xl font-bold tabular-nums">
                    {s.value}
                  </p>
                </div>
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${s.tint}`}
                >
                  <Icon className="size-5" />
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Profile completion nudge */}
      {completion < 100 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <UserRound className="size-5" />
              </span>
              <div>
                <p className="text-sm font-medium">Complete your profile</p>
                <p className="text-xs text-muted-foreground">
                  A complete profile helps recruiters find you faster.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden w-28 sm:block">
                <Progress value={completion} className="h-2" />
              </div>
              <span className="text-sm font-semibold tabular-nums">
                {completion}%
              </span>
              <Button asChild size="sm" variant="outline">
                <Link href="/portal/profile">Complete</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent applications */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Recent applications</CardTitle>
            {applications.length > 0 && (
              <Link
                href="/portal/applications"
                className="text-sm font-medium text-primary hover:underline"
              >
                View all
              </Link>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {recent.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                <ClipboardList className="size-6" />
                <p className="text-sm">You haven&apos;t applied to any roles yet.</p>
              </div>
            ) : (
              recent.map((a) => (
                <Link
                  key={a.id}
                  href={`/portal/applications/${a.id}`}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.jobTitle}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.company ?? "Confidential"} · {timeAgo(a.createdAt)}
                    </p>
                  </div>
                  <StatusBadge stage={a.stage} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recommended jobs */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Recommended for you</CardTitle>
            <Link
              href="/portal/jobs"
              className="text-sm font-medium text-primary hover:underline"
            >
              See all
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {recommended.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                <Briefcase className="size-6" />
                <p className="text-sm">No new roles right now. Check back soon.</p>
              </div>
            ) : (
              recommended.map((j) => (
                <Link
                  key={j.id}
                  href={`/portal/jobs/${j.id}`}
                  className="group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium group-hover:text-primary">
                      {j.title}
                    </p>
                    <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                      <Building2 className="size-3" />
                      {j.company ?? "Confidential"}
                    </p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
