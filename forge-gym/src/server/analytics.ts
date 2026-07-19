import { startOfWeek, format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { parseSecondaryMuscles } from "@/lib/exercise";
import {
  attributeVolume,
  primaryGroup,
  type MuscleGroup,
} from "@/lib/muscles";

export type MuscleStat = {
  group: MuscleGroup;
  sets: number;
  reps: number;
  volume: number;
  workouts: number;
};

export type AnalyticsData = {
  totals: { workouts: number; sets: number; reps: number; volume: number };
  muscles: MuscleStat[];
  trend: { label: string; volume: number }[];
};

export async function getAnalytics(
  from: Date | null,
  to: Date | null,
): Promise<AnalyticsData> {
  const workouts = await prisma.workout.findMany({
    where: {
      completedAt: {
        not: null,
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      },
    },
    include: {
      exercises: {
        include: {
          sets: true,
          exercise: { select: { target: true, secondaryMuscles: true } },
        },
      },
    },
    orderBy: { completedAt: "asc" },
  });

  const totals = { workouts: workouts.length, sets: 0, reps: 0, volume: 0 };
  const byGroup = new Map<
    MuscleGroup,
    { sets: number; reps: number; volume: number; workouts: Set<string> }
  >();
  const ensure = (g: MuscleGroup) => {
    let v = byGroup.get(g);
    if (!v) {
      v = { sets: 0, reps: 0, volume: 0, workouts: new Set<string>() };
      byGroup.set(g, v);
    }
    return v;
  };
  const weekly = new Map<string, number>();

  for (const w of workouts) {
    if (!w.completedAt) continue;
    const weekKey = format(startOfWeek(w.completedAt, { weekStartsOn: 1 }), "yyyy-MM-dd");
    for (const we of w.exercises) {
      const target = we.exercise.target;
      const secondary = parseSecondaryMuscles(we.exercise.secondaryMuscles);
      const primary = primaryGroup(target);
      for (const s of we.sets) {
        const vol = s.weight * s.reps;
        totals.sets += 1;
        totals.reps += s.reps;
        totals.volume += vol;

        const pg = ensure(primary);
        pg.sets += 1;
        pg.reps += s.reps;
        pg.workouts.add(w.id);

        const dist = attributeVolume(target, secondary, vol);
        for (const key of Object.keys(dist) as MuscleGroup[]) {
          ensure(key).volume += dist[key] ?? 0;
        }
        weekly.set(weekKey, (weekly.get(weekKey) ?? 0) + vol);
      }
    }
  }

  const muscles: MuscleStat[] = [...byGroup.entries()]
    .map(([group, v]) => ({
      group,
      sets: v.sets,
      reps: v.reps,
      volume: Math.round(v.volume),
      workouts: v.workouts.size,
    }))
    .sort((a, b) => b.volume - a.volume);

  const trend = [...weekly.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => ({ label: format(new Date(k), "MMM d"), volume: Math.round(v) }));

  return { totals, muscles, trend };
}
