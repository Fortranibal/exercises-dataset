import { prisma } from "@/lib/prisma";
import { epley1RM, weightForRM } from "@/lib/strength";

export type ExerciseSessionPoint = {
  date: string;
  bestWeight: number;
  est1RM: number;
  volume: number;
  totalReps: number;
  topSetReps: number;
};

export type ExercisePRs = {
  bestWeight: number;
  best1RM: number;
  bestVolume: number;
  bestReps: number;
};

export type ExerciseProgress = {
  exerciseId: string;
  sessions: ExerciseSessionPoint[];
  prs: ExercisePRs;
};

export async function getExerciseProgress(exerciseId: string): Promise<ExerciseProgress> {
  const wes = await prisma.workoutExercise.findMany({
    where: { exerciseId, workout: { completedAt: { not: null } } },
    include: {
      workout: { select: { completedAt: true } },
      sets: true,
    },
    orderBy: { workout: { completedAt: "asc" } },
  });

  const sessions: ExerciseSessionPoint[] = [];
  const prs: ExercisePRs = { bestWeight: 0, best1RM: 0, bestVolume: 0, bestReps: 0 };

  for (const we of wes) {
    if (we.sets.length === 0 || !we.workout.completedAt) continue;
    let bestWeight = 0;
    let est1RM = 0;
    let volume = 0;
    let totalReps = 0;
    let topSetReps = 0;

    for (const s of we.sets) {
      volume += s.weight * s.reps;
      totalReps += s.reps;
      if (s.weight > bestWeight) {
        bestWeight = s.weight;
        topSetReps = s.reps;
      }
      const e = epley1RM(s.weight, s.reps);
      if (e > est1RM) est1RM = e;
      if (s.reps > prs.bestReps) prs.bestReps = s.reps;
    }

    sessions.push({
      date: we.workout.completedAt.toISOString(),
      bestWeight,
      est1RM: Math.round(est1RM * 10) / 10,
      volume,
      totalReps,
      topSetReps,
    });

    if (bestWeight > prs.bestWeight) prs.bestWeight = bestWeight;
    if (est1RM > prs.best1RM) prs.best1RM = est1RM;
    if (volume > prs.bestVolume) prs.bestVolume = volume;
  }

  prs.best1RM = Math.round(prs.best1RM * 10) / 10;

  return { exerciseId, sessions, prs };
}

export type RepMaxRow = {
  reps: number;
  estimated: number;
  actual: number | null;
};

export type ExerciseRecords = {
  best1RM: number;
  rows: RepMaxRow[];
};

/** Estimated + actual rep-max records for an exercise (reps 1..maxReps). */
export async function getExerciseRecords(
  exerciseId: string,
  maxReps = 20,
): Promise<ExerciseRecords> {
  const sets = await prisma.workoutSet.findMany({
    where: {
      workoutExercise: { exerciseId, workout: { completedAt: { not: null } } },
    },
    select: { weight: true, reps: true },
  });

  let best1RM = 0;
  const bestByReps = new Map<number, number>();
  for (const s of sets) {
    if (s.weight <= 0 || s.reps <= 0) continue;
    const e = epley1RM(s.weight, s.reps);
    if (e > best1RM) best1RM = e;
    const prev = bestByReps.get(s.reps) ?? 0;
    if (s.weight > prev) bestByReps.set(s.reps, s.weight);
  }

  const rows: RepMaxRow[] = Array.from({ length: maxReps }, (_, i) => {
    const reps = i + 1;
    return {
      reps,
      estimated: Math.round(weightForRM(best1RM, reps) * 10) / 10,
      actual: bestByReps.get(reps) ?? null,
    };
  });

  return { best1RM: Math.round(best1RM * 10) / 10, rows };
}

