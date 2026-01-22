import { NextResponse, type NextRequest } from "next/server";
import { getSessionToken } from "@/lib/auth/session";
import { getPendingQuizzes, getUserBySession } from "@/lib/data/store";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const token = getSessionToken(request);
  const user = await getUserBySession(token);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const pending = await getPendingQuizzes();
  return NextResponse.json({ pending });
}
