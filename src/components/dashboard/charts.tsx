"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  PIPELINE_STAGES,
  STAGE_CHART_COLORS,
  type PipelineStage,
} from "@/lib/pipeline";

const axisTick = { fill: "var(--muted-foreground)", fontSize: 12 } as const;

const slug = (s: string) => s.replace(/[^a-z0-9]/gi, "-").toLowerCase();

// Shared premium tooltip — styled with our tokens, soft blur + shadow.
function ChartTooltip({
  active,
  payload,
  label,
  suffix = "",
}: {
  active?: boolean;
  payload?: { value?: number; payload?: { stage?: string } }[];
  label?: string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0];
  const title = point.payload?.stage ?? label;
  return (
    <div className="rounded-lg border bg-popover/95 px-3 py-2 shadow-xl backdrop-blur-sm">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <p className="text-sm font-semibold tabular-nums">
        {point.value}
        <span className="font-normal text-muted-foreground">{suffix}</span>
      </p>
    </div>
  );
}

// Vertical columns (reference style): one bar per stage with the count on top
// and rotated stage labels along the x-axis. Reads best in a full-width card.
export function PipelineChart({
  stageCounts,
}: {
  stageCounts: Record<PipelineStage, number>;
}) {
  const data = PIPELINE_STAGES.map((stage) => ({
    stage,
    count: stageCounts[stage] ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={340}>
      <BarChart
        data={data}
        margin={{ top: 24, right: 12, left: -8, bottom: 56 }}
        barCategoryGap="20%"
      >
        <defs>
          {data.map((d) => {
            const c = STAGE_CHART_COLORS[d.stage];
            return (
              <linearGradient
                key={d.stage}
                id={`vbar-${slug(d.stage)}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={c} stopOpacity={0.95} />
                <stop offset="100%" stopColor={c} stopOpacity={0.45} />
              </linearGradient>
            );
          })}
        </defs>
        <CartesianGrid
          vertical={false}
          stroke="var(--border)"
          strokeDasharray="3 3"
        />
        <XAxis
          dataKey="stage"
          tick={{ ...axisTick, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval={0}
          angle={-35}
          textAnchor="end"
          height={56}
        />
        <YAxis
          allowDecimals={false}
          tick={axisTick}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          content={<ChartTooltip suffix=" candidates" />}
        />
        <Bar
          dataKey="count"
          radius={[6, 6, 0, 0]}
          maxBarSize={48}
          animationDuration={900}
          animationEasing="ease-out"
        >
          <LabelList
            dataKey="count"
            position="top"
            fill="var(--foreground)"
            fontSize={11}
            fontWeight={600}
          />
          {data.map((d) => (
            <Cell key={d.stage} fill={`url(#vbar-${slug(d.stage)})`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ScoreDistributionChart({
  data,
}: {
  data: { range: string; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="score-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.95} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.4} />
          </linearGradient>
        </defs>
        <CartesianGrid
          vertical={false}
          stroke="var(--border)"
          strokeDasharray="3 3"
        />
        <XAxis
          dataKey="range"
          tick={axisTick}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={axisTick}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          content={<ChartTooltip suffix=" matches" />}
        />
        <Bar
          dataKey="count"
          radius={[6, 6, 0, 0]}
          maxBarSize={56}
          fill="url(#score-grad)"
          animationDuration={900}
          animationEasing="ease-out"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendAreaChart({
  data,
}: {
  data: { week: string; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="trend-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          vertical={false}
          stroke="var(--border)"
          strokeDasharray="3 3"
        />
        <XAxis
          dataKey="week"
          tick={axisTick}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={axisTick}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip
          cursor={{ stroke: "var(--primary)", strokeOpacity: 0.3, strokeWidth: 2 }}
          content={<ChartTooltip suffix=" uploads" />}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="var(--primary)"
          strokeWidth={2.5}
          fill="url(#trend-grad)"
          dot={{ r: 3, fill: "var(--primary)", strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 0 }}
          animationDuration={1000}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
