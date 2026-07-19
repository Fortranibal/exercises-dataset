"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/action";
import {
  getPreviousSets,
  type WorkoutExerciseDTO,
  type WorkoutSetDTO,
  type SetType,
} from "@/server/workouts";

function revalidateAfterFinish() {
  revalidatePath("/");
  revalidatePath("/workout");
  revalidatePath("/history");
  revalidatePath("/analytics");
  revalidatePath("/profile");
}

export async function startWorkout(routineId?: string): Promise<ActionResult<{ id: string }>> {
  const active = await prisma.workout.findFirst({
    where: { completedAt: null },
    select: { id: true },
  });
  if (active) return { ok: true, data: { id: active.id } };

  if (routineId) {
    const routine = await prisma.routine.findUnique({
      where: { id: routineId },
      include: { exercises: { orderBy: { sortOrder: "asc" } } },
    });
    if (!routine) return { ok: false, error: "Routine not found" };

    const workout = await prisma.workout.create({
      data: {
        name: routine.name,
        routineId: routine.id,
        exercises: {
          create: routine.exercises.map((re) => ({
            exerciseId: re.exerciseId,
            sortOrder: re.sortOrder,
            notes: re.notes,
            sets: {
              create: Array.from({ length: Math.max(1, re.defaultSets) }, (_, i) => ({
                setNumber: i + 1,
                reps: re.defaultReps,
                weight: re.defaultWeight,
                isCompleted: false,
                setType: "normal",
              })),
            },
          })),
        },
      },
    });
    revalidatePath("/");
    revalidatePath("/workout");
    return { ok: true, data: { id: workout.id } };
  }

  const workout = await prisma.workout.create({ data: { name: "Quick Workout" } });
  revalidatePath("/");
  revalidatePath("/workout");
  return { ok: true, data: { id: workout.id } };
}

export async function updateWorkoutMeta(
  id: string,
  fields: { name?: string; notes?: string },
): Promise<ActionResult> {
  const data: { name?: string; notes?: string } = {};
  if (fields.name !== undefined && fields.name.trim()) data.name = fields.name.trim();
  if (fields.notes !== undefined) data.notes = fields.notes;
  await prisma.workout.update({ where: { id }, data });
  return { ok: true };
}

export async function finishWorkout(id: string): Promise<ActionResult> {
  const workout = await prisma.workout.findUnique({
    where: { id },
    select: { startedAt: true, completedAt: true },
  });
  if (!workout) return { ok: false, error: "Workout not found" };
  if (workout.completedAt) return { ok: true };

  // Discard uncompleted sets, then drop now-empty exercises.
  await prisma.workoutSet.deleteMany({
    where: { workoutExercise: { workoutId: id }, isCompleted: false },
  });
  const empties = await prisma.workoutExercise.findMany({
    where: { workoutId: id, sets: { none: {} } },
    select: { id: true },
  });
  if (empties.length > 0) {
    await prisma.workoutExercise.deleteMany({
      where: { id: { in: empties.map((e) => e.id) } },
    });
  }

  const now = new Date();
  const durationSec = Math.max(
    0,
    Math.round((now.getTime() - workout.startedAt.getTime()) / 1000),
  );
  await prisma.workout.update({
    where: { id },
    data: { completedAt: now, durationSec },
  });
  revalidateAfterFinish();
  return { ok: true };
}

export async function cancelWorkout(id: string): Promise<ActionResult> {
  await prisma.workout.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/workout");
  return { ok: true };
}

export async function deleteWorkout(id: string): Promise<ActionResult> {
  await prisma.workout.delete({ where: { id } });
  revalidateAfterFinish();
  revalidatePath("/history");
  return { ok: true };
}

export async function addWorkoutExercise(
  workoutId: string,
  exerciseId: string,
): Promise<ActionResult<{ exercise: WorkoutExerciseDTO }>> {
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    select: { id: true, name: true, target: true, bodyPart: true, image: true },
  });
  if (!exercise) return { ok: false, error: "Exercise not found" };

  const last = await prisma.workoutExercise.findFirst({
    where: { workoutId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const previous = await getPreviousSets(exerciseId, workoutId);
  const seed = previous[0];

  const we = await prisma.workoutExercise.create({
    data: {
      workoutId,
      exerciseId,
      sortOrder: (last?.sortOrder ?? -1) + 1,
      sets: {
        create: [
          {
            setNumber: 1,
            reps: seed?.reps ?? 0,
            weight: seed?.weight ?? 0,
            isCompleted: false,
            setType: "normal",
          },
        ],
      },
    },
    include: { sets: true },
  });

  const dto: WorkoutExerciseDTO = {
    workoutExerciseId: we.id,
    exerciseId: exercise.id,
    name: exercise.name,
    target: exercise.target,
    bodyPart: exercise.bodyPart,
    image: exercise.image,
    sortOrder: we.sortOrder,
    notes: we.notes,
    sets: we.sets.map((s) => ({
      id: s.id,
      setNumber: s.setNumber,
      reps: s.reps,
      weight: s.weight,
      setType: "normal",
      isCompleted: s.isCompleted,
    })),
    previous,
  };
  return { ok: true, data: { exercise: dto } };
}

export async function removeWorkoutExercise(
  workoutExerciseId: string,
): Promise<ActionResult> {
  await prisma.workoutExercise.delete({ where: { id: workoutExerciseId } });
  return { ok: true };
}

export async function updateWorkoutExerciseNotes(
  workoutExerciseId: string,
  notes: string,
): Promise<ActionResult> {
  await prisma.workoutExercise.update({
    where: { id: workoutExerciseId },
    data: { notes },
  });
  return { ok: true };
}

export async function addSet(
  workoutExerciseId: string,
): Promise<ActionResult<{ set: WorkoutSetDTO }>> {
  const last = await prisma.workoutSet.findFirst({
    where: { workoutExerciseId },
    orderBy: { setNumber: "desc" },
  });
  const set = await prisma.workoutSet.create({
    data: {
      workoutExerciseId,
      setNumber: (last?.setNumber ?? 0) + 1,
      reps: last?.reps ?? 0,
      weight: last?.weight ?? 0,
      isCompleted: false,
      setType: "normal",
    },
  });
  return {
    ok: true,
    data: {
      set: {
        id: set.id,
        setNumber: set.setNumber,
        reps: set.reps,
        weight: set.weight,
        setType: "normal",
        isCompleted: set.isCompleted,
      },
    },
  };
}

export async function updateSet(
  setId: string,
  fields: { reps?: number; weight?: number; isCompleted?: boolean; setType?: SetType },
): Promise<ActionResult> {
  const data: { reps?: number; weight?: number; isCompleted?: boolean; setType?: string } = {};
  if (fields.reps !== undefined) data.reps = Math.max(0, Math.round(fields.reps));
  if (fields.weight !== undefined) data.weight = Math.max(0, fields.weight);
  if (fields.isCompleted !== undefined) data.isCompleted = fields.isCompleted;
  if (fields.setType !== undefined) data.setType = fields.setType;
  await prisma.workoutSet.update({ where: { id: setId }, data });
  return { ok: true };
}

export async function deleteSet(setId: string): Promise<ActionResult> {
  await prisma.workoutSet.delete({ where: { id: setId } });
  return { ok: true };
}
