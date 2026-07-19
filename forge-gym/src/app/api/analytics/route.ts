import { NextResponse } from "next/server";
import { getAnalytics } from "@/server/analytics";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const from = fromParam ? new Date(fromParam) : null;
  const to = toParam ? new Date(toParam) : null;

  const data = await getAnalytics(
    from && !Number.isNaN(from.getTime()) ? from : null,
    to && !Number.isNaN(to.getTime()) ? to : null,
  );
  return NextResponse.json(data);
}
