"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/action";

function revalidateRoutine(id?: string) {
  revalidatePath("/routines");
  if (id) revalidatePath(`/routines/${id}`);
}

export async function createRoutine(name?: string): Promise<ActionResult<{ id: string }>> {
  const count = await prisma.routine.count();
  const routine = await prisma.routine.create({
    data: { name: name?.trim() || "New Routine", sortOrder: count },
  });
  revalidateRoutine(routine.id);
  return { ok: true, data: { id: routine.id } };
}

export async function updateRoutine(
  id: string,
  fields: { name?: string; notes?: string; emoji?: string | null; color?: string | null },
): Promise<ActionResult> {
  const data: { name?: string; notes?: string; emoji?: string | null; color?: string | null } = {};
  if (fields.name !== undefined) {
    if (!fields.name.trim()) return { ok: false, error: "Name cannot be empty" };
    data.name = fields.name.trim();
  }
  if (fields.notes !== undefined) data.notes = fields.notes;
  if (fields.emoji !== undefined) data.emoji = fields.emoji;
  if (fields.color !== undefined) data.color = fields.color;

  await prisma.routine.update({ where: { id }, data });
  revalidateRoutine(id);
  return { ok: true };
}

export async function deleteRoutine(id: string): Promise<ActionResult> {
  await prisma.routine.delete({ where: { id } });
  revalidateRoutine();
  return { ok: true };
}

export async function duplicateRoutine(id: string): Promise<ActionResult<{ id: string }>> {
  const original = await prisma.routine.findUnique({
    where: { id },
    include: { exercises: { orderBy: { sortOrder: "asc" } } },
  });
  if (!original) return { ok: false, error: "Routine not found" };

  const count = await prisma.routine.count();
  const copy = await prisma.routine.create({
    data: {
      name: `${original.name} (copy)`,
      notes: original.notes,
      emoji: original.emoji,
      color: original.color,
      sortOrder: count,
      exercises: {
        create: original.exercises.map((e) => ({
          exerciseId: e.exerciseId,
          sortOrder: e.sortOrder,
          defaultSets: e.defaultSets,
          defaultReps: e.defaultReps,
          defaultWeight: e.defaultWeight,
          notes: e.notes,
        })),
      },
    },
  });
  revalidateRoutine(copy.id);
  return { ok: true, data: { id: copy.id } };
}

export async function addExerciseToRoutine(
  routineId: string,
  exerciseId: string,
): Promise<ActionResult> {
  const last = await prisma.routineExercise.findFirst({
    where: { routineId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  await prisma.routineExercise.create({
    data: {
      routineId,
      exerciseId,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });
  await prisma.routine.update({ where: { id: routineId }, data: { updatedAt: new Date() } });
  revalidateRoutine(routineId);
  return { ok: true };
}

export async function removeRoutineExercise(routineExerciseId: string): Promise<ActionResult> {
  const re = await prisma.routineExercise.findUnique({
    where: { id: routineExerciseId },
    select: { routineId: true },
  });
  if (!re) return { ok: false, error: "Not found" };
  await prisma.routineExercise.delete({ where: { id: routineExerciseId } });
  revalidateRoutine(re.routineId);
  return { ok: true };
}

export async function updateRoutineExercise(
  routineExerciseId: string,
  fields: { defaultSets?: number; defaultReps?: number; defaultWeight?: number; notes?: string },
): Promise<ActionResult> {
  const data: {
    defaultSets?: number;
    defaultReps?: number;
    defaultWeight?: number;
    notes?: string;
  } = {};
  if (fields.defaultSets !== undefined) data.defaultSets = Math.max(0, Math.round(fields.defaultSets));
  if (fields.defaultReps !== undefined) data.defaultReps = Math.max(0, Math.round(fields.defaultReps));
  if (fields.defaultWeight !== undefined) data.defaultWeight = Math.max(0, fields.defaultWeight);
  if (fields.notes !== undefined) data.notes = fields.notes;

  const re = await prisma.routineExercise.update({
    where: { id: routineExerciseId },
    data,
    select: { routineId: true },
  });
  revalidateRoutine(re.routineId);
  return { ok: true };
}

export async function moveRoutineExercise(
  routineExerciseId: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  const current = await prisma.routineExercise.findUnique({
    where: { id: routineExerciseId },
  });
  if (!current) return { ok: false, error: "Not found" };

  const neighbor = await prisma.routineExercise.findFirst({
    where: {
      routineId: current.routineId,
      sortOrder: direction === "up" ? { lt: current.sortOrder } : { gt: current.sortOrder },
    },
    orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbor) return { ok: true }; // already at the edge

  await prisma.$transaction([
    prisma.routineExercise.update({
      where: { id: current.id },
      data: { sortOrder: neighbor.sortOrder },
    }),
    prisma.routineExercise.update({
      where: { id: neighbor.id },
      data: { sortOrder: current.sortOrder },
    }),
  ]);
  revalidateRoutine(current.routineId);
  return { ok: true };
}
