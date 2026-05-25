"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

function ChartSkeleton({ height = 240 }: { height?: number }) {
  return <Skeleton className="w-full rounded-lg" style={{ height }} />;
}

// Recharts is heavy (~150kB); load it in its own chunk on the client only.
export const PipelineChart = dynamic(
  () => import("./charts").then((m) => m.PipelineChart),
  { ssr: false, loading: () => <ChartSkeleton height={300} /> },
);

export const ScoreDistributionChart = dynamic(
  () => import("./charts").then((m) => m.ScoreDistributionChart),
  { ssr: false, loading: () => <ChartSkeleton height={240} /> },
);

export const TrendAreaChart = dynamic(
  () => import("./charts").then((m) => m.TrendAreaChart),
  { ssr: false, loading: () => <ChartSkeleton height={260} /> },
);
