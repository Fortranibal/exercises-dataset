"use client";

import { useMemo, useState } from "react";
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
import { CHART, CHART_TOOLTIP, monthColor, PALETTE } from "@/lib/charts/theme";
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
  const [hoverMonth, setHoverMonth] = useState<string | null>(null);

  const months = useMemo(
    () => Array.from(new Set(daily.map((d) => d.month))).sort(),
    [daily],
  );

  const points = useMemo(
    () =>
      daily.map((d) => ({
        ...d,
        color: monthColor(d.month, months),
      })),
    [daily, months],
  );

  const xMax = useMemo(
    () =>
      Math.max(
        calorieTarget * 1.25,
        maintenance * 1.1,
        ...points.map((p) => p.calories),
        2200,
      ),
    [points, calorieTarget, maintenance],
  );
  const yMax = useMemo(
    () => Math.max(proteinFloor * 1.35, ...points.map((p) => p.proteinG), 180),
    [points, proteinFloor],
  );

  const xDomainMax = Math.ceil(xMax / 100) * 100;
  const yDomainMax = Math.ceil(yMax / 10) * 10;

  const calHist = useMemo(
    () => histogram(daily.map((d) => d.calories), 36, 0, xDomainMax),
    [daily, xDomainMax],
  );
  const proHist = useMemo(
    () => histogram(daily.map((d) => d.proteinG), 28, 0, yDomainMax),
    [daily, yDomainMax],
  );

  const showMaintenance =
    Math.abs(maintenance - calorieTarget) / Math.max(calorieTarget, 1) > 0.045;

  if (points.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 px-4 py-16 text-center text-sm text-[var(--mute)]">
        Log daily meals to populate the joint plot.
      </div>
    );
  }

  return (
    <section className="chart-panel overflow-hidden">
      <div className="border-b border-white/6 px-5 pb-4 pt-5 md:px-7">
        <h2 className="text-[15px] font-semibold uppercase tracking-[0.14em] text-[var(--highlight)] md:text-base">
          Calories vs protein
        </h2>
        <p className="mt-2 text-[13px] text-[var(--mute)]">
          Every logged day · hover a point for its date. Goal: upper-left
          (lean &amp; controlled).
        </p>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_48px] grid-rows-[40px_minmax(0,1fr)] gap-x-1 p-3 md:grid-cols-[minmax(0,1fr)_52px] md:p-5">
        <div className="relative col-start-1 row-start-1 pl-12">
          <MarginalBars
            data={calHist}
            horizontal
            max={xDomainMax}
            color={PALETTE.secondary}
          />
        </div>

        <div className="relative col-start-1 row-start-2 h-[360px] md:h-[440px]">
          <div className="pointer-events-none absolute inset-x-12 top-2 z-10 flex justify-between text-[10px] font-medium uppercase tracking-[0.12em]">
            <span className="text-[var(--primary)]">lean &amp; controlled</span>
            <span className="text-[var(--mute)]">high cal, high protein</span>
          </div>
          <div className="pointer-events-none absolute inset-x-12 bottom-11 z-10 flex justify-between text-[10px] font-medium uppercase tracking-[0.12em]">
            <span className="text-[var(--mute)]">low everything</span>
            <span className="text-[var(--secondary)]">high cal, low protein</span>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 28, right: 8, bottom: 28, left: 12 }}>
              <CartesianGrid stroke={CHART.grid} />
              <XAxis
                type="number"
                dataKey="calories"
                name="calories"
                domain={[0, xDomainMax]}
                stroke={CHART.axis}
                tick={{ fill: CHART.axis, fontSize: 11 }}
                tickLine={false}
                label={{
                  value: "Calories (kcal)",
                  position: "insideBottom",
                  offset: -14,
                  fill: CHART.muted,
                  fontSize: 11,
                }}
              />
              <YAxis
                type="number"
                dataKey="proteinG"
                name="proteinG"
                domain={[0, yDomainMax]}
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
              <ZAxis range={[52, 52]} />
              <Tooltip
                cursor={{
                  strokeDasharray: "3 3",
                  stroke: "rgba(200,240,122,0.35)",
                }}
                isAnimationActive={false}
                animationDuration={0}
                wrapperStyle={{ outline: "none", transition: "none" }}
                content={<JointTooltip />}
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
              {showMaintenance ? (
                <ReferenceLine
                  x={maintenance}
                  stroke={CHART.maintenance}
                  strokeDasharray="2 4"
                  label={{
                    value: `${formatNumber(maintenance)} maint.`,
                    fill: CHART.maintenance,
                    fontSize: 10,
                    position: "insideBottomRight",
                  }}
                />
              ) : null}
              <ReferenceLine
                y={proteinFloor}
                stroke={CHART.protein}
                strokeDasharray="5 4"
                label={{
                  value: `${proteinFloor}g protein floor`,
                  fill: CHART.protein,
                  fontSize: 10,
                  position: "right",
                }}
              />
              <Scatter data={points} isAnimationActive animationDuration={700}>
                {points.map((d) => {
                  const dimmed =
                    hoverMonth != null && d.month !== hoverMonth;
                  return (
                    <Cell
                      key={d.date}
                      fill={d.color}
                      fillOpacity={dimmed ? 0.18 : 0.92}
                    />
                  );
                })}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="relative col-start-2 row-start-2 pb-8 pt-6">
          <MarginalBars
            data={proHist}
            horizontal={false}
            max={yDomainMax}
            color={PALETTE.primary}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-white/6 px-5 py-3 md:px-7">
        <span className="mr-1 text-[11px] uppercase tracking-[0.12em] text-[var(--mute)]">
          Month
        </span>
        {months.map((m) => {
          const active = hoverMonth === m;
          const dimmed = hoverMonth != null && !active;
          return (
            <button
              key={m}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[12px] transition"
              style={{
                borderColor: active
                  ? monthColor(m, months)
                  : "rgba(244,244,245,0.1)",
                background: active
                  ? "rgba(244,244,245,0.06)"
                  : "transparent",
                color: dimmed ? PALETTE.mute : PALETTE.highlight,
                opacity: dimmed ? 0.45 : 1,
              }}
              onMouseEnter={() => setHoverMonth(m)}
              onMouseLeave={() => setHoverMonth(null)}
              onFocus={() => setHoverMonth(m)}
              onBlur={() => setHoverMonth(null)}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: monthColor(m, months) }}
              />
              {format(parseISO(`${m}-01`), "MMM")}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function JointTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: Daily }>;
}) {
  if (!active || !payload?.[0]?.payload) return null;
  const d = payload[0].payload;
  return (
    <div
      style={CHART_TOOLTIP.contentStyle}
      className="px-3 py-2 text-sm shadow-lg"
    >
      <p style={CHART_TOOLTIP.labelStyle}>
        {format(parseISO(d.date), "EEE d MMM yyyy")}
      </p>
      <p className="mt-1 tabular-nums" style={{ color: PALETTE.primary }}>
        {formatNumber(d.calories)} kcal
      </p>
      <p className="tabular-nums" style={{ color: PALETTE.secondary }}>
        {formatNumber(d.proteinG, 0)}P
      </p>
    </div>
  );
}

