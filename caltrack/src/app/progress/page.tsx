"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { BodyRecompChart } from "@/components/charts/body-recomp-chart";
import { CaloriesProteinJoint } from "@/components/charts/calories-protein-joint";
import { IntakeRidgePlot } from "@/components/charts/intake-ridge-plot";
import { CHART } from "@/lib/charts/theme";
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
  const [overrides, setOverrides] = useState<{
    calorieTarget: number | null;
    proteinTarget: number | null;
    maintenanceKcal: number | null;
  }>({ calorieTarget: null, proteinTarget: null, maintenanceKcal: null });

  useEffect(() => {
    void Promise.all([fetch("/api/stats"), fetch("/api/profile")]).then(
      async ([s, p]) => {
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
      },
    );
  }, []);

  const calorieTarget =
    overrides.calorieTarget ?? macros?.targetKcal ?? 2500;
  const proteinFloor = overrides.proteinTarget ?? macros?.proteinG ?? 150;
  const maintenance =
    overrides.maintenanceKcal ?? macros?.realExpenditure ?? 2880;
  const week = useMemo(() => daily.slice(-7), [daily]);
  const hasIntake = daily.length > 0;

  return (
    <div className="space-y-8">
      <header className="animate-rise">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
          Analytics
        </p>
        <h1 className="mt-1 font-display text-4xl tracking-tight text-[var(--foreground)] md:text-5xl">
          Progress
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] text-[var(--muted)]">
          Intake distributions, body recomposition, and the calories × protein
          map — the same lens as your training journal plots.
        </p>
      </header>

      {/* Weekly overview — compact companion to the big plots */}
      <section className="animate-rise chart-panel p-5 md:p-6">
        <h2 className="text-[15px] font-semibold uppercase tracking-[0.14em]">
          This week
        </h2>
        <p className="mt-1 text-[13px] text-[var(--muted)]">
          Bar = eaten · dashed line = target / protein floor
        </p>
        {hasIntake ? (
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={week}>
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
                    contentStyle={{
                      background: "#16161a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                    }}
                  />
                  <ReferenceLine
                    y={calorieTarget}
                    stroke={CHART.calOk}
                    strokeDasharray="4 4"
                  />
                  <Bar dataKey="calories" radius={[3, 3, 0, 0]}>
                    {week.map((d) => (
                      <Cell
                        key={d.date}
                        fill={
                          d.calories <= calorieTarget
                            ? CHART.calOk
                            : CHART.calOver
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="mt-1 text-center text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
                Calories · target {formatNumber(calorieTarget)}
              </p>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={week}>
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
                    contentStyle={{
                      background: "#16161a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                    }}
                  />
                  <ReferenceLine
                    y={proteinFloor}
                    stroke={CHART.protein}
                    strokeDasharray="4 4"
                  />
                  <Bar
                    dataKey="proteinG"
                    fill={CHART.protein}
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              <p className="mt-1 text-center text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
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
    </div>
  );
}

function Empty({ hint }: { hint: string }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-12 text-center text-sm text-[var(--muted)]">
      {hint}
    </div>
  );
}
