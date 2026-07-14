"use client";

import { useCallback, useEffect, useState } from "react";
import { formatNumber } from "@/lib/utils";

type MmpPayload = {
  profile: {
    heightCm: number;
    weightKg: number;
    wristCm: number;
    ankleCm: number;
    kneeCm: number;
    bodyFatPct: number;
    gender: string;
    activity: string;
    phase: string;
    strategy: string;
  };
  mmp: {
    simpleMaxLbmKg: number;
    caseyMaxLbmKg: number;
    avgMaxLbmKg: number;
    realisticMaxLbmKg: number;
    currentLbmKg: number;
    remainingLbmKg: number;
    measurements: Record<string, number>;
    progress: Record<string, number | null>;
    ratios: Record<string, number | null>;
    goldenTargets: Record<string, number>;
    macros: {
      targetKcal: number;
      proteinG: number;
      fatG: number;
      carbsG: number;
      realExpenditure: number;
      weeklyDeltaKg: number;
    };
  };
};

const MEASUREMENT_LABELS: Record<string, string> = {
  chest: "Chest",
  shoulder: "Shoulder",
  neck: "Neck",
  upperArm: "Upper arm",
  foreArm: "Forearm",
  thigh: "Thigh",
  calf: "Calf",
  glutes: "Glutes",
};

export default function MmpPage() {
  const [data, setData] = useState<MmpPayload | null>(null);
  const [weight, setWeight] = useState("");
  const [bf, setBf] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/profile");
    const json = await res.json();
    setData(json);
    setWeight(String(json.profile.weightKg));
    setBf(String(json.profile.bodyFatPct));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function logCheckIn() {
    setBusy(true);
    setMsg(null);
    try {
      const weightKg = Number(weight);
      const bodyFatPct = Number(bf);
      await fetch("/api/body-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString().slice(0, 10),
          weightKg,
          bodyFatPct,
        }),
      });
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weightKg, bodyFatPct }),
      });
      setMsg("Check-in saved.");
      await load();
    } catch {
      setMsg("Could not save check-in.");
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return <div className="text-[#8a9e90]">Loading MMP…</div>;
  }

  const { mmp, profile } = data;

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <p className="text-xs uppercase tracking-[0.18em] text-[#7a9a82]">
          Genetics ceiling
        </p>
        <h1 className="font-display mt-1 text-4xl">Maximum muscular potential</h1>
        <p className="mt-2 max-w-2xl text-[#9aada0]">
          Casey Butt lean-mass estimate plus measurement regressions and golden
          ratios — coefficients live in{" "}
          <code className="text-[#9fe870]">src/lib/mmp/coefficients.ts</code>.
        </p>
      </header>

      <section className="animate-rise grid gap-4 md:grid-cols-3">
        <Stat
          label="Simple max LBM"
          value={`${formatNumber(mmp.simpleMaxLbmKg, 1)} kg`}
          hint="height − 100"
        />
        <Stat
          label="Casey Butt max LBM"
          value={`${formatNumber(mmp.caseyMaxLbmKg, 1)} kg`}
          hint={`gender scale ${profile.gender === "F" ? "0.83" : "1.0"}`}
        />
        <Stat
          label="Remaining to avg MMP"
          value={`${formatNumber(mmp.remainingLbmKg, 1)} kg`}
          hint={`current LBM ${formatNumber(mmp.currentLbmKg, 1)} kg`}
        />
      </section>

      <section className="animate-rise panel p-5" style={{ animationDelay: "0.06s" }}>
        <h2 className="font-display text-xl">Quick check-in</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="w">Weight (kg)</label>
            <input
              id="w"
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="bf">Body fat %</label>
            <input
              id="bf"
              type="number"
              step="0.1"
              value={bf}
              onChange={(e) => setBf(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              className="btn btn-primary w-full"
              disabled={busy}
              onClick={() => void logCheckIn()}
            >
              Save check-in
            </button>
          </div>
        </div>
        {msg ? <p className="mt-2 text-sm text-[#9fe870]">{msg}</p> : null}
      </section>

      <section className="animate-rise panel p-5" style={{ animationDelay: "0.1s" }}>
        <h2 className="font-display text-xl">Maximum measurements</h2>
        <p className="mb-4 text-sm text-[#8a9e90]">
          Predicted MMP circumferences from wrist, ankle, and height.
        </p>
        <ul className="space-y-3">
          {Object.entries(mmp.measurements).map(([key, value]) => {
            const progress = mmp.progress[key];
            const pct =
              progress != null ? Math.min(100, Math.round(progress * 100)) : null;
            return (
              <li key={key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{MEASUREMENT_LABELS[key] ?? key}</span>
                  <span className="tabular-nums text-[#8a9e90]">
                    MMP {formatNumber(value, 1)} cm
                    {pct != null ? ` · ${pct}%` : ""}
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${pct ?? 0}%`,
                      background: "var(--accent)",
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="animate-rise panel p-5" style={{ animationDelay: "0.14s" }}>
          <h2 className="font-display text-xl">Golden ratios</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(
              [
                ["chestWrist", "Chest / wrist"],
                ["shoulderAbdomen", "Shoulder / abdomen"],
                ["armWrist", "Arm / wrist"],
                ["thighKnee", "Thigh / knee"],
                ["calfAnkle", "Calf / ankle"],
                ["gluteAnkle", "Glute / ankle"],
              ] as const
            ).map(([key, label]) => (
              <li
                key={key}
                className="flex justify-between border-b border-white/5 py-2"
              >
                <span className="text-[#9aada0]">{label}</span>
                <span className="tabular-nums">
                  {mmp.ratios[key] != null
                    ? formatNumber(mmp.ratios[key] as number, 2)
                    : "—"}
                  <span className="text-[#7a9a82]">
                    {" "}
                    / {formatNumber(mmp.goldenTargets[key], 2)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="animate-rise panel p-5" style={{ animationDelay: "0.18s" }}>
          <h2 className="font-display text-xl">Phase macros</h2>
          <p className="mt-1 text-sm text-[#8a9e90]">
            From activity multipliers + phase coefficients in the sheet.
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-[#7a9a82]">Target kcal</dt>
              <dd className="font-display text-2xl">
                {formatNumber(mmp.macros.targetKcal)}
              </dd>
            </div>
            <div>
              <dt className="text-[#7a9a82]">Maintenance</dt>
              <dd className="font-display text-2xl">
                {formatNumber(mmp.macros.realExpenditure)}
              </dd>
            </div>
            <div>
              <dt className="text-[#7a9a82]">Protein</dt>
              <dd>{mmp.macros.proteinG} g</dd>
            </div>
            <div>
              <dt className="text-[#7a9a82]">Fat</dt>
              <dd>{mmp.macros.fatG} g</dd>
            </div>
            <div>
              <dt className="text-[#7a9a82]">Carbs</dt>
              <dd>{mmp.macros.carbsG} g</dd>
            </div>
            <div>
              <dt className="text-[#7a9a82]">Weekly ∆ weight</dt>
              <dd>{formatNumber(mmp.macros.weeklyDeltaKg, 2)} kg</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="panel p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-[#7a9a82]">
        {label}
      </p>
      <p className="font-display mt-1 text-3xl">{value}</p>
      <p className="mt-1 text-xs text-[#8a9e90]">{hint}</p>
    </div>
  );
}
