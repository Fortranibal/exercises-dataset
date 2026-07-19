import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { computeMmp } from "@/lib/mmp/calculate";
import type { ActivityLevel, CycleStrategy, Gender, PhaseCycle } from "@/lib/mmp/coefficients";

export const runtime = "nodejs";

function asGender(v: unknown): Gender {
  return v === "F" ? "F" : "M";
}

function asActivity(v: unknown): ActivityLevel {
  if (
    v === "sedentary" ||
    v === "light" ||
    v === "moderate" ||
    v === "active" ||
    v === "athlete"
  ) {
    return v;
  }
  return "moderate";
}

function asPhase(v: unknown): PhaseCycle {
  if (v === "cut" || v === "maintenance" || v === "bulk") return v;
  return "maintenance";
}

function asStrategy(v: unknown): CycleStrategy {
  return v === "aggressive" ? "aggressive" : "conservative";
}

export async function GET() {
  const rows = db.select().from(schema.profiles).limit(1).all();
  const profile = rows[0];
  if (!profile) {
    return NextResponse.json({ error: "No profile" }, { status: 404 });
  }

  const latestBody = db
    .select()
    .from(schema.bodyLogs)
    .orderBy(asc(schema.bodyLogs.date))
    .all();
  const last = latestBody[latestBody.length - 1];

  const mmp = computeMmp(
    {
      heightCm: profile.heightCm,
      weightKg: last?.weightKg ?? profile.weightKg,
      wristCm: profile.wristCm,
      ankleCm: profile.ankleCm,
      kneeCm: profile.kneeCm,
      bodyFatPct: last?.bodyFatPct ?? profile.bodyFatPct,
      gender: asGender(profile.gender),
      activity: asActivity(profile.activity),
      phase: asPhase(profile.phase),
      strategy: asStrategy(profile.strategy),
    },
    {
      neck: last?.neckCm,
      abdomen: last?.abdomenCm,
      shoulders: last?.shouldersCm,
      chest: last?.chestCm,
      upperArm: last?.upperArmCm,
      foreArm: last?.foreArmCm,
      thigh: last?.thighCm,
      calf: last?.calfCm,
      glutes: last?.glutesCm,
    },
  );

  return NextResponse.json({ profile, mmp });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const rows = db.select().from(schema.profiles).limit(1).all();
  const existing = rows[0];
  if (!existing) {
    return NextResponse.json({ error: "No profile" }, { status: 404 });
  }

  const patch = {
    heightCm: body.heightCm != null ? Number(body.heightCm) : existing.heightCm,
    weightKg: body.weightKg != null ? Number(body.weightKg) : existing.weightKg,
    age: body.age != null ? Number(body.age) : existing.age,
    gender: asGender(body.gender ?? existing.gender),
    activity: asActivity(body.activity ?? existing.activity),
    wristCm: body.wristCm != null ? Number(body.wristCm) : existing.wristCm,
    ankleCm: body.ankleCm != null ? Number(body.ankleCm) : existing.ankleCm,
    kneeCm: body.kneeCm != null ? Number(body.kneeCm) : existing.kneeCm,
    bodyFatPct:
      body.bodyFatPct != null ? Number(body.bodyFatPct) : existing.bodyFatPct,
    phase: asPhase(body.phase ?? existing.phase),
    strategy: asStrategy(body.strategy ?? existing.strategy),
    calorieTarget:
      body.calorieTarget != null
        ? Number(body.calorieTarget)
        : existing.calorieTarget,
    proteinTarget:
      body.proteinTarget != null
        ? Number(body.proteinTarget)
        : existing.proteinTarget,
    maintenanceKcal:
      body.maintenanceKcal != null
        ? Number(body.maintenanceKcal)
        : existing.maintenanceKcal,
    updatedAt: new Date().toISOString(),
  };

  db.update(schema.profiles)
    .set(patch)
    .where(eq(schema.profiles.id, existing.id))
    .run();

  return NextResponse.json({ profile: { ...existing, ...patch } });
}
