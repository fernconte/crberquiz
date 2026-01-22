import { NextResponse } from "next/server";
import { createSession, createUser } from "@/lib/data/store";
import { setSessionCookie } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await createUser({
      email: String(body.email ?? ""),
      username: String(body.username ?? ""),
      password: String(body.password ?? ""),
      displayName: body.displayName ? String(body.displayName) : undefined,
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
    const message = error instanceof Error ? error.message : "Signup failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
