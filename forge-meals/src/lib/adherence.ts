import { format, parseISO, subDays } from "date-fns";

export type DailyTotals = {
  date: string;
  calories: number;
  proteinG: number;
};

/** Consecutive days ending at `endDate` that hit the protein floor. */
export function proteinStreak(
  daily: DailyTotals[],
  proteinFloor: number,
  endDate: string,
): number {
  const byDate = new Map(daily.map((d) => [d.date, d]));
  let streak = 0;
  let cursor = parseISO(endDate);
  for (let i = 0; i < 120; i++) {
    const key = format(cursor, "yyyy-MM-dd");
    const hit = byDate.get(key);
    if (!hit || hit.proteinG < proteinFloor) break;
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

/** Share of logged days in the window that hit protein floor. */
export function proteinHitRate(
  daily: DailyTotals[],
  proteinFloor: number,
  days = 30,
): { hits: number; logged: number; pct: number } {
  const cutoff = format(subDays(new Date(), days - 1), "yyyy-MM-dd");
  const windowed = daily.filter((d) => d.date >= cutoff);
  const hits = windowed.filter((d) => d.proteinG >= proteinFloor).length;
  const logged = windowed.length;
  return {
    hits,
    logged,
    pct: logged > 0 ? Math.round((hits / logged) * 100) : 0,
  };
}

export function averageCalories(daily: DailyTotals[], days = 30): number {
  const cutoff = format(subDays(new Date(), days - 1), "yyyy-MM-dd");
  const windowed = daily.filter((d) => d.date >= cutoff);
  if (windowed.length === 0) return 0;
  const sum = windowed.reduce((a, d) => a + d.calories, 0);
  return Math.round(sum / windowed.length);
}
