import Link from "next/link";
import { Plus, UploadCloud, Users, Briefcase, ArrowRight } from "lucide-react";

import { getDashboardStats } from "./actions";
import { PageHeader } from "@/components/dashboard/page-header";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { TopMatches } from "@/components/dashboard/top-matches";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import {
  PipelineChart,
  ScoreDistributionChart,
} from "@/components/dashboard/charts-lazy";
import { FadeIn } from "@/components/motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const greeting = stats.fullName ?? stats.username ?? stats.email.split("@")[0];

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Welcome back, ${greeting}`}
        description="Your recruitment overview and hiring analytics."
      >
        <Button asChild variant="outline">
          <Link href="/upload">
            <UploadCloud className="size-4" /> Upload
          </Link>
        </Button>
        <Button asChild>
          <Link href="/jobs/new">
            <Plus className="size-4" /> New job
          </Link>
        </Button>
      </PageHeader>

      <KpiCards
        jobs={stats.jobCount}
        candidates={stats.candidateCount}
        avgMatch={stats.avgMatchScore}
        hired={stats.hiredCount}
        processing={stats.processingCount}
        ready={stats.readyCount}
      />

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-2">
        <FadeIn delay={0.05}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Hiring pipeline</CardTitle>
              <CardDescription>
                Candidates by stage across all jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PipelineChart stageCounts={stats.stageCounts} />
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Match score distribution</CardTitle>
              <CardDescription>
                {stats.scoredCount > 0
                  ? `Across ${stats.scoredCount} scored match${stats.scoredCount === 1 ? "" : "es"}`
                  : "Score candidates against jobs to see analytics"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScoreDistributionChart data={stats.scoreDistribution} />
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Top matches + activity */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {stats.topMatches.length > 0 ? (
            <FadeIn delay={0.05}>
              <TopMatches matches={stats.topMatches} />
            </FadeIn>
          ) : (
            <Card className="h-full border-dashed">
              <CardContent className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
                <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Briefcase className="size-5" />
                </span>
                <div>
                  <p className="font-medium">No matches yet</p>
                  <p className="text-sm text-muted-foreground">
                    Create a job, upload resumes, then score candidates to see
                    your top matches.
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link href="/jobs/new">
                    <Plus className="size-4" /> Create a job
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <FadeIn delay={0.1}>
          <Card className="h-full">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Recent activity</CardTitle>
                <CardDescription>Latest actions in your workspace</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/activity">
                  View all <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <ActivityFeed items={stats.recentActivity} />
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction href="/jobs/new" icon={Plus} label="Post a job" />
          <QuickAction href="/upload" icon={UploadCloud} label="Upload resumes" />
          <QuickAction href="/candidates" icon={Users} label="View candidates" />
          <QuickAction href="/jobs" icon={Briefcase} label="Manage jobs" />
        </CardContent>
      </Card>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-lg border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-accent"
    >
      <span className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <span className="text-sm font-medium">{label}</span>
      </span>
      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
