import { NextResponse, type NextRequest } from "next/server";
import { getSessionToken, clearSessionCookie } from "@/lib/auth/session";
import { removeSession } from "@/lib/data/store";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const token = getSessionToken(request);
  if (token) {
    await removeSession(token);
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
