"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import type { Meal } from "@/lib/db/schema";
import { asMealType, formatNumber, mealTypeLabel } from "@/lib/utils";

export default function MealsHistoryPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    void fetch("/api/meals")
      .then((r) => r.json())
      .then((j) => setMeals(j.meals ?? []));
  }, []);

  const byDay = useMemo(() => {
    const map = new Map<string, Meal[]>();
    for (const m of meals) {
      if (filter && !m.name.toLowerCase().includes(filter.toLowerCase())) {
        continue;
      }
      const list = map.get(m.date) ?? [];
      list.push(m);
      map.set(m.date, list);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [meals, filter]);

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <p className="text-xs uppercase tracking-[0.18em] text-[#7a9a82]">
          History
        </p>
        <h1 className="font-display mt-1 text-4xl text-[#f2f7f3]">Meals</h1>
        <p className="mt-2 max-w-xl text-[#9aada0]">
          Every logged plate with photos and macro breakdowns, grouped by day.
        </p>
        <input
          className="mt-4 max-w-md"
          placeholder="Filter by food name…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </header>

      <div className="space-y-5">
        {byDay.map(([date, items], idx) => {
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
                <p className="text-sm text-[#8a9e90]">
                  {formatNumber(Math.round(totals.cal))} kcal ·{" "}
                  {formatNumber(Math.round(totals.p))} g protein · {items.length}{" "}
                  items
                </p>
              </div>
              <ul className="space-y-3">
                {items.map((m) => (
                  <li key={m.id} className="flex gap-3">
                    {m.photoPath ? (
                      <Image
                        src={m.photoPath}
                        alt={m.name}
                        width={72}
                        height={72}
                        className="h-[72px] w-[72px] rounded-lg object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-lg bg-white/5 text-xs text-[#7a9a82]">
                        no photo
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[#7a9a82]">
                        {mealTypeLabel(asMealType(m.mealType))}
                        {m.time ? ` · ${m.time}` : ""}
                      </p>
                      <p className="truncate font-medium">{m.name}</p>
                      <p className="text-sm text-[#8a9e90]">
                        {m.quantity || m.description || "—"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right text-sm tabular-nums">
                      <p className="text-[var(--protein)]">
                        {formatNumber(m.proteinG, 0)}g P
                      </p>
                      <p>
                        {formatNumber(m.carbsG, 0)}C · {formatNumber(m.fatG, 0)}
                        F
                      </p>
                      <p className="text-[#cfe0d4]">
                        {formatNumber(m.calories, 0)} kcal
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        {byDay.length === 0 ? (
          <div className="panel p-8 text-center text-[#8a9e90]">
            No meals logged yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}
