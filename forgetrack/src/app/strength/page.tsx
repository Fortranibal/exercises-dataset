"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import type { StrengthLog } from "@/lib/db/schema";
import { formatNumber } from "@/lib/utils";

const DEFAULT_LIFTS = [
  "Back Squat",
  "Bench Press",
  "Incline Bench Press",
  "Overhead Press",
  "Deadlift",
  "Pull-up",
  "Dip",
];

export default function StrengthPage() {
  const [logs, setLogs] = useState<StrengthLog[]>([]);
  const [exercise, setExercise] = useState(DEFAULT_LIFTS[0]);
  const [custom, setCustom] = useState("");
  const [reps, setReps] = useState("5");
  const [weight, setWeight] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/strength");
    const json = await res.json();
    setLogs(json.logs ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const chartData = useMemo(() => {
    const byDate = new Map<string, Record<string, number>>();
    for (const log of [...logs].reverse()) {
      const row = byDate.get(log.date) ?? { date: log.date } as Record<
        string,
        number | string
      >;
      const key = log.exercise;
      const prev = typeof row[key] === "number" ? (row[key] as number) : 0;
      row[key] = Math.max(prev, log.estimated1rm ?? log.weightKg);
      byDate.set(log.date, row as Record<string, number>);
    }
    return Array.from(byDate.entries()).map(([date, vals]) => ({
      date,
      label: format(parseISO(date), "MMM d"),
      ...vals,
    }));
  }, [logs]);

  const exercises = useMemo(() => {
    const set = new Set<string>(DEFAULT_LIFTS);
    for (const l of logs) set.add(l.exercise);
    return Array.from(set);
  }, [logs]);

  const series = exercises.filter((e) =>
    logs.some((l) => l.exercise === e),
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const name = custom.trim() || exercise;
      await fetch("/api/strength", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise: name,
          reps: Number(reps),
          weightKg: Number(weight),
          date: new Date().toISOString().slice(0, 10),
        }),
      });
      setWeight("");
      setCustom("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  const colors = [
    "#9fe870",
    "#6eb6ff",
    "#e8a87c",
    "#3dd6c6",
    "#c4a574",
    "#e07a7a",
    "#b8a1ff",
  ];

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <p className="text-xs uppercase tracking-[0.18em] text-[#7a9a82]">
          Force
        </p>
        <h1 className="font-display mt-1 text-4xl">Strength</h1>
        <p className="mt-2 max-w-xl text-[#9aada0]">
          Log working sets; we estimate 1RM (Epley) and chart progress over time.
        </p>
      </header>

      <form
        onSubmit={(e) => void submit(e)}
        className="animate-rise panel grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5"
      >
        <div className="lg:col-span-2">
          <label htmlFor="ex">Exercise</label>
          <select
            id="ex"
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
          >
            {exercises.map((ex) => (
              <option key={ex} value={ex}>
                {ex}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="custom">Or custom name</label>
          <input
            id="custom"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div>
          <label htmlFor="reps">Reps</label>
          <input
            id="reps"
            type="number"
            min={1}
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="kg">Weight (kg)</label>
          <input
            id="kg"
            type="number"
            step="0.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            required
          />
        </div>
        <div className="flex items-end sm:col-span-2 lg:col-span-5">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Add set
          </button>
        </div>
      </form>

      <section className="animate-rise panel p-5" style={{ animationDelay: "0.06s" }}>
        <h2 className="font-display text-xl">Estimated 1RM over time</h2>
        {series.length > 0 ? (
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="label" stroke="#7a9a82" fontSize={11} />
                <YAxis stroke="#7a9a82" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "#121916",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
                <Legend />
                {series.map((ex, i) => (
                  <Line
                    key={ex}
                    type="monotone"
                    dataKey={ex}
                    stroke={colors[i % colors.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="mt-4 text-sm text-[#8a9e90]">
            No lifts yet — add your first set above.
          </p>
        )}
      </section>

      <section className="animate-rise panel overflow-x-auto p-5" style={{ animationDelay: "0.1s" }}>
        <h2 className="font-display text-xl">Log</h2>
        <table className="mt-3 w-full min-w-[32rem] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-[#7a9a82]">
            <tr>
              <th className="pb-2 pr-3">Date</th>
              <th className="pb-2 pr-3">Exercise</th>
              <th className="pb-2 pr-3">Set</th>
              <th className="pb-2 pr-3">e1RM</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-white/5">
                <td className="py-2 pr-3 tabular-nums text-[#8a9e90]">
                  {l.date}
                </td>
                <td className="py-2 pr-3">{l.exercise}</td>
                <td className="py-2 pr-3 tabular-nums">
                  {formatNumber(l.weightKg, 1)} × {l.reps}
                </td>
                <td className="py-2 pr-3 tabular-nums text-[#9fe870]">
                  {formatNumber(l.estimated1rm ?? l.weightKg, 1)} kg
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
