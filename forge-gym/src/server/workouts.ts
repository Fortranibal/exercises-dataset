import { prisma } from "@/lib/prisma";

export type SetType = "normal" | "warmup" | "drop" | "failure";

export type WorkoutSetDTO = {
  id: string;
  setNumber: number;
  reps: number;
  weight: number;
  setType: SetType;
  isCompleted: boolean;
};

export type PreviousSet = { reps: number; weight: number };

export type WorkoutExerciseDTO = {
  workoutExerciseId: string;
  exerciseId: string;
  name: string;
  target: string;
  bodyPart: string;
  image: string | null;
  sortOrder: number;
  notes: string | null;
  sets: WorkoutSetDTO[];
  previous: PreviousSet[];
};

export type WorkoutDetail = {
  id: string;
  name: string;
  notes: string | null;
  routineId: string | null;
  startedAt: string;
  completedAt: string | null;
  durationSec: number;
  exercises: WorkoutExerciseDTO[];
};

function asSetType(v: string): SetType {
  return v === "warmup" || v === "drop" || v === "failure" ? v : "normal";
}

export async function getPreviousSets(
  exerciseId: string,
  excludeWorkoutId?: string,
): Promise<PreviousSet[]> {
  const we = await prisma.workoutExercise.findFirst({
    where: {
      exerciseId,
      workout: {
        completedAt: { not: null },
        ...(excludeWorkoutId ? { id: { not: excludeWorkoutId } } : {}),
      },
    },
    orderBy: { workout: { completedAt: "desc" } },
    include: {
      sets: { where: { isCompleted: true }, orderBy: { setNumber: "asc" } },
    },
  });
  if (!we) return [];
  return we.sets.map((s) => ({ reps: s.reps, weight: s.weight }));
}

export async function getActiveWorkout(): Promise<{ id: string } | null> {
  const w = await prisma.workout.findFirst({
    where: { completedAt: null },
    orderBy: { startedAt: "desc" },
    select: { id: true },
  });
  return w;
}

export async function getWorkout(id: string): Promise<WorkoutDetail | null> {
  const w = await prisma.workout.findUnique({
    where: { id },
    include: {
      exercises: {
        orderBy: { sortOrder: "asc" },
        include: {
          exercise: {
            select: { id: true, name: true, target: true, bodyPart: true, image: true },
          },
          sets: { orderBy: { setNumber: "asc" } },
        },
      },
    },
  });
  if (!w) return null;

  const previousByExercise = await Promise.all(
    w.exercises.map((we) => getPreviousSets(we.exerciseId, w.id)),
  );

  return {
    id: w.id,
    name: w.name,
    notes: w.notes,
    routineId: w.routineId,
    startedAt: w.startedAt.toISOString(),
    completedAt: w.completedAt ? w.completedAt.toISOString() : null,
    durationSec: w.durationSec,
    exercises: w.exercises.map((we, i) => ({
      workoutExerciseId: we.id,
      exerciseId: we.exerciseId,
      name: we.exercise.name,
      target: we.exercise.target,
      bodyPart: we.exercise.bodyPart,
      image: we.exercise.image,
      sortOrder: we.sortOrder,
      notes: we.notes,
      sets: we.sets.map((s) => ({
        id: s.id,
        setNumber: s.setNumber,
        reps: s.reps,
        weight: s.weight,
        setType: asSetType(s.setType),
        isCompleted: s.isCompleted,
      })),
      previous: previousByExercise[i],
    })),
  };
}
