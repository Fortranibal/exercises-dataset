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

  const calHist = useMemo(
    () => histogram(daily.map((d) => d.calories), 14, 0, xMax),
    [daily, xMax],
  );
  const proHist = useMemo(
    () => histogram(daily.map((d) => d.proteinG), 12, 0, yMax),
    [daily, yMax],
  );

  const showMaintenance =
    Math.abs(maintenance - calorieTarget) / Math.max(calorieTarget, 1) > 0.045;

  const ellipse = useMemo(() => densityEllipse(points), [points]);

  if (points.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 px-4 py-16 text-center text-sm text-[var(--muted)]">
        Log daily meals to populate the joint plot.
      </div>
    );
  }

  const xDomainMax = Math.ceil(xMax / 100) * 100;
  const yDomainMax = Math.ceil(yMax / 10) * 10;

  return (
    <section className="chart-panel overflow-hidden">
      <div className="border-b border-white/6 px-5 pb-4 pt-5 md:px-7">
        <h2 className="text-[15px] font-semibold uppercase tracking-[0.14em] text-[var(--foreground)] md:text-base">
          Calories vs protein
        </h2>
        <p className="mt-2 text-[13px] text-[var(--muted)]">
          Every logged day · density jointplot, coloured by month. The goal is
          the green upper-left quadrant (lean &amp; controlled).
        </p>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_52px_28px] grid-rows-[48px_minmax(0,1fr)] gap-x-1 p-3 md:grid-cols-[minmax(0,1fr)_56px_36px] md:p-5">
        <div className="relative col-start-1 row-start-1 pl-12">
          <MarginalBars data={calHist} horizontal max={xDomainMax} color="#5b8def" />
        </div>

        <div className="relative col-start-1 row-start-2 h-[360px] md:h-[440px]">
          <div className="pointer-events-none absolute inset-x-12 top-2 z-10 flex justify-between text-[10px] font-medium uppercase tracking-[0.12em]">
            <span className="text-[#9fe870]">lean &amp; controlled</span>
            <span className="text-[var(--muted)]">high cal, high protein</span>
          </div>
          <div className="pointer-events-none absolute inset-x-12 bottom-11 z-10 flex justify-between text-[10px] font-medium uppercase tracking-[0.12em]">
            <span className="text-[var(--muted)]">low everything</span>
            <span className="text-[#f07178]">high cal, low protein</span>
          </div>

          {ellipse ? (
            <div
              className="pointer-events-none absolute z-[1] rounded-[50%] border border-white/20"
              style={{
                left: `${8 + (ellipse.cx / xDomainMax) * 84 - (ellipse.rx / xDomainMax) * 84}%`,
                bottom: `${14 + (ellipse.cy / yDomainMax) * 72 - (ellipse.ry / yDomainMax) * 72}%`,
                width: `${(ellipse.rx / xDomainMax) * 168}%`,
                height: `${(ellipse.ry / yDomainMax) * 144}%`,
                opacity: 0.35,
                boxShadow:
                  "0 0 0 12px rgba(255,255,255,0.04), 0 0 0 28px rgba(255,255,255,0.025)",
              }}
              aria-hidden
            />
          ) : null}

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
                {points.map((d) => (
                  <Cell key={d.date} fill={d.color} fillOpacity={0.9} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="relative col-start-2 row-start-2 pb-8 pt-6">
          <MarginalBars
            data={proHist}
            horizontal={false}
            max={yDomainMax}
            color="#9b3de8"
          />
        </div>

        <div className="col-start-3 row-start-2 flex flex-col items-center gap-2 pb-8 pt-6">
          <div
            className="w-2.5 flex-1 rounded-full"
            style={{
              background: `linear-gradient(180deg, ${months
                .map((m) => monthColor(m, months))
                .join(", ")})`,
            }}
          />
          <div className="flex w-full flex-col justify-between text-center text-[9px] leading-tight text-[var(--muted)]">
            <span>
              {months[0] ? format(parseISO(`${months[0]}-01`), "MMM") : ""}
            </span>
            <span className="mt-2">
              {months.length
                ? format(parseISO(`${months[months.length - 1]}-01`), "MMM")
                : ""}
            </span>
          </div>
        </div>
      </div>

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

function densityEllipse(points: { calories: number; proteinG: number }[]) {
  if (points.length < 6) return null;
  const cx = points.reduce((s, p) => s + p.calories, 0) / points.length;
  const cy = points.reduce((s, p) => s + p.proteinG, 0) / points.length;
  let vx = 0;
  let vy = 0;
  for (const p of points) {
    vx += (p.calories - cx) ** 2;
    vy += (p.proteinG - cy) ** 2;
  }
  vx /= points.length;
  vy /= points.length;
  return {
    cx,
    cy,
    rx: Math.sqrt(vx) * 1.75,
    ry: Math.sqrt(vy) * 1.75,
  };
}

function histogram(values: number[], bins: number, min: number, max: number) {
  if (values.length === 0 || max <= min) {
    return [] as { mid: number; count: number }[];
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
        const h = (d.count / peak) * 88;
        if (horizontal) {
          const x = Math.min(96, Math.max(1, t * 100));
          return (
            <rect
              key={d.mid}
              x={x - 2.2}
              y={100 - h}
              width={4}
              height={h}
              fill={color}
              opacity={0.5}
              rx={0.5}
            />
          );
        }
        const y = 100 - Math.min(96, Math.max(1, t * 100));
        return (
          <rect
            key={d.mid}
            x={0}
            y={y - 2.2}
            width={h}
            height={4}
            fill={color}
            opacity={0.5}
            rx={0.5}
          />
        );
      })}
    </svg>
  );
}
