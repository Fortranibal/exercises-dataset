import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, schema } from "@/lib/db";

export const runtime = "nodejs";

/** Epley estimated 1RM */
function estimate1rm(weightKg: number, reps: number): number {
  if (reps <= 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

export async function GET() {
  const logs = await db
    .select()
    .from(schema.strengthLogs)
    .orderBy(desc(schema.strengthLogs.date));
  return NextResponse.json({ logs });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const reps = Number(body.reps);
  const weightKg = Number(body.weightKg);
  if (!body.exercise || !Number.isFinite(reps) || !Number.isFinite(weightKg)) {
    return NextResponse.json(
      { error: "exercise, reps, and weightKg required" },
      { status: 400 },
    );
  }
  const row = {
    id: randomUUID(),
    date: String(body.date || new Date().toISOString().slice(0, 10)),
    exercise: String(body.exercise),
    reps,
    weightKg,
    estimated1rm: estimate1rm(weightKg, reps),
    notes: body.notes ? String(body.notes) : null,
  };
  await db.insert(schema.strengthLogs).values(row);
  return NextResponse.json({ log: row });
}
