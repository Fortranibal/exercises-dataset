import { NextResponse } from "next/server";
import { queryExercises } from "@/server/exercises";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "0") || 0;

  const result = await queryExercises(
    {
      q: searchParams.get("q") ?? undefined,
      bodyPart: searchParams.get("bodyPart") ?? undefined,
      equipment: searchParams.get("equipment") ?? undefined,
      target: searchParams.get("target") ?? undefined,
      customOnly: searchParams.get("customOnly") === "1",
    },
    page,
  );

  return NextResponse.json(result);
}
