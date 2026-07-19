import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [routines, workouts, measurements, measurementGoals, goals, customExercises] =
    await Promise.all([
      prisma.routine.findMany({ include: { exercises: true } }),
      prisma.workout.findMany({
        include: { exercises: { include: { sets: true } } },
        orderBy: { startedAt: "asc" },
      }),
      prisma.bodyMeasurement.findMany({ orderBy: { measuredAt: "asc" } }),
      prisma.measurementGoal.findMany(),
      prisma.goal.findMany(),
      prisma.exercise.findMany({ where: { isCustom: true } }),
    ]);

  const payload = {
    app: "Forge Gym",
    exportedAt: new Date().toISOString(),
    routines,
    workouts,
    measurements,
    measurementGoals,
    goals,
    customExercises,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="forge-export-${new Date()
        .toISOString()
        .slice(0, 10)}.json"`,
    },
  });
}
