"use client";

import * as React from "react";
import { subDays, subMonths, subYears, endOfDay } from "date-fns";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { Card, Chip, Stat, EmptyState, Spinner, Input } from "@/components/ui";
import { fmtNumber, fmtVolume, pct } from "@/lib/utils";
import { MUSCLE_COLORS, type MuscleGroup } from "@/lib/muscles";
import type { AnalyticsData, MuscleStat } from "@/server/analytics";

type PeriodKey = "1w" | "1m" | "3m" | "6m" | "1y" | "all" | "custom";
type Metric = "volume" | "sets" | "reps" | "workouts";

const PERIODS: Array<{ key: PeriodKey; label: string }> = [
  { key: "1w", label: "1W" },
  { key: "1m", label: "1M" },
  { key: "3m", label: "3M" },
  { key: "6m", label: "6M" },
  { key: "1y", label: "1Y" },
  { key: "all", label: "All" },
  { key: "custom", label: "Custom" },
];

const METRICS: Array<{ key: Metric; label: string }> = [
  { key: "volume", label: "Volume" },
  { key: "sets", label: "Sets" },
  { key: "reps", label: "Reps" },
  { key: "workouts", label: "Workouts" },
];

function computeRange(
  key: PeriodKey,
  customFrom: string,
  customTo: string,
): { from: Date | null; to: Date | null } {
  const now = new Date();
  switch (key) {
    case "1w":
      return { from: subDays(now, 7), to: null };
    case "1m":
      return { from: subMonths(now, 1), to: null };
    case "3m":
      return { from: subMonths(now, 3), to: null };
    case "6m":
      return { from: subMonths(now, 6), to: null };
    case "1y":
      return { from: subYears(now, 1), to: null };
    case "all":
      return { from: null, to: null };
    case "custom":
      return {
        from: customFrom ? new Date(customFrom) : null,
        to: customTo ? endOfDay(new Date(customTo)) : null,
      };
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
}

function metricValue(m: MuscleStat, metric: Metric): number {
  switch (metric) {
    case "volume":
      return m.volume;
    case "sets":
      return m.sets;
    case "reps":
      return m.reps;
    case "workouts":
      return m.workouts;
    default: {
      const _exhaustive: never = metric;
      return _exhaustive;
    }
  }
}

export function AnalyticsDashboard() {
  const [period, setPeriod] = React.useState<PeriodKey>("1m");
  const [customFrom, setCustomFrom] = React.useState("");
  const [customTo, setCustomTo] = React.useState("");
  const [metric, setMetric] = React.useState<Metric>("volume");
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [loading, setLoading] = React.useState(true);

  const markLoading = React.useCallback(() => setLoading(true), []);

  const query = React.useMemo(() => {
    const { from, to } = computeRange(period, customFrom, customTo);
    const sp = new URLSearchParams();
    if (from) sp.set("from", from.toISOString());
    if (to) sp.set("to", to.toISOString());
    return sp.toString();
  }, [period, customFrom, customTo]);

  React.useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/analytics?${query}`, { signal: controller.signal })
      .then((r) => r.json() as Promise<AnalyticsData>)
      .then((d) => setData(d))
      .catch((err: unknown) => {
        if (!(err instanceof DOMException && err.name === "AbortError")) setData(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [query]);

  const denom = data
    ? metric === "volume"
      ? data.totals.volume
      : metric === "sets"
        ? data.totals.sets
        : metric === "reps"
          ? data.totals.reps
          : data.totals.workouts
    : 0;

  const muscles = (data?.muscles ?? [])
    .map((m) => ({ ...m, value: metricValue(m, metric) }))
    .filter((m) => m.value > 0)
    .sort((a, b) => b.value - a.value);

  const pieData = muscles.map((m) => ({
    name: m.group,
    value: m.value,
    color: MUSCLE_COLORS[m.group as MuscleGroup],
  }));

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Period selector */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {PERIODS.map((p) => (
          <Chip
            key={p.key}
            active={period === p.key}
            onClick={() => {
              markLoading();
              setPeriod(p.key);
            }}
          >
            {p.label}
          </Chip>
        ))}
      </div>

      {period === "custom" && (
        <div className="flex gap-2">
          <Input
            type="date"
            value={customFrom}
            onChange={(e) => {
              markLoading();
              setCustomFrom(e.target.value);
            }}
          />
          <Input
            type="date"
            value={customTo}
            onChange={(e) => {
              markLoading();
              setCustomTo(e.target.value);
            }}
          />
        </div>
      )}

      {loading && !data ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : !data || data.totals.workouts === 0 ? (
        <EmptyState
          icon={<BarChart3 size={24} />}
          title="No data for this period"
          description="Complete some workouts to see your training analytics."
        />
      ) : (
        <>
          {/* Totals */}
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Workouts" value={fmtNumber(data.totals.workouts)} />
            <Stat label="Volume" value={fmtVolume(data.totals.volume)} />
            <Stat label="Sets" value={fmtNumber(data.totals.sets)} />
            <Stat label="Reps" value={fmtNumber(data.totals.reps)} />
          </div>

          {/* Weekly volume trend */}
          {data.trend.length > 1 && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Weekly volume</h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.trend} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "var(--color-subtle)", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={20}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--color-elevated)" }}
                      contentStyle={{
                        background: "var(--color-elevated)",
                        border: "1px solid var(--color-line)",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      formatter={(value) => [fmtVolume(Number(value)), "Volume"]}
                    />
                    <Bar dataKey="volume" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Muscle split */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Muscle split</h3>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
              {METRICS.map((m) => (
                <Chip key={m.key} active={metric === m.key} onClick={() => setMetric(m.key)}>
                  {m.label}
                </Chip>
              ))}
            </div>

            {pieData.length > 0 && (
              <div className="h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={84}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {pieData.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-elevated)",
                        border: "1px solid var(--color-line)",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      formatter={(value, name) => [
                        metric === "volume" ? fmtVolume(Number(value)) : fmtNumber(Number(value)),
                        String(name),
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="space-y-2.5">
              {muscles.map((m) => (
                <div key={m.group}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: MUSCLE_COLORS[m.group as MuscleGroup] }}
                      />
                      <span className="font-medium">{m.group}</span>
                    </div>
                    <div className="text-muted tabular-nums">
                      {metric === "volume" ? fmtVolume(m.value) : fmtNumber(m.value)}
                      <span className="text-subtle ml-1.5">{pct(m.value, denom)}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-elevated overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct(m.value, denom)}%`,
                        background: MUSCLE_COLORS[m.group as MuscleGroup],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
