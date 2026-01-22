import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/data/store";

export const runtime = "nodejs";

export async function GET() {
  const items = await getLeaderboard();
  return NextResponse.json({ items });
}
