"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { CHART, monthColor } from "@/lib/charts/theme";
import { formatNumber } from "@/lib/utils";

type Daily = {
  date: string;
  month: string;
  calories: number;
  proteinG: number;
};

export function CaloriesProteinJoint({
  daily,
  calorieTarget,
  proteinFloor,
  maintenance,
}: {
  daily: Daily[];
  calorieTarget: number;
  proteinFloor: number;
  maintenance: number;
}) {
  const months = useMemo(
    () => Array.from(new Set(daily.map((d) => d.month))).sort(),
    [daily],
  );

  const points = useMemo(
    () =>
      daily.map((d) => ({
        ...d,
        color: monthColor(d.month, months),
        monthLabel: format(parseISO(`${d.month}-01`), "MMM"),
      })),
    [daily, months],
  );

  const calHist = useMemo(() => histogram(daily.map((d) => d.calories), 12), [daily]);
  const proHist = useMemo(() => histogram(daily.map((d) => d.proteinG), 10), [daily]);

  if (points.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 px-4 py-16 text-center text-sm text-[var(--muted)]">
        Log daily meals to populate the joint plot.
      </div>
    );
  }

  const xMax = Math.max(calorieTarget * 1.35, ...points.map((p) => p.calories), maintenance);
  const yMax = Math.max(proteinFloor * 1.4, ...points.map((p) => p.proteinG));

  return (
    <section className="chart-panel overflow-hidden">
      <div className="border-b border-white/6 px-5 pb-4 pt-5 md:px-7">
        <h2 className="text-[15px] font-semibold uppercase tracking-[0.14em] text-[var(--foreground)] md:text-base">
          Calories vs protein
        </h2>
        <p className="mt-2 text-[13px] text-[var(--muted)]">
          Every logged day · density jointplot, coloured by month. Days drift
          toward higher-calorie / lower-protein; the goal is the green upper-left
          quadrant.
        </p>
      </div>

      <div className="grid grid-cols-[1fr_56px] grid-rows-[56px_1fr] gap-0 p-3 md:p-5">
        {/* Top marginal */}
        <div className="relative col-start-1 row-start-1">
          <MarginalBars data={calHist} horizontal max={xMax} color="#5b8def" />
        </div>
        <div className="col-start-2 row-start-1" />

        {/* Main scatter */}
        <div className="relative col-start-1 row-start-2 h-[360px] md:h-[420px]">
          <div className="pointer-events-none absolute inset-x-10 top-3 z-10 flex justify-between text-[10px] font-medium uppercase tracking-[0.12em]">
            <span className="text-[#9fe870]">lean &amp; controlled</span>
            <span className="text-[var(--muted)]">high cal, high protein</span>
          </div>
          <div className="pointer-events-none absolute inset-x-10 bottom-12 z-10 flex justify-between text-[10px] font-medium uppercase tracking-[0.12em]">
            <span className="text-[var(--muted)]">low everything</span>
            <span className="text-[#f07178]">high cal, low protein</span>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 28, right: 12, bottom: 20, left: 8 }}>
              <CartesianGrid stroke={CHART.grid} />
              <XAxis
                type="number"
                dataKey="calories"
                name="kcal"
                domain={[0, Math.ceil(xMax / 100) * 100]}
                stroke={CHART.axis}
                tick={{ fill: CHART.axis, fontSize: 11 }}
                tickLine={false}
                label={{
                  value: "Calories (kcal)",
                  position: "insideBottom",
                  offset: -8,
                  fill: CHART.muted,
                  fontSize: 11,
                }}
              />
              <YAxis
                type="number"
                dataKey="proteinG"
                name="protein"
                domain={[0, Math.ceil(yMax / 10) * 10]}
                stroke={CHART.axis}
                tick={{ fill: CHART.axis, fontSize: 11 }}
                tickLine={false}
                label={{
                  value: "Protein (g)",
                  angle: -90,
                  position: "insideLeft",
                  fill: CHART.muted,
                  fontSize: 11,
                }}
              />
              <ZAxis range={[55, 55]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{
                  background: "#16161a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                }}
                formatter={(value, name) => [
                  name === "calories"
                    ? `${formatNumber(Number(value))} kcal`
                    : `${formatNumber(Number(value), 0)} g`,
                  name === "calories" ? "Calories" : "Protein",
                ]}
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.date
                    ? format(parseISO(payload[0].payload.date), "MMM d yyyy")
                    : ""
                }
              />
              <ReferenceLine
                x={calorieTarget}
                stroke={CHART.calOk}
                strokeDasharray="5 4"
                label={{
                  value: `${formatNumber(calorieTarget)} cal target`,
                  fill: CHART.calOk,
                  fontSize: 10,
                  position: "insideTopLeft",
                }}
              />
              <ReferenceLine
                x={maintenance}
                stroke={CHART.maintenance}
                strokeDasharray="2 4"
                label={{
                  value: `${formatNumber(maintenance)} maintenance`,
                  fill: CHART.maintenance,
                  fontSize: 10,
                  position: "insideTopRight",
                }}
              />
              <ReferenceLine
                y={proteinFloor}
                stroke={CHART.protein}
                strokeDasharray="5 4"
                label={{
                  value: `${proteinFloor}g protein floor`,
                  fill: CHART.protein,
                  fontSize: 10,
                  position: "insideTopLeft",
                }}
              />
              <Scatter data={points}>
                {points.map((d) => (
                  <Cell key={d.date} fill={d.color} fillOpacity={0.9} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Right marginal */}
        <div className="relative col-start-2 row-start-2">
          <MarginalBars data={proHist} horizontal={false} max={yMax} color="#9b3de8" />
        </div>
      </div>

      {/* Month legend */}
      <div className="flex flex-wrap items-center gap-3 border-t border-white/6 px-5 py-3 md:px-7">
        <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
          Month
        </span>
        {months.map((m) => (
          <span key={m} className="inline-flex items-center gap-1.5 text-[12px]">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: monthColor(m, months) }}
            />
            {format(parseISO(`${m}-01`), "MMM")}
          </span>
        ))}
      </div>
    </section>
  );
}

function histogram(values: number[], bins: number) {
  if (values.length === 0) return [] as { mid: number; count: number }[];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const counts = Array.from({ length: bins }, () => 0);
  for (const v of values) {
    const i = Math.min(bins - 1, Math.floor(((v - min) / span) * bins));
    counts[i] += 1;
  }
  return counts.map((count, i) => ({
    mid: min + ((i + 0.5) / bins) * span,
    count,
  }));
}

function MarginalBars({
  data,
  horizontal,
  max,
  color,
}: {
  data: { mid: number; count: number }[];
  horizontal: boolean;
  max: number;
  color: string;
}) {
  const peak = Math.max(1, ...data.map((d) => d.count));
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none">
      {data.map((d) => {
        const t = d.mid / max;
        const h = (d.count / peak) * 90;
        if (horizontal) {
          const x = Math.min(95, Math.max(2, t * 100));
          return (
            <rect
              key={d.mid}
              x={x - 2}
              y={100 - h}
              width={3.5}
              height={h}
              fill={color}
              opacity={0.55}
            />
          );
        }
        const y = 100 - Math.min(95, Math.max(2, t * 100));
        return (
          <rect
            key={d.mid}
            x={0}
            y={y - 2}
            width={h}
            height={3.5}
            fill={color}
            opacity={0.55}
          />
        );
      })}
    </svg>
  );
}
