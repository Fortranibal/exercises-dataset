"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Chip } from "@/components/ui";
import { fmtCompact, fmtWeight } from "@/lib/utils";
import type { ExerciseSessionPoint } from "@/server/progress";

type Metric = "bestWeight" | "est1RM" | "volume" | "totalReps";

const METRICS: Array<{ key: Metric; label: string; unit: string }> = [
  { key: "bestWeight", label: "Heaviest", unit: "kg" },
  { key: "est1RM", label: "Est. 1RM", unit: "kg" },
  { key: "volume", label: "Volume", unit: "kg" },
  { key: "totalReps", label: "Reps", unit: "" },
];

export function ProgressChart({ sessions }: { sessions: ExerciseSessionPoint[] }) {
  const [metric, setMetric] = React.useState<Metric>("bestWeight");
  const active = METRICS.find((m) => m.key === metric)!;

  const data = sessions.map((s) => ({
    label: format(new Date(s.date), "MMM d"),
    value: s[metric],
  }));

  const current = data.length > 0 ? data[data.length - 1].value : 0;
  const best = data.reduce((mx, d) => Math.max(mx, d.value), 0);

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
        {METRICS.map((m) => (
          <Chip key={m.key} active={metric === m.key} onClick={() => setMetric(m.key)}>
            {m.label}
          </Chip>
        ))}
      </div>

      <div className="flex items-end justify-between mb-2">
        <div>
          <div className="text-xs text-subtle uppercase tracking-wide">Latest</div>
          <div className="text-2xl font-bold tabular-nums">
            {fmtWeight(current)}
            {active.unit && <span className="text-base text-muted ml-1">{active.unit}</span>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-subtle uppercase tracking-wide">Best</div>
          <div className="text-lg font-semibold tabular-nums text-accent">
            {fmtWeight(best)}
            {active.unit && <span className="text-sm ml-0.5">{active.unit}</span>}
          </div>
        </div>
      </div>

      <div className="h-56 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
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
              tickFormatter={(v: number) => fmtCompact(v)}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-elevated)",
                border: "1px solid var(--color-line)",
                borderRadius: 12,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--color-muted)" }}
              formatter={(value) => [
                `${fmtWeight(Number(value))} ${active.unit}`.trim(),
                active.label,
              ]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--color-accent)"
              strokeWidth={2.5}
              fill="url(#progressFill)"
              dot={{ r: 2.5, fill: "var(--color-accent)" }}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
