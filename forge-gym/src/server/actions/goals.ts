"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/action";
import type { GoalType } from "@/server/goals";

const VALID_TYPES: GoalType[] = ["workouts_per_week", "volume_per_week", "sets_per_week"];

export async function createGoal(input: {
  type: GoalType;
  target: number;
  muscleGroup?: string | null;
}): Promise<ActionResult> {
  if (!VALID_TYPES.includes(input.type)) return { ok: false, error: "Invalid goal type" };
  if (!Number.isFinite(input.target) || input.target <= 0) {
    return { ok: false, error: "Target must be greater than zero" };
  }

  await prisma.goal.create({
    data: {
      type: input.type,
      target: Math.round(input.target),
      period: "week",
      muscleGroup: input.type === "sets_per_week" ? (input.muscleGroup ?? null) : null,
      active: true,
    },
  });
  revalidatePath("/goals");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteGoal(id: string): Promise<ActionResult> {
  await prisma.goal.delete({ where: { id } });
  revalidatePath("/goals");
  revalidatePath("/");
  return { ok: true };
}
