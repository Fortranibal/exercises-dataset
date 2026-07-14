"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
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
import { formatNumber } from "@/lib/utils";

type Daily = {
  date: string;
  month: string;
  monthLabel: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  count: number;
};

type Recomp = {
  date: string;
  weightKg: number;
  bodyFatPct: number;
  leanMassKg: number;
  fatMassKg: number;
};

type ProfileMacros = {
  targetKcal: number;
  proteinG: number;
  realExpenditure: number;
};

const MONTH_COLORS = [
  "#5b2c6f",
  "#8e44ad",
  "#e67e22",
  "#f1c40f",
  "#2ecc71",
  "#1abc9c",
];

function kde(values: number[], x: number, bandwidth: number): number {
  if (values.length === 0) return 0;
  const inv = 1 / (values.length * bandwidth * Math.sqrt(2 * Math.PI));
  let sum = 0;
  for (const v of values) {
    const u = (x - v) / bandwidth;
    sum += Math.exp(-0.5 * u * u);
  }
  return inv * sum;
}

function ridgeSeries(
  daily: Daily[],
  key: "calories" | "proteinG",
  xs: number[],
  bandwidth: number,
) {
  const byMonth = new Map<string, number[]>();
  for (const d of daily) {
    const list = byMonth.get(d.month) ?? [];
    list.push(d[key]);
    byMonth.set(d.month, list);
  }
  const months = Array.from(byMonth.keys()).sort();
  return months.map((month, i) => {
    const vals = byMonth.get(month) ?? [];
    const density = xs.map((x) => ({
      x,
      y: kde(vals, x, bandwidth),
      month,
      color: MONTH_COLORS[i % MONTH_COLORS.length],
    }));
    return {
      month,
      label: `${format(parseISO(`${month}-01`), "MMM")} (${vals.length}d)`,
      color: MONTH_COLORS[i % MONTH_COLORS.length],
      density,
      n: vals.length,
    };
  });
}

