"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
  ComposedChart,
} from "recharts";
import { format, parseISO } from "date-fns";
import { CHART, CHART_TOOLTIP } from "@/lib/charts/theme";
import { formatNumber } from "@/lib/utils";

type Point = {
  date: string;
  weightKg: number;
  bodyFatPct: number;
  leanMassKg: number;
  fatMassKg: number;
};

export function BodyRecompChart({ data }: { data: Point[] }) {
  const chart = useMemo(() => {
    let lastMonth = "";
    return data.map((r, i) => {
      const month = format(parseISO(r.date), "MMM");
      const showMonth = month !== lastMonth;
      lastMonth = month;
      return {
        ...r,
        idx: i,
        label: format(parseISO(r.date), "MMM d"),
        monthTick: showMonth ? month : "",
      };
    });
  }, [data]);

  const summary = useMemo(() => {
    if (chart.length < 2) return null;
    const start = chart[0];
    const end = chart[chart.length - 1];
    const lost = start.weightKg - end.weightKg;
    const fatLost = start.fatMassKg - end.fatMassKg;
    const leanDelta = end.leanMassKg - start.leanMassKg;
    const fatShare =
      lost > 0.05 ? Math.max(0, Math.min(100, (fatLost / lost) * 100)) : null;
    return { start, end, lost, fatLost, leanDelta, fatShare };
  }, [chart]);

  const yDomain = useMemo(() => {
    if (chart.length === 0) return [0, 100] as [number, number];
    const leanMin = Math.min(...chart.map((d) => d.leanMassKg));
    const weightMax = Math.max(...chart.map((d) => d.weightKg));
    const lo = Math.floor(leanMin * 0.92);
    const hi = Math.ceil(weightMax * 1.03);
    return [lo, hi] as [number, number];
  }, [chart]);

  const leanFloor = useMemo(() => {
    if (chart.length === 0) return 0;
    return Math.min(...chart.map((d) => d.leanMassKg));
  }, [chart]);

  if (chart.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 px-4 py-16 text-center text-sm text-[var(--mute)]">
        Add body logs with weight + body-fat % to unlock recomposition.
      </div>
    );
  }

  return (
    <section className="chart-panel relative overflow-hidden">
      <div className="border-b border-white/6 px-5 pb-4 pt-5 md:px-7">
        <h2 className="text-[15px] font-semibold uppercase tracking-[0.14em] text-[var(--highlight)] md:text-base">
          Body recomposition
        </h2>
        <p className="mt-2 text-[13px] text-[var(--mute)]">
          {summary && summary.lost > 0.05
            ? `where the ${formatNumber(summary.lost, 1)} kg went.`
            : "lean mass vs fat mass over time."}
        </p>
      </div>

      <div className="relative px-2 pb-4 pt-2 md:px-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-3">
          <div className="flex items-center gap-4 text-[11px] uppercase tracking-[0.1em] text-[var(--mute)]">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ background: CHART.lean }}
              />
              Lean mass
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ background: CHART.fat }}
              />
              Fat mass
            </span>
          </div>
          {summary ? (
            <div className="flex flex-wrap items-stretch gap-2 text-[12px]">
              <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5">
                <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
                  Start · {format(parseISO(summary.start.date), "MMM d")}
                </p>
                <p className="font-medium tabular-nums text-[var(--highlight)]">
                  {formatNumber(summary.start.weightKg, 1)} kg
                  <span className="text-[var(--mute)]">
                    {" "}
                    · {formatNumber(summary.start.bodyFatPct, 1)}% BF
                  </span>
                </p>
              </div>
              <div className="rounded-lg border border-[var(--primary)]/25 bg-[var(--primary)]/[0.06] px-3 py-1.5">
                <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--primary)]">
                  Now · {format(parseISO(summary.end.date), "MMM d")}
                </p>
                <p className="font-medium tabular-nums text-[var(--highlight)]">
                  {formatNumber(summary.end.weightKg, 1)} kg
                  <span className="text-[var(--mute)]">
                    {" "}
                    · {formatNumber(summary.end.bodyFatPct, 1)}% BF
                  </span>
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="h-[340px] md:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chart}
              margin={{ top: 28, right: 24, left: 8, bottom: 8 }}
            >
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis
                dataKey="monthTick"
                stroke={CHART.axis}
                tick={{ fill: CHART.axis, fontSize: 12 }}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                tickLine={false}
                interval={0}
              />
              <YAxis
                stroke={CHART.axis}
                tick={{ fill: CHART.axis, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                domain={yDomain}
                allowDataOverflow
                width={48}
                label={{
                  value: "Body mass (kg)",
                  angle: -90,
                  position: "insideLeft",
                  fill: CHART.muted,
                  fontSize: 11,
                  offset: 4,
                }}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP.contentStyle}
                labelStyle={CHART_TOOLTIP.labelStyle}
                itemStyle={CHART_TOOLTIP.itemStyle}
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.label ?? ""
                }
                formatter={(value, name) => {
                  const n = Number(value);
                  if (name === "weightKg") {
                    return [`${formatNumber(n, 1)} kg`, "Total"];
                  }
                  return [
                    `${formatNumber(n, 1)} kg`,
                    name === "leanMassKg" ? "Lean" : "Fat",
                  ];
                }}
              />
              <ReferenceLine
                y={leanFloor}
                stroke={CHART.protein}
                strokeDasharray="5 4"
                strokeOpacity={0.55}
              />
              <Area
                type="monotone"
                dataKey="leanMassKg"
                stackId="1"
                stroke={CHART.leanStroke}
                fill={CHART.lean}
                strokeWidth={1.5}
                name="leanMassKg"
                isAnimationActive
                animationDuration={900}
              />
              <Area
                type="monotone"
                dataKey="fatMassKg"
                stackId="1"
                stroke={CHART.fatStroke}
                fill={CHART.fat}
                strokeWidth={1.5}
                name="fatMassKg"
                isAnimationActive
                animationDuration={900}
              />
              <Line
                type="monotone"
                dataKey="weightKg"
                stroke="rgba(255,255,255,0.55)"
                strokeWidth={1.25}
                dot={{ r: 3.5, fill: CHART.title, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                name="weightKg"
                isAnimationActive
                animationDuration={1100}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {summary ? (
          <>
            {summary.leanDelta < -0.3 ? (
              <p className="pointer-events-none absolute bottom-[42%] left-1/2 -translate-x-1/2 rounded-md border border-[var(--secondary)]/35 bg-black/55 px-2.5 py-1 text-[11px] text-[var(--secondary)] backdrop-blur-sm">
                ~{formatNumber(Math.abs(summary.leanDelta), 1)} kg muscle left on
                the table
              </p>
            ) : null}
            <div className="absolute bottom-8 right-4 max-w-[220px] rounded-lg border border-white/10 bg-black/60 px-3 py-2.5 text-[12px] backdrop-blur-sm md:right-8">
              {summary.fatShare != null ? (
                <p className="font-medium text-[var(--highlight)]">
                  {formatNumber(summary.fatShare, 0)}% of loss was fat
                </p>
              ) : (
                <p className="font-medium text-[var(--highlight)]">
                  Composition shift
                </p>
              )}
              <p className="mt-1 text-[var(--mute)]">
                BF {formatNumber(summary.start.bodyFatPct, 1)}% →{" "}
                {formatNumber(summary.end.bodyFatPct, 1)}%
              </p>
              <p className="mt-1 text-[var(--mute)]">
                Lean {summary.leanDelta >= 0 ? "+" : ""}
                {formatNumber(summary.leanDelta, 1)} kg
                {summary.leanDelta < -0.3
                  ? ` · ~${formatNumber(Math.abs(summary.leanDelta), 1)} kg recoverable`
                  : ""}
              </p>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
