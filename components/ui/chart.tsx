"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    color?: string;
  }
>;

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a ChartContainer");
  }

  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  style,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ReactNode;
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;
  const chartVars = Object.entries(config).reduce<Record<string, string>>(
    (vars, [key, value]) => {
      if (value.color) {
        vars[`--color-${key}`] = value.color;
      }
      return vars;
    },
    {},
  );

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-grid_line]:stroke-border/70 [&_.recharts-tooltip-cursor]:fill-muted [&_.recharts-tooltip-cursor]:opacity-40",
          className,
        )}
        style={{ ...chartVars, ...style } as React.CSSProperties}
        {...props}
      >
        {children}
      </div>
    </ChartContext.Provider>
  );
}

function ChartTooltipContent({
  className,
  active,
  payload,
}: {
  className?: string;
  active?: boolean;
  payload?: Array<{
    dataKey?: string | number;
    value?: number | string;
    color?: string;
    name?: string | number;
  }>;
}) {
  const { config } = useChart();

  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "grid min-w-32 gap-1.5 rounded-lg border bg-background px-2.5 py-2 text-xs shadow-xl",
        className,
      )}
    >
      {payload.map((item) => {
        const key = String(item.dataKey || item.name || "");
        const label = config[key]?.label || item.name || key;

        return (
          <div key={key} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span
                className="size-2.5 rounded-[2px]"
                style={{ backgroundColor: item.color }}
              />
              <span>{label}</span>
            </div>
            <span className="font-mono font-medium tabular-nums text-foreground">
              {item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export { ChartContainer, ChartTooltipContent };