export default function ProgressPage() {
  const [daily, setDaily] = useState<Daily[]>([]);
  const [recomp, setRecomp] = useState<Recomp[]>([]);
  const [macros, setMacros] = useState<ProfileMacros | null>(null);

  useEffect(() => {
    void Promise.all([fetch("/api/stats"), fetch("/api/profile")]).then(
      async ([s, p]) => {
        const sj = await s.json();
        const pj = await p.json();
        setDaily(sj.daily ?? []);
        setRecomp(sj.recomposition ?? []);
        setMacros(pj.mmp?.macros ?? null);
      },
    );
  }, []);

  const calorieTarget = macros?.targetKcal ?? 2500;
  const proteinFloor = macros?.proteinG ?? 150;
  const maintenance = macros?.realExpenditure ?? 2880;

  const week = useMemo(() => daily.slice(-7), [daily]);

  const proteinRidges = useMemo(() => {
    const xs = Array.from({ length: 41 }, (_, i) => 50 + i * 5);
    return ridgeSeries(daily, "proteinG", xs, 12);
  }, [daily]);

  const calorieRidges = useMemo(() => {
    const xs = Array.from({ length: 41 }, (_, i) => 1500 + i * 75);
    return ridgeSeries(daily, "calories", xs, 180);
  }, [daily]);

  const recompChart = useMemo(
    () =>
      recomp.map((r) => ({
        ...r,
        label: format(parseISO(r.date), "MMM d"),
      })),
    [recomp],
  );

  const joint = useMemo(
    () =>
      daily.map((d) => ({
        ...d,
        color:
          MONTH_COLORS[
            Math.max(
              0,
              parseInt(d.month.slice(5), 10) - 1,
            ) % MONTH_COLORS.length
          ],
      })),
    [daily],
  );

  const hasIntake = daily.length > 0;
  const hasBody = recomp.length > 0;

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <p className="text-xs uppercase tracking-[0.18em] text-[#7a9a82]">
          Analytics
        </p>
        <h1 className="font-display mt-1 text-4xl">Progress</h1>
        <p className="mt-2 max-w-2xl text-[#9aada0]">
          Weekly bars, intake density ridges, body recomposition, and the
          calories × protein joint view.
        </p>
      </header>

      <section className="animate-rise panel p-4 md:p-5">
        <h2 className="font-display text-xl">This week</h2>
        <p className="mb-4 text-sm text-[#8a9e90]">
          Bar = eaten · line = target · protein line = goal
        </p>
        {hasIntake ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={week}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => format(parseISO(d), "EEE d")}
                    stroke="#7a9a82"
                    fontSize={11}
                  />
                  <YAxis stroke="#7a9a82" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "#121916",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  />
                  <ReferenceLine
                    y={calorieTarget}
                    stroke="#9fe870"
                    strokeDasharray="4 4"
                  />
                  <Bar dataKey="calories" radius={[4, 4, 0, 0]}>
                    {week.map((d) => (
                      <Cell
                        key={d.date}
                        fill={
                          d.calories <= calorieTarget ? "#9fe870" : "#e07a7a"
                        }
                      />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
              <p className="mt-1 text-center text-xs text-[#7a9a82]">Calories</p>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={week}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => format(parseISO(d), "EEE d")}
                    stroke="#7a9a82"
                    fontSize={11}
                  />
                  <YAxis stroke="#7a9a82" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "#121916",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  />
                  <ReferenceLine
                    y={proteinFloor}
                    stroke="#6eb6ff"
                    strokeDasharray="4 4"
                  />
                  <Bar dataKey="proteinG" fill="#6eb6ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="mt-1 text-center text-xs text-[#7a9a82]">Protein</p>
            </div>
          </div>
        ) : (
          <Empty hint="Log meals for a few days to unlock weekly charts." />
        )}
      </section>

      <section className="animate-rise panel p-4 md:p-5" style={{ animationDelay: "0.06s" }}>
        <h2 className="font-display text-xl">Daily intake distribution by month</h2>
        <p className="mb-4 text-sm text-[#8a9e90]">
          Smoothed densities · protein floor {proteinFloor}g · calorie target{" "}
          {formatNumber(calorieTarget)}
        </p>
        {hasIntake && proteinRidges.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <RidgePanel
              title="Protein (g / day)"
              ridges={proteinRidges}
              refX={proteinFloor}
              refLabel={`${proteinFloor}g floor`}
            />
            <RidgePanel
              title="Calories (kcal / day)"
              ridges={calorieRidges}
              refX={calorieTarget}
              refLabel={`${calorieTarget} target`}
            />
          </div>
        ) : (
          <Empty hint="Need multiple logged days across months for ridge plots." />
        )}
      </section>

      <section className="animate-rise panel p-4 md:p-5" style={{ animationDelay: "0.1s" }}>
        <h2 className="font-display text-xl">Body recomposition</h2>
        <p className="mb-4 text-sm text-[#8a9e90]">Where the mass went — lean vs fat.</p>
        {hasBody ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={recompChart}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="label" stroke="#7a9a82" fontSize={11} />
                <YAxis
                  stroke="#7a9a82"
                  fontSize={11}
                  domain={["dataMin - 2", "dataMax + 2"]}
                  label={{
                    value: "Body mass (kg)",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#7a9a82",
                  }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#121916",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="leanMassKg"
                  stackId="1"
                  stroke="#2d6a4f"
                  fill="#1b4332"
                  name="Lean mass"
                />
                <Area
                  type="monotone"
                  dataKey="fatMassKg"
                  stackId="1"
                  stroke="#c4a574"
                  fill="#a98467"
                  name="Fat mass"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Empty hint="Add body logs with weight + body-fat % on the MMP or Physique pages." />
        )}
      </section>

      <section className="animate-rise panel p-4 md:p-5" style={{ animationDelay: "0.14s" }}>
        <h2 className="font-display text-xl">Calories vs protein</h2>
        <p className="mb-2 text-sm text-[#8a9e90]">
          Every logged day · coloured by month. Goal: upper-left (lean &amp;
          controlled).
        </p>
        {hasIntake ? (
          <div className="relative h-80">
            <div className="pointer-events-none absolute inset-x-8 top-2 z-10 flex justify-between text-[10px] uppercase tracking-wider">
              <span className="text-[#9fe870]">lean &amp; controlled</span>
              <span className="text-[#8a9e90]">high cal, high protein</span>
            </div>
            <div className="pointer-events-none absolute inset-x-8 bottom-10 z-10 flex justify-between text-[10px] uppercase tracking-wider">
              <span className="text-[#8a9e90]">low everything</span>
              <span className="text-[#e07a7a]">high cal, low protein</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 24, right: 12, bottom: 12, left: 8 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  type="number"
                  dataKey="calories"
                  name="kcal"
                  stroke="#7a9a82"
                  fontSize={11}
                />
                <YAxis
                  type="number"
                  dataKey="proteinG"
                  name="protein"
                  stroke="#7a9a82"
                  fontSize={11}
                />
                <ZAxis range={[60, 60]} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  contentStyle={{
                    background: "#121916",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
                <ReferenceLine x={calorieTarget} stroke="#9fe870" strokeDasharray="4 4" />
                <ReferenceLine x={maintenance} stroke="#f1c40f" strokeDasharray="2 4" />
                <ReferenceLine y={proteinFloor} stroke="#6eb6ff" strokeDasharray="4 4" />
                <Scatter data={joint}>
                  {joint.map((d) => (
                    <Cell key={d.date} fill={d.color} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Empty hint="Log daily meals to populate the joint plot." />
        )}
      </section>
    </div>
  );
}

function Empty({ hint }: { hint: string }) {
  return (
    <div className="rounded-lg border border-dashed border-white/10 px-4 py-10 text-center text-sm text-[#8a9e90]">
      {hint}
    </div>
  );
}

function RidgePanel({
  title,
  ridges,
  refX,
  refLabel,
}: {
  title: string;
  ridges: ReturnType<typeof ridgeSeries>;
  refX: number;
  refLabel: string;
}) {
  const maxY = Math.max(
    0.0001,
    ...ridges.flatMap((r) => r.density.map((d) => d.y)),
  );

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-[#cfe0d4]">{title}</p>
      <div className="space-y-1">
        {ridges.map((ridge) => (
          <div key={ridge.month} className="flex items-center gap-2">
            <span className="w-20 shrink-0 text-[11px] text-[#8a9e90]">
              {ridge.label}
            </span>
            <div className="relative h-10 flex-1 overflow-hidden">
              <svg
                viewBox={`0 0 100 40`}
                preserveAspectRatio="none"
                className="h-full w-full"
              >
                <path
                  d={buildRidgePath(ridge.density, maxY)}
                  fill={ridge.color}
                  fillOpacity={0.55}
                  stroke={ridge.color}
                  strokeWidth={0.6}
                />
                <line
                  x1={xToPct(refX, ridge.density)}
                  x2={xToPct(refX, ridge.density)}
                  y1={0}
                  y2={40}
                  stroke="#e07a9a"
                  strokeDasharray="2 2"
                  strokeWidth={0.8}
                />
              </svg>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-[#e07a9a]">{refLabel}</p>
    </div>
  );
}

function xToPct(
  x: number,
  density: { x: number; y: number }[],
): number {
  if (density.length < 2) return 50;
  const min = density[0].x;
  const max = density[density.length - 1].x;
  return ((x - min) / (max - min)) * 100;
}

function buildRidgePath(
  density: { x: number; y: number }[],
  maxY: number,
): string {
  if (density.length === 0) return "";
  const minX = density[0].x;
  const maxX = density[density.length - 1].x;
  const pts = density.map((d) => {
    const px = ((d.x - minX) / (maxX - minX)) * 100;
    const py = 40 - (d.y / maxY) * 36;
    return `${px},${py}`;
  });
  return `M0,40 L${pts.join(" L")} L100,40 Z`;
}
