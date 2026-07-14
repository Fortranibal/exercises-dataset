import { NextRequest, NextResponse } from "next/server";
import { analyzeMeal } from "@/lib/ai/analyze-meal";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const description =
      typeof body.description === "string" ? body.description : undefined;
    const imageDataUrl =
      typeof body.imageDataUrl === "string" ? body.imageDataUrl : undefined;
    const mealTypeHint =
      body.mealTypeHint === "breakfast" ||
      body.mealTypeHint === "lunch" ||
      body.mealTypeHint === "dinner" ||
      body.mealTypeHint === "snack"
        ? body.mealTypeHint
        : undefined;

    const analysis = await analyzeMeal({
      description,
      imageDataUrl,
      mealTypeHint,
    });

    return NextResponse.json({ analysis });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    const status = message.includes("XAI_API_KEY") ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
