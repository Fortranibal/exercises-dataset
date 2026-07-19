"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { CHART, kde, monthColor, PALETTE } from "@/lib/charts/theme";
import { formatNumber } from "@/lib/utils";

type Daily = {
  date: string;
  month: string;
  calories: number;
  proteinG: number;
};

type Ridge = {
  month: string;
  label: string;
  days: number;
  color: string;
  mean: number;
  peakX: number;
  density: { x: number; y: number }[];
};

function buildRidges(
  daily: Daily[],
  key: "calories" | "proteinG",
  xMin: number,
  xMax: number,
  steps: number,
  bandwidth: number,
): Ridge[] {
  const byMonth = new Map<string, number[]>();
  for (const d of daily) {
    const list = byMonth.get(d.month) ?? [];
    list.push(d[key]);
    byMonth.set(d.month, list);
  }
  const months = Array.from(byMonth.keys()).sort();
  const xs = Array.from(
    { length: steps },
    (_, i) => xMin + ((xMax - xMin) * i) / (steps - 1),
  );

  return months.map((month) => {
    const vals = byMonth.get(month) ?? [];
    const density = xs.map((x) => ({ x, y: kde(vals, x, bandwidth) }));
    const peak = density.reduce((a, b) => (b.y > a.y ? b : a), density[0]);
    const mean =
      vals.length === 0
        ? 0
        : vals.reduce((s, v) => s + v, 0) / vals.length;
    return {
      month,
      label: format(parseISO(`${month}-01`), "MMM"),
      days: vals.length,
      color: monthColor(month, months),
      mean,
      peakX: peak?.x ?? 0,
      density,
    };
  });
}

function insightLine(ridges: Ridge[], proteinFloor: number): string {
  if (ridges.length < 2) {
    return "Smoothed daily-intake densities per month · hover a ridge for details.";
  }
  const late = ridges.slice(-2);
  const drifted = late.some((r) => r.peakX < proteinFloor);
  if (drifted) {
    const names = late.map((r) => r.label).join("/");
    return `Smoothed daily-intake densities per month · protein ridges drift below the ${proteinFloor}g floor in ${names}. Hover a ridge for details.`;
  }
  return "Smoothed daily-intake densities per month · hover a ridge for peak and average.";
}

export function IntakeRidgePlot({
  daily,
  proteinFloor,
  calorieTarget,
  phaseLabel = "cut",
}: {
  daily: Daily[];
  proteinFloor: number;
  calorieTarget: number;
  phaseLabel?: string;
}) {
  const proteinRidges = useMemo(
    () => buildRidges(daily, "proteinG", 40, 260, 80, 14),
    [daily],
  );
  const calorieRidges = useMemo(
    () => buildRidges(daily, "calories", 1200, 4200, 80, 220),
    [daily],
  );

  const rangeLabel = useMemo(() => {
    if (proteinRidges.length === 0) return "";
    const first = proteinRidges[0].label;
    const last = proteinRidges[proteinRidges.length - 1].label;
    const year = proteinRidges[0].month.slice(0, 4);
    return `${phaseLabel} · ${first}–${last} ${year} | logging-gap days excluded`;
  }, [proteinRidges, phaseLabel]);

  if (proteinRidges.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 px-4 py-16 text-center text-sm text-[var(--mute)]">
        Need logged days across months for ridge plots.
      </div>
    );
  }

  return (
    <section className="chart-panel overflow-hidden">
      <div className="border-b border-white/6 px-5 pb-4 pt-5 md:px-7">
        <h2 className="text-[15px] font-semibold uppercase tracking-[0.14em] text-[var(--highlight)] md:text-base">
          Daily intake distribution by month
        </h2>
        <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-[var(--mute)]">
          {insightLine(proteinRidges, proteinFloor)}
        </p>
      </div>

      <div className="grid gap-0 lg:grid-cols-2">
        <RidgeColumn
          title="Protein (g / day)"
          ridges={proteinRidges}
          xMin={50}
          xMax={250}
          ticks={[50, 100, 150, 200, 250]}
          refX={proteinFloor}
          refLabel={`Protein floor ${proteinFloor}g`}
          unit="g"
        />
        <RidgeColumn
          title="Calories (kcal / day)"
          ridges={calorieRidges}
          xMin={1500}
          xMax={4000}
          ticks={[1500, 2000, 2500, 3000, 3500, 4000]}
          refX={calorieTarget}
          refLabel={`Calorie target ${formatNumber(calorieTarget)}`}
          unit="kcal"
          borderLeft
        />
      </div>

      <div className="flex justify-end border-t border-white/6 px-5 py-3 md:px-7">
        <p className="text-[11px] text-[var(--mute)]">{rangeLabel}</p>
      </div>
    </section>
  );
}

