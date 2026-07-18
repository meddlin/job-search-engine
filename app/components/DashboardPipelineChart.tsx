"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { PipelineItem } from "@/app/dashboard-data";

const chartConfig = {
  count: {
    label: "Applications",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export default function DashboardPipelineChart({
  pipeline,
}: {
  pipeline: PipelineItem[];
}) {
  return (
    <ChartContainer config={chartConfig} className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={pipeline}
          margin={{ top: 8, right: 8, bottom: 0, left: -24 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            interval={0}
            tickMargin={8}
            tick={{ fontSize: 11 }}
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={false}
            content={<ChartTooltipContent />}
          />
          <Bar
            dataKey="count"
            fill="var(--color-count)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
