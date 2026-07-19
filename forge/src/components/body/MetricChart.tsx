"use client";

import * as React from "react";
import { format, subMonths, subYears } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Chip } from "@/components/ui";
import { fmtWeight, fmtCompact } from "@/lib/utils";
import type { MetricGoal } from "@/lib/body-metrics";
import type { MetricPoint } from "@/server/body";

type RangeKey = "1m" | "3m" | "6m" | "1y" | "all";
const RANGES: Array<{ key: RangeKey; label: string }> = [
  { key: "1m", label: "1M" },
  { key: "3m", label: "3M" },
  { key: "6m", label: "6M" },
  { key: "1y", label: "1Y" },
  { key: "all", label: "All" },
];

function rangeStart(key: RangeKey): Date | null {
  const now = new Date();
  switch (key) {
    case "1m":
      return subMonths(now, 1);
    case "3m":
      return subMonths(now, 3);
    case "6m":
      return subMonths(now, 6);
    case "1y":
      return subYears(now, 1);
    case "all":
      return null;
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
}

export function MetricChart({
  series,
  unit,
  goal,
}: {
  series: MetricPoint[];
  unit: string;
  goal: MetricGoal | null;
}) {
  const [range, setRange] = React.useState<RangeKey>("6m");

  const data = React.useMemo(() => {
    const start = rangeStart(range);
    return series
      .filter((p) => (start ? new Date(p.date) >= start : true))
      .map((p) => ({ label: format(new Date(p.date), "MMM d"), value: p.value }));
  }, [series, range]);

  const latest = data.length > 0 ? data[data.length - 1].value : null;
  const first = data.length > 0 ? data[0].value : null;
  const change = latest != null && first != null ? latest - first : null;

  return (
    <div>
      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="text-xs text-subtle uppercase tracking-wide">Latest</div>
          <div className="text-3xl font-bold tabular-nums">
            {latest != null ? fmtWeight(latest) : "—"}
            <span className="text-base text-muted ml-1">{unit}</span>
          </div>
          {change != null && change !== 0 && (
            <div className={`text-xs font-medium ${change > 0 ? "text-success" : "text-danger"}`}>
              {change > 0 ? "+" : ""}
              {fmtWeight(change)} {unit} in range
            </div>
          )}
        </div>
        <div className="flex gap-1.5">
          {RANGES.map((r) => (
            <Chip key={r.key} active={range === r.key} onClick={() => setRange(r.key)}>
              {r.label}
            </Chip>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-sm text-subtle">
          No data in this range
        </div>
      ) : (
        <div className="h-56 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="metricFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--color-subtle)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis
                tick={{ fill: "var(--color-subtle)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={40}
                domain={["auto", "auto"]}
                tickFormatter={(v: number) => fmtCompact(v)}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-elevated)",
                  border: "1px solid var(--color-line)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(value) => [`${fmtWeight(Number(value))} ${unit}`, "Value"]}
              />
              {goal?.target != null && (
                <ReferenceLine
                  y={goal.target}
                  stroke="var(--color-success)"
                  strokeDasharray="4 4"
                  label={{
                    value: `Goal ${fmtWeight(goal.target)}`,
                    fill: "var(--color-success)",
                    fontSize: 10,
                    position: "insideTopRight",
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-accent)"
                strokeWidth={2.5}
                fill="url(#metricFill)"
                dot={{ r: 2.5, fill: "var(--color-accent)" }}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