function RidgeColumn({
  title,
  ridges,
  xMin,
  xMax,
  ticks,
  refX,
  refLabel,
  unit,
  borderLeft,
}: {
  title: string;
  ridges: Ridge[];
  xMin: number;
  xMax: number;
  ticks: number[];
  refX: number;
  refLabel: string;
  unit: string;
  borderLeft?: boolean;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const width = 640;
  const rowH = 52;
  const topPad = 40;
  const bottomPad = 40;
  const leftPad = 64;
  const rightPad = 16;
  const plotW = width - leftPad - rightPad;
  const height = topPad + ridges.length * rowH + bottomPad;
  const maxDensity = Math.max(
    0.0001,
    ...ridges.flatMap((r) => r.density.map((d) => d.y)),
  );

  const xScale = (x: number) =>
    leftPad + ((x - xMin) / (xMax - xMin)) * plotW;
  const refPx = xScale(Math.min(xMax, Math.max(xMin, refX)));
  const active = ridges.find((r) => r.month === hover) ?? null;

  return (
    <div
      className={
        borderLeft ? "border-t border-white/6 lg:border-l lg:border-t-0" : ""
      }
    >
      <div className="border-b border-white/[0.04] px-5 pb-3 pt-4 md:px-6">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--mute)]">
          {title}
        </p>
        {active ? (
          <div className="mt-2.5 flex flex-wrap items-end gap-3">
            <p
              className="font-display text-2xl leading-none tracking-tight"
              style={{ color: active.color }}
            >
              {active.label}
            </p>
            <div className="flex flex-wrap gap-2">
              <StatChip
                label="Peak"
                value={`${formatNumber(Math.round(active.peakX))}${unit === "g" ? "" : ""}`}
              />
              <StatChip
                label="Avg"
                value={`${formatNumber(Math.round(active.mean))}`}
              />
              <StatChip label="Logged" value={`${active.days}d`} />
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-[var(--mute)]">
            Hover a month ridge for peak, average, and days logged.
          </p>
        )}
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label={title}
      >
        <line
          x1={refPx}
          x2={refPx}
          y1={topPad - 18}
          y2={height - bottomPad + 8}
          stroke={CHART.ref}
          strokeDasharray="4 4"
          strokeWidth={1.25}
          opacity={0.9}
        />
        <text
          x={refPx}
          y={18}
          textAnchor="middle"
          fill={CHART.ref}
          fontSize={11}
          fontFamily="var(--font-body), sans-serif"
        >
          {refLabel}
        </text>

        {[...ridges].reverse().map((ridge, revIdx) => {
          const idx = ridges.length - 1 - revIdx;
          const baseline = topPad + idx * rowH + rowH * 0.78;
          const amp = rowH * 1.05;
          const filtered = ridge.density.filter(
            (d) => d.x >= xMin && d.x <= xMax,
          );
          // Zero-density bookends so clipped ridges meet the baseline smoothly
          const edged = [
            { x: xMin, y: 0 },
            ...filtered,
            { x: xMax, y: 0 },
          ];
          const path = smoothRidgePath(edged, xScale, baseline, maxDensity, amp);
          const firstX = xScale(xMin);
          const lastX = xScale(xMax);
          const isHover = hover === ridge.month;
          const dimmed = hover != null && !isHover;

          return (
            <g
              key={ridge.month}
              onMouseEnter={() => setHover(ridge.month)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={0}
                y={baseline - rowH + 8}
                width={width}
                height={rowH}
                fill="transparent"
              />
              <line
                x1={leftPad}
                x2={width - rightPad}
                y1={baseline}
                y2={baseline}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={1}
              />
              <path
                d={`${path} L${lastX},${baseline} L${firstX},${baseline} Z`}
                fill={ridge.color}
                fillOpacity={dimmed ? 0.18 : isHover ? 0.72 : 0.52}
                stroke={ridge.color}
                strokeWidth={isHover ? 2 : 1.35}
                strokeOpacity={dimmed ? 0.35 : 0.95}
              />
              <text
                x={12}
                y={baseline - 12}
                fill={dimmed ? PALETTE.mute : CHART.title}
                fontSize={13}
                fontFamily="var(--font-body), sans-serif"
                fontWeight={600}
              >
                {ridge.label}
              </text>
              <text
                x={12}
                y={baseline + 4}
                fill={CHART.muted}
                fontSize={11}
                fontFamily="var(--font-body), sans-serif"
              >
                {ridge.days}d
              </text>
            </g>
          );
        })}

        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={xScale(t)}
              x2={xScale(t)}
              y1={height - bottomPad + 4}
              y2={height - bottomPad + 10}
              stroke={CHART.axis}
              strokeWidth={1}
            />
            <text
              x={xScale(t)}
              y={height - 10}
              textAnchor="middle"
              fill={CHART.axis}
              fontSize={11}
              fontFamily="var(--font-body), sans-serif"
            >
              {formatNumber(t)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/35 px-2.5 py-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--mute)]">
        {label}
      </p>
      <p className="font-display text-lg leading-none tabular-nums text-[var(--highlight)]">
        {value}
      </p>
    </div>
  );
}

function smoothRidgePath(
  density: { x: number; y: number }[],
  xScale: (x: number) => number,
  baseline: number,
  maxDensity: number,
  amp: number,
): string {
  if (density.length === 0) return "";
  const pts = density.map((d) => ({
    x: xScale(d.x),
    y: baseline - (d.y / maxDensity) * amp,
  }));
  if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`;
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? i : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}