function histogram(values: number[], bins: number, min: number, max: number) {
  if (values.length === 0 || max <= min) {
    return [] as { mid: number; count: number; start: number; end: number }[];
  }
  const span = max - min;
  const counts = Array.from({ length: bins }, () => 0);
  for (const v of values) {
    const i = Math.min(
      bins - 1,
      Math.max(0, Math.floor(((v - min) / span) * bins)),
    );
    counts[i] += 1;
  }
  return counts.map((count, i) => ({
    start: min + (i / bins) * span,
    end: min + ((i + 1) / bins) * span,
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
  data: { mid: number; count: number; start: number; end: number }[];
  horizontal: boolean;
  max: number;
  color: string;
}) {
  const peak = Math.max(1, ...data.map((d) => d.count));
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-full w-full"
      preserveAspectRatio="none"
    >
      {data.map((d) => {
        if (d.count === 0) return null;
        const h = (d.count / peak) * 92;
        if (horizontal) {
          const x0 = (d.start / max) * 100;
          const x1 = (d.end / max) * 100;
          const w = Math.max(0.4, x1 - x0);
          return (
            <rect
              key={d.mid}
              x={x0}
              y={100 - h}
              width={w}
              height={h}
              fill={color}
              opacity={0.55}
            />
          );
        }
        const y0 = 100 - (d.end / max) * 100;
        const y1 = 100 - (d.start / max) * 100;
        const barH = Math.max(0.4, y1 - y0);
        return (
          <rect
            key={d.mid}
            x={0}
            y={y0}
            width={h}
            height={barH}
            fill={color}
            opacity={0.55}
          />
        );
      })}
    </svg>
  );
}
