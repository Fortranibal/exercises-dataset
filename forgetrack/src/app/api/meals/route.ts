import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { db, schema } from "@/lib/db";

export const runtime = "nodejs";

function savePhoto(dataUrl: string | undefined | null): string | null {
  if (!dataUrl || !dataUrl.startsWith("data:image/")) return null;
  const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const ext = match[1].includes("png")
    ? "png"
    : match[1].includes("webp")
      ? "webp"
      : "jpg";
  const buf = Buffer.from(match[2], "base64");
  const dir = path.join(process.cwd(), "data", "uploads", "meals");
  fs.mkdirSync(dir, { recursive: true });
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  fs.writeFileSync(path.join(dir, filename), buf);
  return `/api/uploads/meals/${filename}`;
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  if (date) {
    const rows = await db
      .select()
      .from(schema.meals)
      .where(eq(schema.meals.date, date))
      .orderBy(desc(schema.meals.createdAt));
    return NextResponse.json({ meals: rows });
  }
  const rows = await db
    .select()
    .from(schema.meals)
    .orderBy(desc(schema.meals.date), desc(schema.meals.createdAt))
    .limit(500);
  return NextResponse.json({ meals: rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = randomUUID();
  const photoPath = savePhoto(body.imageDataUrl) ?? body.photoPath ?? null;

  const mealType =
    body.mealType === "breakfast" ||
    body.mealType === "lunch" ||
    body.mealType === "dinner" ||
    body.mealType === "snack"
      ? body.mealType
      : "snack";

  const now = new Date();
  const date =
    typeof body.date === "string" && body.date
      ? body.date
      : now.toISOString().slice(0, 10);
  const time =
    typeof body.time === "string" && body.time
      ? body.time
      : now.toTimeString().slice(0, 5);

  const row = {
    id,
    date,
    time,
    mealType,
    name: String(body.name || "Meal"),
    description: body.description ? String(body.description) : null,
    quantity: body.quantity ? String(body.quantity) : null,
    calories: Number(body.calories) || 0,
    proteinG: Number(body.proteinG) || 0,
    carbsG: Number(body.carbsG) || 0,
    fatG: Number(body.fatG) || 0,
    photoPath,
    aiRaw: body.aiRaw ? JSON.stringify(body.aiRaw) : null,
  };

  await db.insert(schema.meals).values(row);
  return NextResponse.json({ meal: row });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  await db.delete(schema.meals).where(eq(schema.meals.id, id));
  return NextResponse.json({ ok: true });
}
