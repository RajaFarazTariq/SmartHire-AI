import Link from "next/link";
import {
  Plus,
  UploadCloud,
  Briefcase,
  ArrowRight,
  TrendingUp,
  GitBranch,
  BarChart3,
  Filter,
} from "lucide-react";

import { getDashboardStats } from "./actions";
import { PageHeader } from "@/components/dashboard/page-header";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { DashboardInsights } from "@/components/dashboard/dashboard-insights";
import { TopMatches } from "@/components/dashboard/top-matches";
import { ConversionFunnel } from "@/components/dashboard/conversion-funnel";
import { RecentUploads } from "@/components/dashboard/recent-uploads";
import {
  PipelineChart,
  ScoreDistributionChart,
  TrendAreaChart,
} from "@/components/dashboard/charts-lazy";
import { FadeIn } from "@/components/motion";
import { cn } from "@/lib/utils";
import { CARD_HOVER, CARD_HOVER_BASE } from "@/lib/card-accents";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

function SectionTitle({
  icon: Icon,
  tint,
  title,
  description,
}: {
  icon: React.ElementType;
  tint: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          tint,
        )}
      >
        <Icon className="size-4" />
      </span>
      <div>
        <CardTitle>{title}</CardTitle>
        {description && (
          <CardDescription className="mt-0.5">{description}</CardDescription>
        )}
      </div>
    </div>
  );
}

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

      {/* Insight widgets */}
      <DashboardInsights
        upcomingInterviews={stats.upcomingInterviews}
        pendingReviews={stats.pendingReviews}
        velocity={stats.velocity}
      />

      {/* Trend + funnel — equal-height row */}
      <div className="grid gap-5 lg:grid-cols-3">
        <FadeIn delay={0.05} className="h-full lg:col-span-2">
          <Card
            className={cn(
              "h-full overflow-hidden bg-gradient-to-br from-card to-primary/[0.04]",
              CARD_HOVER_BASE,
              CARD_HOVER.primary,
            )}
          >
            <CardHeader>
              <SectionTitle
                icon={TrendingUp}
                tint="bg-primary/10 text-primary"
                title="Hiring trend"
                description="New candidates added per week (last 8 weeks)"
              />
            </CardHeader>
            <CardContent>
              <TrendAreaChart data={stats.weeklyTrend} />
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.1} className="h-full">
          <Card className={cn("h-full", CARD_HOVER_BASE, CARD_HOVER.violet)}>
            <CardHeader>
              <SectionTitle
                icon={Filter}
                tint="bg-violet-500/10 text-violet-500"
                title="Conversion funnel"
                description="Candidates reaching each stage"
              />
            </CardHeader>
            <CardContent>
              <ConversionFunnel stageCounts={stats.stageCounts} />
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Pipeline + score distribution — equal-height row */}
      <div className="grid gap-5 lg:grid-cols-2">
        <FadeIn delay={0.05} className="h-full">
          <Card className={cn("h-full", CARD_HOVER_BASE, CARD_HOVER.emerald)}>
            <CardHeader>
              <SectionTitle
                icon={GitBranch}
                tint="bg-emerald-500/10 text-emerald-500"
                title="Hiring pipeline"
                description="Candidates by stage across all jobs"
              />
            </CardHeader>
            <CardContent>
              <PipelineChart stageCounts={stats.stageCounts} />
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.1} className="h-full">
          <Card className={cn("h-full", CARD_HOVER_BASE, CARD_HOVER.blue)}>
            <CardHeader>
              <SectionTitle
                icon={BarChart3}
                tint="bg-blue-500/10 text-blue-500"
                title="Match score distribution"
                description={
                  stats.scoredCount > 0
                    ? `Across ${stats.scoredCount} scored match${stats.scoredCount === 1 ? "" : "es"}`
                    : "Score candidates against jobs to see analytics"
                }
              />
            </CardHeader>
            <CardContent>
              <ScoreDistributionChart data={stats.scoreDistribution} />
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Recent uploads — full width */}
      <FadeIn delay={0.05}>
        <Card className={cn(CARD_HOVER_BASE, CARD_HOVER.cyan)}>
          <CardHeader className="flex flex-row items-center justify-between">
            <SectionTitle
              icon={UploadCloud}
              tint="bg-cyan-500/10 text-cyan-500"
              title="Recent uploads"
              description="Latest resumes added to your workspace"
            />
            <Button asChild variant="ghost" size="sm">
              <Link href="/candidates">
                All <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <RecentUploads items={stats.recentUploads} />
          </CardContent>
        </Card>
      </FadeIn>

      {/* Top AI matches — full-width rectangle */}
      {stats.topMatches.length > 0 ? (
        <FadeIn delay={0.1}>
          <TopMatches matches={stats.topMatches} />
        </FadeIn>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Briefcase className="size-5" />
            </span>
            <div>
              <p className="font-medium">No matches yet</p>
              <p className="text-sm text-muted-foreground">
                Create a job, upload resumes, then score candidates to see your
                top matches.
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
  );
}
