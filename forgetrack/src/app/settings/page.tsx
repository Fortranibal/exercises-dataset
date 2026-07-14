"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ACTIVITY_MULTIPLIERS,
  type ActivityLevel,
  type CycleStrategy,
  type Gender,
  type PhaseCycle,
} from "@/lib/mmp/coefficients";

type Profile = {
  heightCm: number;
  weightKg: number;
  age: number;
  gender: Gender;
  activity: ActivityLevel;
  wristCm: number;
  ankleCm: number;
  kneeCm: number;
  bodyFatPct: number;
  phase: PhaseCycle;
  strategy: CycleStrategy;
  calorieTarget: number | null;
  proteinTarget: number | null;
  maintenanceKcal: number | null;
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/profile");
    const json = await res.json();
    setProfile(json.profile);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error("Save failed");
      setMsg("Profile saved.");
      await load();
    } catch {
      setMsg("Could not save profile.");
    } finally {
      setBusy(false);
    }
  }

  if (!profile) {
    return <div className="text-[#8a9e90]">Loading profile…</div>;
  }

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => (p ? { ...p, [key]: value } : p));
  }

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <p className="text-xs uppercase tracking-[0.18em] text-[#7a9a82]">
          Personal information
        </p>
        <h1 className="font-display mt-1 text-4xl">Profile</h1>
        <p className="mt-2 max-w-xl text-[#9aada0]">
          Anthropometrics drive MMP, macros, and progress targets. Seeded from
          your sheet defaults — edit anytime.
        </p>
      </header>

      <form onSubmit={(e) => void save(e)} className="space-y-4">
        <section className="animate-rise panel p-5">
          <h2 className="font-display text-xl">Body</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              id="height"
              label="Height [cm]"
              type="number"
              value={profile.heightCm}
              onChange={(v) => set("heightCm", Number(v))}
            />
            <Field
              id="weight"
              label="Weight [kg]"
              type="number"
              value={profile.weightKg}
              onChange={(v) => set("weightKg", Number(v))}
            />
            <Field
              id="age"
              label="Age"
              type="number"
              value={profile.age}
              onChange={(v) => set("age", Number(v))}
            />
            <div>
              <label htmlFor="gender">Gender (M/F)</label>
              <select
                id="gender"
                value={profile.gender}
                onChange={(e) => set("gender", e.target.value as Gender)}
              >
                <option value="F">F</option>
                <option value="M">M</option>
              </select>
            </div>
            <div>
              <label htmlFor="activity">Physical activity</label>
              <select
                id="activity"
                value={profile.activity}
                onChange={(e) =>
                  set("activity", e.target.value as ActivityLevel)
                }
              >
                {(Object.keys(ACTIVITY_MULTIPLIERS) as ActivityLevel[]).map(
                  (k) => (
                    <option key={k} value={k}>
                      {ACTIVITY_MULTIPLIERS[k].label}
                    </option>
                  ),
                )}
              </select>
            </div>
            <Field
              id="bf"
              label="Body fat [%]"
              type="number"
              value={profile.bodyFatPct}
              onChange={(v) => set("bodyFatPct", Number(v))}
            />
          </div>
        </section>

        <section className="animate-rise panel p-5" style={{ animationDelay: "0.06s" }}>
          <h2 className="font-display text-xl">Bone structure</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Field
              id="wrist"
              label="Wrist [cm]"
              type="number"
              value={profile.wristCm}
              onChange={(v) => set("wristCm", Number(v))}
            />
            <Field
              id="ankle"
              label="Ankle [cm]"
              type="number"
              value={profile.ankleCm}
              onChange={(v) => set("ankleCm", Number(v))}
            />
            <Field
              id="knee"
              label="Knee [cm]"
              type="number"
              value={profile.kneeCm}
              onChange={(v) => set("kneeCm", Number(v))}
            />
          </div>
        </section>

        <section className="animate-rise panel p-5" style={{ animationDelay: "0.1s" }}>
          <h2 className="font-display text-xl">Cycle & overrides</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="phase">Phase</label>
              <select
                id="phase"
                value={profile.phase}
                onChange={(e) => set("phase", e.target.value as PhaseCycle)}
              >
                <option value="cut">Cut</option>
                <option value="maintenance">Maintenance</option>
                <option value="bulk">Bulk</option>
              </select>
            </div>
            <div>
              <label htmlFor="strategy">Strategy</label>
              <select
                id="strategy"
                value={profile.strategy}
                onChange={(e) =>
                  set("strategy", e.target.value as CycleStrategy)
                }
              >
                <option value="conservative">Conservative</option>
                <option value="aggressive">Aggressive</option>
              </select>
            </div>
            <Field
              id="calTarget"
              label="Calorie target override"
              type="number"
              value={profile.calorieTarget ?? ""}
              onChange={(v) =>
                set("calorieTarget", v === "" ? null : Number(v))
              }
            />
            <Field
              id="pTarget"
              label="Protein target override"
              type="number"
              value={profile.proteinTarget ?? ""}
              onChange={(v) =>
                set("proteinTarget", v === "" ? null : Number(v))
              }
            />
            <Field
              id="maint"
              label="Maintenance kcal override"
              type="number"
              value={profile.maintenanceKcal ?? ""}
              onChange={(v) =>
                set("maintenanceKcal", v === "" ? null : Number(v))
              }
            />
          </div>
        </section>

        <div className="flex items-center gap-3">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Save profile
          </button>
          {msg ? <p className="text-sm text-[#9fe870]">{msg}</p> : null}
        </div>
      </form>
    </div>
  );
}

function Field({
  id,
  label,
  type,
  value,
  onChange,
}: {
  id: string;
  label: string;
  type: string;
  value: string | number;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
