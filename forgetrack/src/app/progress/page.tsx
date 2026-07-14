"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  format,
  parseISO,
  subDays,
  startOfDay,
} from "date-fns";
import { BodyRecompChart } from "@/components/charts/body-recomp-chart";
import { CaloriesProteinJoint } from "@/components/charts/calories-protein-joint";
import { IntakeRidgePlot } from "@/components/charts/intake-ridge-plot";
import {
  averageCalories,
  proteinHitRate,
  proteinStreak,
} from "@/lib/adherence";
import { CHART, CHART_BAR_CURSOR, CHART_TOOLTIP } from "@/lib/charts/theme";
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

export default function ProgressPage() {
  const [daily, setDaily] = useState<Daily[]>([]);
  const [recomp, setRecomp] = useState<Recomp[]>([]);
  const [macros, setMacros] = useState<ProfileMacros | null>(null);
  const [phase, setPhase] = useState("cut");
  const [loading, setLoading] = useState(true);
  const [overrides, setOverrides] = useState<{
    calorieTarget: number | null;
    proteinTarget: number | null;
    maintenanceKcal: number | null;
  }>({ calorieTarget: null, proteinTarget: null, maintenanceKcal: null });

  useEffect(() => {
    void Promise.all([fetch("/api/stats"), fetch("/api/profile")])
      .then(async ([s, p]) => {
        const sj = await s.json();
        const pj = await p.json();
        setDaily(sj.daily ?? []);
        setRecomp(sj.recomposition ?? []);
        setMacros(pj.mmp?.macros ?? null);
        setPhase(pj.profile?.phase ?? "cut");
        setOverrides({
          calorieTarget: pj.profile?.calorieTarget ?? null,
          proteinTarget: pj.profile?.proteinTarget ?? null,
          maintenanceKcal: pj.profile?.maintenanceKcal ?? null,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const calorieTarget =
    overrides.calorieTarget ?? macros?.targetKcal ?? 2500;
  const proteinFloor = overrides.proteinTarget ?? macros?.proteinG ?? 150;
  const maintenance =
    overrides.maintenanceKcal ?? macros?.realExpenditure ?? 2880;

  const week = useMemo(() => {
    const byDate = new Map(daily.map((d) => [d.date, d]));
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const day = subDays(today, 6 - i);
      const key = format(day, "yyyy-MM-dd");
      const hit = byDate.get(key);
      return {
        date: key,
        calories: hit?.calories ?? 0,
        proteinG: hit?.proteinG ?? 0,
        empty: !hit,
      };
    });
  }, [daily]);

  const hasIntake = daily.length > 0;

  const kpis = useMemo(() => {
    const avgKcal = averageCalories(daily, 30);
    const protein = proteinHitRate(daily, proteinFloor, 30);
    const streak = proteinStreak(
      daily,
      proteinFloor,
      format(new Date(), "yyyy-MM-dd"),
    );
    const first = recomp[0];
    const last = recomp[recomp.length - 1];
    const weightDelta =
      first && last ? last.weightKg - first.weightKg : null;
    const leanDelta =
      first && last ? last.leanMassKg - first.leanMassKg : null;
    return { avgKcal, protein, streak, weightDelta, leanDelta };
  }, [daily, proteinFloor, recomp]);

  return (
    <div className="space-y-8">
      <header className="animate-rise">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--mute)]">
            Analytics
          </p>
          <span className="status-chip" data-tone="ok">
            {phase} phase
          </span>
        </div>
        <h1 className="mt-1 font-display text-4xl tracking-tight text-[var(--highlight)] md:text-5xl">
          Progress
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] text-[var(--mute)]">
          Intake distributions, body recomposition, and the calories × protein
          map — the same lens as your training journal plots.
        </p>
      </header>

      {!loading && hasIntake ? (
        <section className="animate-rise kpi-grid">
          <Kpi
            label="30d avg kcal"
            value={formatNumber(kpis.avgKcal)}
            hint={`vs ${formatNumber(calorieTarget)} target`}
          />
          <Kpi
            label="Protein hit rate"
            value={`${kpis.protein.pct}%`}
            hint={`${kpis.protein.hits}/${kpis.protein.logged} days · ${kpis.streak}d streak`}
          />
          <Kpi
            label="Weight Δ"
            value={
              kpis.weightDelta == null
                ? "—"
                : `${kpis.weightDelta >= 0 ? "+" : ""}${formatNumber(kpis.weightDelta, 1)} kg`
            }
            hint="Across body logs"
          />
          <Kpi
            label="Lean mass Δ"
            value={
              kpis.leanDelta == null
                ? "—"
                : `${kpis.leanDelta >= 0 ? "+" : ""}${formatNumber(kpis.leanDelta, 1)} kg`
            }
            hint="Recomp signal"
          />
        </section>
      ) : null}

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="chart-panel h-48 animate-pulse bg-white/[0.03]"
              style={{ animationDelay: `${i * 0.08}s` }}
            />
          ))}
        </div>
      ) : (
        <>
          <section className="animate-rise chart-panel p-5 md:p-6">
            <h2 className="text-[15px] font-semibold uppercase tracking-[0.14em]">
              This week
            </h2>
            <p className="mt-1 text-[13px] text-[var(--mute)]">
              Last 7 calendar days · bar = eaten · dashed = target / protein
              floor
            </p>
            {hasIntake ? (
              <div className="mt-4 grid gap-6 lg:grid-cols-2">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={week} margin={{ top: 18, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke={CHART.grid} vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(d) => format(parseISO(d), "EEE d")}
                        stroke={CHART.axis}
                        tick={{ fill: CHART.axis, fontSize: 11 }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke={CHART.axis}
                        tick={{ fill: CHART.axis, fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        cursor={CHART_BAR_CURSOR}
                        contentStyle={CHART_TOOLTIP.contentStyle}
                        labelStyle={CHART_TOOLTIP.labelStyle}
                        itemStyle={CHART_TOOLTIP.itemStyle}
                      />
                      <ReferenceLine
                        y={calorieTarget}
                        stroke={CHART.calOk}
                        strokeDasharray="4 4"
                      />
                      <Bar
                        dataKey="calories"
                        radius={[3, 3, 0, 0]}
                        activeBar={{
                          fill: CHART.calOk,
                          stroke: "rgba(255,255,255,0.35)",
                          strokeWidth: 1,
                        }}
                      >
                        {week.map((d) => (
                          <Cell
                            key={d.date}
                            fill={
                              d.empty
                                ? "rgba(255,255,255,0.08)"
                                : d.calories <= calorieTarget
                                  ? CHART.calOk
                                  : CHART.calOver
                            }
                          />
                        ))}
                        <LabelList
                          dataKey="calories"
                          position="top"
                          formatter={(v) =>
                            Number(v) > 0 ? formatNumber(Number(v)) : ""
                          }
                          style={{ fill: CHART.axis, fontSize: 10 }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="mt-1 text-center text-[11px] uppercase tracking-[0.12em] text-[var(--mute)]">
                    Calories · target {formatNumber(calorieTarget)}
                  </p>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={week} margin={{ top: 18, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke={CHART.grid} vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(d) => format(parseISO(d), "EEE d")}
                        stroke={CHART.axis}
                        tick={{ fill: CHART.axis, fontSize: 11 }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke={CHART.axis}
                        tick={{ fill: CHART.axis, fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, Math.max(proteinFloor * 1.15, 120)]}
                      />
                      <Tooltip
                        cursor={CHART_BAR_CURSOR}
                        contentStyle={CHART_TOOLTIP.contentStyle}
                        labelStyle={CHART_TOOLTIP.labelStyle}
                        itemStyle={CHART_TOOLTIP.itemStyle}
                      />
                      <ReferenceLine
                        y={proteinFloor}
                        stroke={CHART.protein}
                        strokeDasharray="4 4"
                      />
                      <Bar
                        dataKey="proteinG"
                        radius={[3, 3, 0, 0]}
                        activeBar={{
                          fill: CHART.protein,
                          stroke: "rgba(255,255,255,0.35)",
                          strokeWidth: 1,
                        }}
                      >
                        {week.map((d) => (
                          <Cell
                            key={d.date}
                            fill={
                              d.empty
                                ? "rgba(255,255,255,0.08)"
                                : CHART.protein
                            }
                          />
                        ))}
                        <LabelList
                          dataKey="proteinG"
                          position="top"
                          formatter={(v) =>
                            Number(v) > 0 ? formatNumber(Number(v), 0) : ""
                          }
                          style={{ fill: CHART.axis, fontSize: 10 }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="mt-1 text-center text-[11px] uppercase tracking-[0.12em] text-[var(--mute)]">
                    Protein · floor {proteinFloor}g
                  </p>
                </div>
              </div>
            ) : (
              <Empty hint="Log meals for a few days to unlock weekly charts." />
            )}
          </section>

          <div className="animate-rise" style={{ animationDelay: "0.05s" }}>
            <IntakeRidgePlot
              daily={daily}
              proteinFloor={proteinFloor}
              calorieTarget={calorieTarget}
              phaseLabel={phase}
            />
          </div>

          <div className="animate-rise" style={{ animationDelay: "0.1s" }}>
            <BodyRecompChart data={recomp} />
          </div>

          <div className="animate-rise" style={{ animationDelay: "0.14s" }}>
            <CaloriesProteinJoint
              daily={daily}
              calorieTarget={calorieTarget}
              proteinFloor={proteinFloor}
              maintenance={maintenance}
            />
          </div>
        </>
      )}
    </div>
  );
}

function Empty({ hint }: { hint: string }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-12 text-center text-sm text-[var(--mute)]">
      {hint}
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="chart-panel px-4 py-3.5">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--mute)]">
        {label}
      </p>
      <p className="font-display mt-1 text-2xl tabular-nums text-[var(--highlight)]">
        {value}
      </p>
      <p className="mt-1 text-[11px] text-[var(--mute)]">{hint}</p>
    </div>
  );
}
