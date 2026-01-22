import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getPendingQuizzes } from "@/lib/data/store";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  const pending = await getPendingQuizzes();
  return NextResponse.json({ pending });
}
