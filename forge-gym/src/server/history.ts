import { prisma } from "@/lib/prisma";
import { titleCase } from "@/lib/utils";

export type WorkoutSummary = {
  id: string;
  name: string;
  completedAt: string;
  durationSec: number;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  exerciseCount: number;
  topExercises: string[];
};

export async function getWorkoutHistory(limit?: number): Promise<WorkoutSummary[]> {
  const workouts = await prisma.workout.findMany({
    where: { completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    ...(limit ? { take: limit } : {}),
    include: {
      exercises: {
        orderBy: { sortOrder: "asc" },
        include: {
          sets: true,
          exercise: { select: { name: true } },
        },
      },
    },
  });

  return workouts.map((w) => {
    let totalSets = 0;
    let totalReps = 0;
    let totalVolume = 0;
    for (const ex of w.exercises) {
      for (const s of ex.sets) {
        totalSets += 1;
        totalReps += s.reps;
        totalVolume += s.weight * s.reps;
      }
    }
    return {
      id: w.id,
      name: w.name,
      completedAt: w.completedAt!.toISOString(),
      durationSec: w.durationSec,
      totalSets,
      totalReps,
      totalVolume,
      exerciseCount: w.exercises.length,
      topExercises: w.exercises.slice(0, 3).map((e) => titleCase(e.exercise.name)),
    };
  });
}

/** All completed-workout timestamps (ISO) for calendar/heatmap rendering. */
export async function getTrainingDates(): Promise<string[]> {
  const rows = await prisma.workout.findMany({
    where: { completedAt: { not: null } },
    select: { completedAt: true },
    orderBy: { completedAt: "desc" },
  });
  return rows.map((r) => r.completedAt!.toISOString());
}
