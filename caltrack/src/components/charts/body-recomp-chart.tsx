"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceDot,
} from "recharts";
import { format, parseISO } from "date-fns";
import { CHART } from "@/lib/charts/theme";
import { formatNumber } from "@/lib/utils";

type Point = {
  date: string;
  weightKg: number;
  bodyFatPct: number;
  leanMassKg: number;
  fatMassKg: number;
};

export function BodyRecompChart({ data }: { data: Point[] }) {
  const chart = useMemo(
    () =>
      data.map((r) => ({
        ...r,
        label: format(parseISO(r.date), "MMM d"),
        monthTick: format(parseISO(r.date), "MMM"),
      })),
    [data],
  );

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
    // Zoom into the composition band (like the reference 75–90 style)
    const lo = Math.floor(leanMin * 0.92);
    const hi = Math.ceil(weightMax * 1.03);
    return [lo, hi] as [number, number];
  }, [chart]);

  if (chart.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 px-4 py-16 text-center text-sm text-[var(--muted)]">
        Add body logs with weight + body-fat % to unlock recomposition.
      </div>
    );
  }

  return (
    <section className="chart-panel relative overflow-hidden">
      <div className="border-b border-white/6 px-5 pb-4 pt-5 md:px-7">
        <h2 className="text-[15px] font-semibold uppercase tracking-[0.14em] text-[var(--foreground)] md:text-base">
          Body recomposition
        </h2>
        <p className="mt-2 text-[13px] text-[var(--muted)]">
          {summary && summary.lost > 0
            ? `where the ${formatNumber(summary.lost, 1)} kg went.`
            : "lean mass vs fat mass over time."}
        </p>
      </div>

      <div className="relative px-2 pb-4 pt-2 md:px-4">
        <div className="mb-2 flex items-center gap-4 px-3 text-[11px] uppercase tracking-[0.1em] text-[var(--muted)]">
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

        <div className="h-[340px] md:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
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
                interval="preserveStartEnd"
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
                contentStyle={{
                  background: "#16161a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                }}
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.label ?? ""
                }
                formatter={(value, name) => [
                  `${formatNumber(Number(value), 1)} kg`,
                  name === "leanMassKg" ? "Lean" : "Fat",
                ]}
              />
              <Area
                type="monotone"
                dataKey="leanMassKg"
                stackId="1"
                stroke={CHART.leanStroke}
                fill={CHART.lean}
                strokeWidth={1.5}
                name="leanMassKg"
              />
              <Area
                type="monotone"
                dataKey="fatMassKg"
                stackId="1"
                stroke={CHART.fatStroke}
                fill={CHART.fat}
                strokeWidth={1.5}
                name="fatMassKg"
                dot={{ r: 3, fill: "#fff", strokeWidth: 0 }}
                activeDot={{ r: 4 }}
              />
              {summary ? (
                <>
                  <ReferenceDot
                    x={summary.start.monthTick}
                    y={summary.start.weightKg}
                    r={0}
                  />
                  <ReferenceDot
                    x={summary.end.monthTick}
                    y={summary.end.weightKg}
                    r={0}
                  />
                </>
              ) : null}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {summary ? (
          <>
            <Annotation
              className="left-6 top-14 md:left-10"
              title={format(parseISO(summary.start.date), "MMM d")}
              lines={[
                `${formatNumber(summary.start.weightKg, 1)} kg`,
                `${formatNumber(summary.start.bodyFatPct, 1)}% BF`,
              ]}
            />
            <Annotation
              className="right-6 top-14 md:right-10"
              title={format(parseISO(summary.end.date), "MMM d")}
              lines={[
                `${formatNumber(summary.end.weightKg, 1)} kg`,
                `~${formatNumber(summary.end.bodyFatPct, 1)}% BF`,
              ]}
            />
            <div className="absolute bottom-8 right-6 max-w-[220px] rounded-lg border border-white/10 bg-black/55 px-3 py-2.5 text-[12px] backdrop-blur-sm md:right-10">
              {summary.fatShare != null ? (
                <p className="font-medium text-[var(--foreground)]">
                  {formatNumber(summary.fatShare, 0)}% of loss was fat
                </p>
              ) : (
                <p className="font-medium text-[var(--foreground)]">
                  Composition shift
                </p>
              )}
              <p className="mt-1 text-[var(--muted)]">
                BF {formatNumber(summary.start.bodyFatPct, 1)}% →{" "}
                {formatNumber(summary.end.bodyFatPct, 1)}%
              </p>
              <p className="mt-1 text-[var(--muted)]">
                Lean {summary.leanDelta >= 0 ? "+" : ""}
                {formatNumber(summary.leanDelta, 1)} kg
              </p>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

function Annotation({
  className,
  title,
  lines,
}: {
  className: string;
  title: string;
  lines: string[];
}) {
  return (
    <div
      className={`pointer-events-none absolute rounded-md border border-white/12 bg-black/60 px-2.5 py-1.5 text-[11px] backdrop-blur-sm ${className}`}
    >
      <p className="font-medium text-[var(--foreground)]">{title}</p>
      {lines.map((l) => (
        <p key={l} className="text-[var(--muted)]">
          {l}
        </p>
      ))}
    </div>
  );
}
