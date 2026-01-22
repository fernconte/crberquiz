import { NextResponse, type NextRequest } from "next/server";
import { getSessionToken } from "@/lib/auth/session";
import { getUserBySession } from "@/lib/data/store";

export async function requireAdmin(request: NextRequest) {
  const token = getSessionToken(request);
  const user = await getUserBySession(token);
  if (!user || user.role !== "admin") {
    return {
      user: null,
      response: NextResponse.json({ error: "Forbidden." }, { status: 403 }),
    };
  }

  return { user, response: null };
}
