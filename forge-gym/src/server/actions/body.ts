"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/action";
import {
  BODY_METRICS,
  isBodyMetricKey,
  type BodyMetricKey,
  type GoalDirection,
} from "@/lib/body-metrics";

function revalidateBody(metricKey?: string) {
  revalidatePath("/body");
  revalidatePath("/profile");
  revalidatePath("/");
  if (metricKey) revalidatePath(`/body/${metricKey}`);
}

export async function addMeasurement(input: {
  measuredAt?: string;
  values: Partial<Record<BodyMetricKey, number>>;
  notes?: string;
}): Promise<ActionResult> {
  const fields: Partial<Record<BodyMetricKey, number>> = {};
  for (const m of BODY_METRICS) {
    const v = input.values?.[m.key];
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) {
      fields[m.key] = v;
    }
  }
  if (Object.keys(fields).length === 0) {
    return { ok: false, error: "Enter at least one measurement value" };
  }

  const measuredAt = input.measuredAt ? new Date(input.measuredAt) : new Date();
  if (Number.isNaN(measuredAt.getTime())) {
    return { ok: false, error: "Invalid date" };
  }

  await prisma.bodyMeasurement.create({
    data: { measuredAt, notes: input.notes, ...fields },
  });
  revalidateBody();
  return { ok: true };
}

export async function clearMetricPoint(
  entryId: string,
  metricKey: string,
): Promise<ActionResult> {
  if (!isBodyMetricKey(metricKey)) return { ok: false, error: "Unknown metric" };

  const data = { [metricKey]: null } as Prisma.BodyMeasurementUpdateInput;
  const updated = await prisma.bodyMeasurement.update({ where: { id: entryId }, data });

  const stillHasValue = BODY_METRICS.some((m) => updated[m.key] != null);
  if (!stillHasValue) {
    await prisma.bodyMeasurement.delete({ where: { id: entryId } });
  }
  revalidateBody(metricKey);
  return { ok: true };
}

export async function setMeasurementGoal(
  metricKey: string,
  target: number | null,
  direction: GoalDirection,
): Promise<ActionResult> {
  if (!isBodyMetricKey(metricKey)) return { ok: false, error: "Unknown metric" };
  if (!["increase", "decrease", "maintain"].includes(direction)) {
    return { ok: false, error: "Invalid goal direction" };
  }
  const cleanTarget =
    target != null && Number.isFinite(target) && target >= 0 ? target : null;

  await prisma.measurementGoal.upsert({
    where: { metricKey },
    create: { metricKey, target: cleanTarget, direction },
    update: { target: cleanTarget, direction },
  });
  revalidateBody(metricKey);
  return { ok: true };
}
