"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
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

export default function TodayPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [meals, setMeals] = useState<Meal[]>([]);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
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

  const load = useCallback(async () => {
    const [mRes, pRes] = await Promise.all([
      fetch(`/api/meals?date=${today}`),
      fetch("/api/profile"),
    ]);
    const mJson = await mRes.json();
    const pJson = await pRes.json();
    setMeals(mJson.meals ?? []);
    setProfile(pJson);
  }, [today]);

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
    1900;
  const proteinTarget =
    profile?.profile.proteinTarget ?? profile?.mmp.macros.proteinG ?? 150;
  const maintenance =
    profile?.profile.maintenanceKcal ??
    profile?.mmp.macros.realExpenditure ??
    2400;

  const calPct = Math.min(100, (totals.calories / calorieTarget) * 100);
  const proteinPct = Math.min(100, (totals.proteinG / proteinTarget) * 100);
  const underTarget = totals.calories <= calorieTarget;

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
          date: today,
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
              "radial-gradient(circle at 20% 20%, rgba(159,232,112,0.15), transparent 40%), radial-gradient(circle at 80% 0%, rgba(61,214,198,0.12), transparent 35%)",
          }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#7a9a82]">
              {format(new Date(), "EEE d MMM")}
            </p>
            <h1 className="font-display mt-1 text-4xl tracking-tight text-[#f2f7f3] md:text-5xl">
              caltrack
            </h1>
            <p className="mt-2 max-w-md text-[#9aada0]">
              Snap a plate or describe it — Grok estimates the macros.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Log meal
          </button>
        </div>

        <div className="relative mt-8 grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <p
                className="font-display text-3xl tabular-nums md:text-4xl"
                style={{ color: underTarget ? "var(--accent)" : "var(--warn)" }}
              >
                {formatNumber(Math.round(totals.calories))}
                <span className="text-lg text-[#7a9a82]">
                  {" "}
                  / {formatNumber(calorieTarget)} kcal
                </span>
              </p>
              <p className="text-sm text-[#8a9e90]">
                deficit {formatNumber(Math.round(maintenance - totals.calories))}
              </p>
            </div>
            <div className="progress-track mt-3">
              <div
                className="progress-fill animate-bar"
                style={{
                  width: `${calPct}%`,
                  background: underTarget ? "var(--accent)" : "var(--warn)",
                }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-[#7a9a82]">
              <span>target {formatNumber(calorieTarget)}</span>
              <span>maintenance {formatNumber(maintenance)}</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-[#9aada0]">
              <span className="font-semibold text-[var(--protein)]">
                {formatNumber(Math.round(totals.proteinG))} g protein
              </span>
              <span className="text-[#7a9a82]">
                {" "}
                · goal {formatNumber(proteinTarget)} g
              </span>
            </p>
            <div className="progress-track mt-3">
              <div
                className="progress-fill animate-bar"
                style={{
                  width: `${proteinPct}%`,
                  background: "var(--protein)",
                  animationDelay: "0.12s",
                }}
              />
            </div>
            <p className="mt-3 text-xs text-[#7a9a82]">
              {meals.length} items · {formatNumber(Math.round(totals.carbsG))} g
              carbs · {formatNumber(Math.round(totals.fatG))} g fat
            </p>
          </div>
        </div>
      </section>

      <section className="animate-rise space-y-4" style={{ animationDelay: "0.08s" }}>
        {grouped.map(({ type, items }) =>
          items.length === 0 ? null : (
            <div key={type} className="panel p-4">
              <h2 className="mb-3 text-xs uppercase tracking-[0.16em] text-[#7a9a82]">
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
                        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/5 text-xs text-[#7a9a82]">
                          —
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-[#eef5f0]">
                          {m.name}
                          {m.quantity ? (
                            <span className="text-[#7a9a82]">
                              {" "}
                              · {m.quantity}
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-[#7a9a82]">
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
                        <p className="text-[#cfe0d4]">
                          {formatNumber(m.calories, 0)} kcal
                        </p>
                      </div>
                      <button
                        type="button"
                        className="rounded-md p-2 text-[#7a9a82] hover:bg-white/5 hover:text-[var(--danger)]"
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
        {meals.length === 0 ? (
          <div className="panel p-8 text-center text-[#8a9e90]">
            No meals yet today. Log your first plate to start the day.
          </div>
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
            <p className="mt-1 text-sm text-[#8a9e90]">
              Photo and/or description → Grok 4 vision estimates macros.
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
                  rows={3}
                  placeholder="e.g. beef stir-fry with rice, ~250g cooked, olive oil"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                    <p className="text-xs text-[#8a9e90]">{draft.notes}</p>
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
