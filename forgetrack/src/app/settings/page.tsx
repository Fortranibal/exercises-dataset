"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BodyAnatomy } from "@/components/body-anatomy";
import {
  ACTIVITY_MULTIPLIERS,
  type ActivityLevel,
  type CycleStrategy,
  type Gender,
  type PhaseCycle,
} from "@/lib/mmp/coefficients";
import { estimateBodyFatPct } from "@/lib/mmp/calculate";
import { formatNumber } from "@/lib/utils";

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

  const estimatedBf = useMemo(() => {
    if (!profile) return null;
    return estimateBodyFatPct({
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      age: profile.age,
      gender: profile.gender,
    });
  }, [profile]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || estimatedBf == null) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profile, bodyFatPct: estimatedBf }),
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

  if (!profile || estimatedBf == null) {
    return <div className="text-[var(--mute)]">Loading profile…</div>;
  }

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => (p ? { ...p, [key]: value } : p));
  }

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--mute)]">
          Personal information
        </p>
        <h1 className="font-display mt-1 text-4xl text-[var(--highlight)]">
          Profile
        </h1>
        <p className="mt-2 max-w-xl text-[var(--mute)]">
          Map your vitals and bone structure onto the figure. Body fat is
          estimated from height, weight, age & gender.
        </p>
      </header>

      <form onSubmit={(e) => void save(e)} className="space-y-4">
        <section className="animate-rise panel overflow-hidden p-4 md:p-6">
          <div className="mx-auto w-full max-w-3xl">
            <BodyAnatomy
              heightCm={profile.heightCm}
              weightKg={profile.weightKg}
              age={profile.age}
              gender={profile.gender}
              bodyFatPct={estimatedBf}
              wristCm={profile.wristCm}
              ankleCm={profile.ankleCm}
              kneeCm={profile.kneeCm}
            />
          </div>

          <div className="mt-8 space-y-5 border-t border-white/[0.06] pt-6">
              <div>
                <h2 className="font-display text-xl text-[var(--highlight)]">
                  Core vitals
                </h2>
                <p className="mt-1 text-sm text-[var(--mute)]">
                  Primary fields drive the figure callouts and the body-fat
                  estimate.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <VitalField
                    id="height"
                    label="Height"
                    unit="cm"
                    tone="primary"
                    type="number"
                    value={profile.heightCm}
                    onChange={(v) => set("heightCm", Number(v))}
                  />
                  <VitalField
                    id="weight"
                    label="Weight"
                    unit="kg"
                    tone="primary"
                    type="number"
                    value={profile.weightKg}
                    onChange={(v) => set("weightKg", Number(v))}
                  />
                  <VitalField
                    id="age"
                    label="Age"
                    unit="years"
                    tone="secondary"
                    type="number"
                    value={profile.age}
                    onChange={(v) => set("age", Number(v))}
                  />
                  <div className="rounded-xl border border-[var(--secondary)]/30 bg-[var(--secondary)]/[0.06] p-3">
                    <label
                      htmlFor="gender"
                      className="!text-[var(--secondary)]"
                    >
                      Gender
                    </label>
                    <select
                      id="gender"
                      value={profile.gender}
                      onChange={(e) =>
                        set("gender", e.target.value as Gender)
                      }
                    >
                      <option value="F">Female</option>
                      <option value="M">Male</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-black/25 p-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--secondary)]">
                      Body fat
                    </p>
                    <p className="font-display mt-1 text-3xl tabular-nums text-[var(--highlight)]">
                      {formatNumber(estimatedBf, 1)}%
                    </p>
                  </div>
                  <p className="max-w-xs text-right text-xs text-[var(--mute)]">
                    Read-only · refreshes when vitals change
                  </p>
                </div>
              </div>

              <div>
                <h2 className="font-display text-lg text-[var(--highlight)]">
                  Bone structure
                </h2>
                <p className="mt-1 text-sm text-[var(--mute)]">
                  Circumferences for MMP ceilings — mirrored on the figure.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <VitalField
                    id="wrist"
                    label="Wrist"
                    unit="cm"
                    tone="secondary"
                    type="number"
                    value={profile.wristCm}
                    onChange={(v) => set("wristCm", Number(v))}
                  />
                  <VitalField
                    id="knee"
                    label="Knee"
                    unit="cm"
                    tone="secondary"
                    type="number"
                    value={profile.kneeCm}
                    onChange={(v) => set("kneeCm", Number(v))}
                  />
                  <VitalField
                    id="ankle"
                    label="Ankle"
                    unit="cm"
                    tone="secondary"
                    type="number"
                    value={profile.ankleCm}
                    onChange={(v) => set("ankleCm", Number(v))}
                  />
                </div>
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
          </div>
        </section>

        <section
          className="animate-rise panel p-5"
          style={{ animationDelay: "0.08s" }}
        >
          <h2 className="font-display text-xl text-[var(--highlight)]">
            Cycle & overrides
          </h2>
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
          {msg ? (
            <p className="text-sm text-[var(--primary)]">{msg}</p>
          ) : null}
        </div>
      </form>
    </div>
  );
}

function VitalField({
  id,
  label,
  unit,
  tone,
  type,
  value,
  onChange,
}: {
  id: string;
  label: string;
  unit: string;
  tone: "primary" | "secondary";
  type: string;
  value: string | number;
  onChange: (v: string) => void;
}) {
  const shell =
    tone === "primary"
      ? "border-[var(--primary)]/30 bg-[var(--primary)]/[0.06]"
      : "border-[var(--secondary)]/30 bg-[var(--secondary)]/[0.06]";
  const labelClass =
    tone === "primary" ? "!text-[var(--primary)]" : "!text-[var(--secondary)]";

  return (
    <div className={`rounded-xl border p-3 ${shell}`}>
      <label htmlFor={id} className={labelClass}>
        {label}{" "}
        <span className="normal-case tracking-normal text-[var(--mute)]">
          [{unit}]
        </span>
      </label>
      <input
        id={id}
        type={type}
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-display text-lg tabular-nums"
      />
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
