"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { addDays, format, isToday, parseISO } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { MacroRing } from "@/components/macro-ring";
import { proteinStreak } from "@/lib/adherence";
import { asMealType, formatNumber, mealTypeLabel } from "@/lib/utils";
import type { Meal } from "@/lib/db/schema";

type ProfileResponse = {
  profile: {
    calorieTarget: number | null;
    proteinTarget: number | null;
    maintenanceKcal: number | null;
    weightKg: number;
    bodyFatPct: number;
    phase: string;
  };
  mmp: {
    macros: {
      targetKcal: number;
      proteinG: number;
      realExpenditure: number;
    };
  };
};

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function todayKey() {
  return format(new Date(), "yyyy-MM-dd");
}

export default function TodayPage() {
  const [date, setDate] = useState(todayKey);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [description, setDescription] = useState("");
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [preview, setPreview] = useState<string | null>(null);
  const [draft, setDraft] = useState<{
    name: string;
    quantity: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    mealType: MealType;
    notes?: string;
  } | null>(null);

  const viewingToday = isToday(parseISO(date));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, pRes, sRes] = await Promise.all([
        fetch(`/api/meals?date=${date}`),
        fetch("/api/profile"),
        fetch("/api/stats"),
      ]);
      const mJson = await mRes.json();
      const pJson = await pRes.json();
      const sJson = await sRes.json();
      setMeals(mJson.meals ?? []);
      setProfile(pJson);
      const proteinFloor =
        pJson.profile?.proteinTarget ?? pJson.mmp?.macros?.proteinG ?? 150;
      setStreak(
        proteinStreak(sJson.daily ?? [], proteinFloor, todayKey()),
      );
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    return meals.reduce(
      (acc, m) => {
        acc.calories += m.calories;
        acc.proteinG += m.proteinG;
        acc.carbsG += m.carbsG;
        acc.fatG += m.fatG;
        return acc;
      },
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    );
  }, [meals]);

  const calorieTarget =
    profile?.profile.calorieTarget ??
    profile?.mmp.macros.targetKcal ??
    null;
  const proteinTarget =
    profile?.profile.proteinTarget ?? profile?.mmp.macros.proteinG ?? null;
  const maintenance =
    profile?.profile.maintenanceKcal ??
    profile?.mmp.macros.realExpenditure ??
    null;

  const underTarget =
    calorieTarget == null ? true : totals.calories <= calorieTarget;
  const proteinHit =
    proteinTarget != null && totals.proteinG >= proteinTarget;
  const energyDelta =
    maintenance != null ? Math.round(maintenance - totals.calories) : null;

  async function onFile(file: File | null) {
    if (!file) {
      setPreview(null);
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setPreview(dataUrl);
  }

  async function analyze() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          imageDataUrl: preview,
          mealTypeHint: mealType,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Analysis failed");
      const a = json.analysis;
      setDraft({
        name: a.name,
        quantity: a.quantity,
        calories: Math.round(a.calories),
        proteinG: Math.round(a.proteinG * 10) / 10,
        carbsG: Math.round(a.carbsG * 10) / 10,
        fatG: Math.round(a.fatG * 10) / 10,
        mealType: a.mealType || mealType,
        notes: a.notes,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveMeal() {
    if (!draft) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          description,
          date,
          imageDataUrl: preview,
          aiRaw: draft,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      setOpen(false);
      setDescription("");
      setPreview(null);
      setDraft(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function removeMeal(id: string) {
    await fetch(`/api/meals?id=${id}`, { method: "DELETE" });
    await load();
  }

  function shiftDay(delta: number) {
    const next = format(addDays(parseISO(date), delta), "yyyy-MM-dd");
    if (next > todayKey()) return;
    setDate(next);
  }

  const grouped = useMemo(() => {
    const order: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
    const map: Record<MealType, Meal[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };
    for (const m of meals) {
      const t = (m.mealType as MealType) || "snack";
      map[t].push(m);
    }
    return order.map((t) => ({ type: t, items: map[t] }));
  }, [meals]);

  return (
    <div className="space-y-6">
      <section className="animate-rise panel relative overflow-hidden p-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(200,240,122,0.14), transparent 40%), radial-gradient(circle at 80% 0%, rgba(62,207,191,0.1), transparent 35%)",
          }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-md p-1.5 text-[var(--muted)] hover:bg-white/5 hover:text-[#f4f4f5]"
                onClick={() => shiftDay(-1)}
                aria-label="Previous day"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                {format(parseISO(date), "EEE d MMM")}
              </p>
              <button
                type="button"
                className="rounded-md p-1.5 text-[var(--muted)] hover:bg-white/5 hover:text-[#f4f4f5] disabled:opacity-30"
                onClick={() => shiftDay(1)}
                disabled={viewingToday}
                aria-label="Next day"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              {!viewingToday ? (
                <button
                  type="button"
                  className="ml-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]"
                  onClick={() => setDate(todayKey())}
                >
                  Jump to today
                </button>
              ) : null}
            </div>
            <h1 className="font-display mt-1 text-4xl tracking-tight text-[#f4f4f5] md:text-5xl">
              {viewingToday ? "Today" : format(parseISO(date), "MMM d")}
            </h1>
            <p className="mt-2 max-w-md text-[var(--muted)]">
              Snap a plate or describe it — Grok estimates the macros.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            data-testid="log-meal-open"
            onClick={() => setOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Log meal
          </button>
        </div>

        <div className="relative mt-5 flex flex-wrap gap-2">
          <span
            className="status-chip"
            data-tone={underTarget ? "ok" : "warn"}
          >
            {calorieTarget == null
              ? "Target pending"
              : underTarget
                ? "On calorie target"
                : "Over calorie target"}
          </span>
          <span
            className="status-chip"
            data-tone={proteinHit ? "info" : undefined}
          >
            {proteinTarget == null
              ? "Protein pending"
              : proteinHit
                ? "Protein hit"
                : `${formatNumber(Math.max(0, Math.round((proteinTarget ?? 0) - totals.proteinG)))}g protein left`}
          </span>
          {energyDelta != null ? (
            <span
              className="status-chip"
              data-tone={energyDelta >= 0 ? "ok" : "warn"}
            >
              {energyDelta >= 0 ? "Deficit" : "Surplus"}{" "}
              {formatNumber(Math.abs(energyDelta))} kcal
            </span>
          ) : null}
          {streak > 0 ? (
            <span className="status-chip" data-tone="info">
              {streak}d protein streak
            </span>
          ) : null}
        </div>

        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-8 sm:justify-start md:gap-12">
          <MacroRing
            value={totals.calories}
            target={calorieTarget}
            label="Calories"
            color="var(--accent)"
            loading={loading}
          />
          <MacroRing
            value={totals.proteinG}
            target={proteinTarget}
            label="Protein"
            unit="g"
            color="var(--protein)"
            loading={loading}
          />
          <div className="min-w-[9rem] space-y-2 text-sm text-[var(--muted)]">
            <p>
              <span className="text-[#f4f4f5]">
                {loading ? "…" : formatNumber(Math.round(totals.carbsG))}g
              </span>{" "}
              carbs
            </p>
            <p>
              <span className="text-[#f4f4f5]">
                {loading ? "…" : formatNumber(Math.round(totals.fatG))}g
              </span>{" "}
              fat
            </p>
            <p>
              {meals.length} item{meals.length === 1 ? "" : "s"} logged
            </p>
            {maintenance != null ? (
              <p className="text-xs">
                Maintenance {formatNumber(maintenance)}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section
        className="animate-rise space-y-4"
        style={{ animationDelay: "0.08s" }}
      >
        {loading ? (
          <div className="panel space-y-3 p-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-lg bg-white/[0.04]"
                style={{ animationDelay: `${i * 0.06}s` }}
              />
            ))}
          </div>
        ) : null}

        {!loading &&
          grouped.map(({ type, items }) =>
            items.length === 0 ? null : (
              <div key={type} className="panel p-4">
                <h2 className="mb-3 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  {mealTypeLabel(asMealType(type))}
                </h2>
                <ul className="space-y-3">
                  {items.map((m) => {
                    const share =
                      totals.calories > 0
                        ? Math.round((m.calories / totals.calories) * 100)
                        : 0;
                    return (
                      <li
                        key={m.id}
                        className="flex items-center gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0"
                      >
                        {m.photoPath ? (
                          <Image
                            src={m.photoPath}
                            alt={m.name}
                            width={56}
                            height={56}
                            className="h-14 w-14 rounded-lg object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/5 text-xs text-[var(--muted)]">
                            —
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-[#f4f4f5]">
                            {m.name}
                            {m.quantity ? (
                              <span className="text-[var(--muted)]">
                                {" "}
                                · {m.quantity}
                              </span>
                            ) : null}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {m.time ?? "—"} · {share}% of day
                          </p>
                          <div className="progress-track mt-1.5 max-w-[12rem]">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${share}%`,
                                background: "var(--accent-2)",
                              }}
                            />
                          </div>
                        </div>
                        <div className="text-right text-sm tabular-nums">
                          <p className="text-[var(--protein)]">
                            {formatNumber(m.proteinG, 0)}g P
                          </p>
                          <p className="text-[#d4d4d8]">
                            {formatNumber(m.calories, 0)} kcal
                          </p>
                        </div>
                        <button
                          type="button"
                          className="rounded-md p-2 text-[var(--muted)] hover:bg-white/5 hover:text-[var(--danger)]"
                          onClick={() => void removeMeal(m.id)}
                          aria-label="Delete meal"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ),
          )}

        {!loading && meals.length === 0 ? (
          <EmptyState
            title={viewingToday ? "Nothing logged yet" : "No meals this day"}
            hint="Photo or describe a plate — Grok fills in the macros, or enter them by hand."
            action={
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Log meal
              </button>
            }
          />
        ) : null}
      </section>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="panel max-h-[92vh] w-full max-w-lg overflow-y-auto p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">Log meal</h2>
              <button
                type="button"
                className="btn btn-ghost px-3 py-1.5 text-sm"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Saving to {format(parseISO(date), "EEE d MMM")} · photo and/or
              description → Grok estimates macros.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="meal-type">Meal</label>
                <select
                  id="meal-type"
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value as MealType)}
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>
              <div>
                <label htmlFor="photo">Photo</label>
                <input
                  id="photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
                />
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt="Meal preview"
                    className="mt-2 max-h-48 w-full rounded-lg object-cover"
                  />
                ) : null}
              </div>
              <div>
                <label htmlFor="desc">Description</label>
                <textarea
                  id="desc"
                  name="description"
                  rows={3}
                  placeholder="e.g. beef stir-fry with rice, ~250g cooked, olive oil"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  aria-label="Description"
                />
              </div>

              <button
                type="button"
                className="btn btn-primary w-full"
                disabled={busy || (!preview && !description.trim())}
                onClick={() => void analyze()}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Analyze with Grok
              </button>

              {!draft ? (
                <button
                  type="button"
                  className="btn btn-ghost w-full"
                  disabled={busy || (!preview && !description.trim())}
                  onClick={() =>
                    setDraft({
                      name: description.trim().slice(0, 80) || "Meal",
                      quantity: "",
                      calories: 0,
                      proteinG: 0,
                      carbsG: 0,
                      fatG: 0,
                      mealType,
                    })
                  }
                >
                  Enter macros manually
                </button>
              ) : null}

              {error ? (
                <p className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[#f0c0c0]">
                  {error}
                </p>
              ) : null}

              {draft ? (
                <div className="space-y-3 rounded-xl border border-white/10 bg-black/25 p-3">
                  <div>
                    <label htmlFor="name">Name</label>
                    <input
                      id="name"
                      value={draft.name}
                      onChange={(e) =>
                        setDraft({ ...draft, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="qty">Quantity</label>
                      <input
                        id="qty"
                        value={draft.quantity}
                        onChange={(e) =>
                          setDraft({ ...draft, quantity: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label htmlFor="kcal">Calories</label>
                      <input
                        id="kcal"
                        type="number"
                        value={draft.calories}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            calories: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label htmlFor="p">Protein (g)</label>
                      <input
                        id="p"
                        type="number"
                        value={draft.proteinG}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            proteinG: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label htmlFor="c">Carbs (g)</label>
                      <input
                        id="c"
                        type="number"
                        value={draft.carbsG}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            carbsG: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label htmlFor="f">Fat (g)</label>
                      <input
                        id="f"
                        type="number"
                        value={draft.fatG}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            fatG: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                  {draft.notes ? (
                    <p className="text-xs text-[var(--muted)]">{draft.notes}</p>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn-primary w-full"
                    disabled={busy}
                    onClick={() => void saveMeal()}
                  >
                    Save meal
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
