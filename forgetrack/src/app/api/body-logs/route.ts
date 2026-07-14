import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, schema } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const logs = await db
    .select()
    .from(schema.bodyLogs)
    .orderBy(desc(schema.bodyLogs.date));
  return NextResponse.json({ logs });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = randomUUID();
  const row = {
    id,
    date: String(body.date || new Date().toISOString().slice(0, 10)),
    weightKg: Number(body.weightKg),
    bodyFatPct: body.bodyFatPct != null ? Number(body.bodyFatPct) : null,
    neckCm: body.neckCm != null ? Number(body.neckCm) : null,
    abdomenCm: body.abdomenCm != null ? Number(body.abdomenCm) : null,
    shouldersCm: body.shouldersCm != null ? Number(body.shouldersCm) : null,
    chestCm: body.chestCm != null ? Number(body.chestCm) : null,
    upperArmCm: body.upperArmCm != null ? Number(body.upperArmCm) : null,
    foreArmCm: body.foreArmCm != null ? Number(body.foreArmCm) : null,
    thighCm: body.thighCm != null ? Number(body.thighCm) : null,
    calfCm: body.calfCm != null ? Number(body.calfCm) : null,
    glutesCm: body.glutesCm != null ? Number(body.glutesCm) : null,
    notes: body.notes ? String(body.notes) : null,
  };
  if (!Number.isFinite(row.weightKg)) {
    return NextResponse.json({ error: "weightKg required" }, { status: 400 });
  }
  await db.insert(schema.bodyLogs).values(row);
  return NextResponse.json({ log: row });
}
