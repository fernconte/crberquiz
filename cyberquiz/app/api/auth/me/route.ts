import { NextResponse, type NextRequest } from "next/server";
import { getSessionToken } from "@/lib/auth/session";
import { getUserBySession } from "@/lib/data/store";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const token = getSessionToken(request);
  const user = await getUserBySession(token);

  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    },
  });
}
