import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { db, schema } from "@/lib/db";

export const runtime = "nodejs";

function savePhoto(dataUrl: string): string {
  const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("Invalid image data URL");
  const ext = match[1].includes("png")
    ? "png"
    : match[1].includes("webp")
      ? "webp"
      : "jpg";
  const buf = Buffer.from(match[2], "base64");
  const dir = path.join(process.cwd(), "data", "uploads", "physique");
  fs.mkdirSync(dir, { recursive: true });
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  fs.writeFileSync(path.join(dir, filename), buf);
  return `/api/uploads/physique/${filename}`;
}

export async function GET() {
  const photos = await db
    .select()
    .from(schema.physiquePhotos)
    .orderBy(desc(schema.physiquePhotos.date));
  return NextResponse.json({ photos });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.imageDataUrl || typeof body.imageDataUrl !== "string") {
      return NextResponse.json(
        { error: "imageDataUrl required" },
        { status: 400 },
      );
    }
    const photoPath = savePhoto(body.imageDataUrl);
    const row = {
      id: randomUUID(),
      date: String(body.date || new Date().toISOString().slice(0, 10)),
      weightKg: body.weightKg != null ? Number(body.weightKg) : null,
      bodyFatPct: body.bodyFatPct != null ? Number(body.bodyFatPct) : null,
      photoPath,
      notes: body.notes ? String(body.notes) : null,
    };
    await db.insert(schema.physiquePhotos).values(row);
    return NextResponse.json({ photo: row });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
