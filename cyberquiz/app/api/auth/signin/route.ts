import { NextResponse } from "next/server";
import { createSession, verifyUser } from "@/lib/data/store";
import { setSessionCookie } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await verifyUser({
      identifier: String(body.identifier ?? ""),
      password: String(body.password ?? ""),
    });

    const session = await createSession(user.id);
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    });
    setSessionCookie(response, session.token, 60 * 60 * 24 * 7);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signin failed.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
