"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/action";

const createSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  bodyPart: z.string().min(1).max(60),
  equipment: z.string().min(1).max(60),
  target: z.string().min(1).max(60),
  secondaryMuscles: z.array(z.string()).default([]),
  instructionsEn: z.string().max(4000).optional().default(""),
});

export type CreateExerciseInput = z.input<typeof createSchema>;

export async function createCustomExercise(
  input: CreateExerciseInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;
  const id = `cstm_${randomUUID().slice(0, 12)}`;

  await prisma.exercise.create({
    data: {
      id,
      name: v.name.trim().toLowerCase(),
      category: v.bodyPart.toLowerCase(),
      bodyPart: v.bodyPart.toLowerCase(),
      equipment: v.equipment.toLowerCase(),
      target: v.target.toLowerCase(),
      muscleGroup: v.target.toLowerCase(),
      secondaryMuscles: JSON.stringify(v.secondaryMuscles.map((s) => s.toLowerCase())),
      instructions: JSON.stringify(v.instructionsEn ? { en: v.instructionsEn } : {}),
      instructionSteps: JSON.stringify({}),
      image: null,
      gifUrl: null,
      isCustom: true,
    },
  });

  revalidatePath("/exercises");
  return { ok: true, data: { id } };
}

export async function deleteCustomExercise(id: string): Promise<ActionResult> {
  const ex = await prisma.exercise.findUnique({ where: { id }, select: { isCustom: true } });
  if (!ex) return { ok: false, error: "Exercise not found" };
  if (!ex.isCustom) return { ok: false, error: "Library exercises cannot be deleted" };

  try {
    await prisma.exercise.delete({ where: { id } });
  } catch {
    return { ok: false, error: "Exercise is in use and cannot be deleted" };
  }
  revalidatePath("/exercises");
  return { ok: true };
}
