import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { format, parseISO, startOfDay } from "date-fns";

export const runtime = "nodejs";

export async function GET() {
  const meals = await db.select().from(schema.meals);
  const bodyLogs = await db.select().from(schema.bodyLogs);

  const byDate = new Map<
    string,
    { calories: number; proteinG: number; carbsG: number; fatG: number; count: number }
  >();

  for (const m of meals) {
    const cur = byDate.get(m.date) ?? {
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      count: 0,
    };
    cur.calories += m.calories;
    cur.proteinG += m.proteinG;
    cur.carbsG += m.carbsG;
    cur.fatG += m.fatG;
    cur.count += 1;
    byDate.set(m.date, cur);
  }

  const daily = Array.from(byDate.entries())
    .map(([date, totals]) => ({
      date,
      month: format(parseISO(date), "yyyy-MM"),
      monthLabel: format(parseISO(date), "MMM"),
      ...totals,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const recomposition = bodyLogs
    .filter((l) => l.bodyFatPct != null)
    .map((l) => {
      const bf = l.bodyFatPct as number;
      const lean = l.weightKg * (1 - bf / 100);
      const fat = l.weightKg - lean;
      return {
        date: l.date,
        weightKg: l.weightKg,
        bodyFatPct: bf,
        leanMassKg: lean,
        fatMassKg: fat,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    daily,
    recomposition,
    generatedAt: startOfDay(new Date()).toISOString(),
  });
}
