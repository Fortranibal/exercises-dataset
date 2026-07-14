"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import { EmptyState } from "@/components/empty-state";
import type { Meal } from "@/lib/db/schema";
import {
  asMealType,
  formatNumber,
  mealTypeLabel,
  type MealType,
} from "@/lib/utils";

const MEAL_FILTERS: Array<"all" | MealType> = [
  "all",
  "breakfast",
  "lunch",
  "dinner",
  "snack",
];

export default function MealsHistoryPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [filter, setFilter] = useState("");
  const [mealFilter, setMealFilter] = useState<"all" | MealType>("all");
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<Meal | null>(null);

  useEffect(() => {
    void fetch("/api/meals")
      .then((r) => r.json())
      .then((j) => setMeals(j.meals ?? []))
      .finally(() => setLoading(false));
  }, []);

  const byDay = useMemo(() => {
    const map = new Map<string, Meal[]>();
    for (const m of meals) {
      if (mealFilter !== "all" && asMealType(m.mealType) !== mealFilter) {
        continue;
      }
      if (filter && !m.name.toLowerCase().includes(filter.toLowerCase())) {
        continue;
      }
      const list = map.get(m.date) ?? [];
      list.push(m);
      map.set(m.date, list);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [meals, filter, mealFilter]);

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--mute)]">
          History
        </p>
        <h1 className="font-display mt-1 text-4xl text-[var(--highlight)]">Meals</h1>
        <p className="mt-2 max-w-xl text-[var(--mute)]">
          Every logged plate with photos and macro breakdowns, grouped by day.
        </p>
        <input
          className="mt-4 max-w-md"
          placeholder="Filter by food name…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {MEAL_FILTERS.map((key) => (
            <button
              key={key}
              type="button"
              className="filter-chip"
              data-active={mealFilter === key}
              onClick={() => setMealFilter(key)}
            >
              {key === "all" ? "All" : mealTypeLabel(key)}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-5">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="panel h-28 animate-pulse bg-white/[0.03]"
                style={{ animationDelay: `${i * 0.05}s` }}
              />
            ))}
          </div>
        ) : null}

        {!loading &&
          byDay.map(([date, items], idx) => {
            const totals = items.reduce(
              (a, m) => {
                a.cal += m.calories;
                a.p += m.proteinG;
                return a;
              },
              { cal: 0, p: 0 },
            );
            return (
              <section
                key={date}
                className="animate-rise panel p-4"
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-xl">
                    {format(parseISO(date), "EEE d MMM yyyy")}
                  </h2>
                  <p className="text-sm text-[var(--mute)]">
                    {formatNumber(Math.round(totals.cal))} kcal ·{" "}
                    {formatNumber(Math.round(totals.p))}P
                  </p>
                </div>
                <ul className="space-y-3">
                  {items.map((m) => (
                    <li key={m.id} className="flex gap-3">
                      {m.photoPath ? (
                        <button
                          type="button"
                          className="shrink-0 overflow-hidden rounded-lg"
                          onClick={() => setLightbox(m)}
                          aria-label={`View photo of ${m.name}`}
                        >
                          <Image
                            src={m.photoPath}
                            alt={m.name}
                            width={72}
                            height={72}
                            className="h-[72px] w-[72px] object-cover transition hover:opacity-90"
                            unoptimized
                          />
                        </button>
                      ) : (
                        <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs text-[var(--mute)]">
                          no photo
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--mute)]">
                          {mealTypeLabel(asMealType(m.mealType))}
                          {m.time ? ` · ${m.time}` : ""}
                        </p>
                        <p className="truncate font-medium">{m.name}</p>
                        <p className="text-sm text-[var(--mute)]">
                          {m.quantity || m.description || "—"}
                        </p>
                      </div>
                      <div className="shrink-0 text-right text-sm tabular-nums">
                        <p className="whitespace-nowrap">
                          <span className="text-[var(--secondary)]">
                            {formatNumber(m.proteinG, 0)}P
                          </span>
                          <span className="text-[var(--mute)]"> · </span>
                          <span className="text-[var(--highlight)]">
                            {formatNumber(m.carbsG, 0)}C
                          </span>
                          <span className="text-[var(--mute)]"> · </span>
                          <span className="text-[var(--highlight)]">
                            {formatNumber(m.fatG, 0)}F
                          </span>
                        </p>
                        <p className="text-[var(--mute)]">
                          {formatNumber(m.calories, 0)} kcal
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

        {!loading && byDay.length === 0 ? (
          <EmptyState
            title="No meals match"
            hint={
              meals.length === 0
                ? "Log your first plate from Today to build history."
                : "Try clearing the search or meal-type filter."
            }
          />
        ) : null}
      </div>

      {lightbox?.photoPath ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setLightbox(null)}
          role="presentation"
        >
          <div
            className="panel max-w-lg overflow-hidden p-3"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={lightbox.name}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.photoPath}
              alt={lightbox.name}
              className="max-h-[70vh] w-full rounded-lg object-contain"
            />
            <div className="mt-3 flex items-start justify-between gap-3 px-1">
              <div>
                <p className="font-medium">{lightbox.name}</p>
                <p className="text-sm text-[var(--mute)]">
                  {formatNumber(lightbox.calories, 0)} kcal ·{" "}
                  {formatNumber(lightbox.proteinG, 0)}P
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost px-3 py-1.5 text-sm"
                onClick={() => setLightbox(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
