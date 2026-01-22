import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createUserAsAdmin, getUsers } from "@/lib/data/store";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  const users = await getUsers();
  const safeUsers = users.map((user) => ({
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    createdAt: user.createdAt,
  }));
  return NextResponse.json({ users: safeUsers });
}

export async function POST(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  try {
    const body = await request.json();
    const user = await createUserAsAdmin({
      email: String(body.email ?? ""),
      username: String(body.username ?? ""),
      password: String(body.password ?? ""),
      displayName: body.displayName ? String(body.displayName) : undefined,
      role: body.role === "admin" ? "admin" : "user",
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "User creation failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
