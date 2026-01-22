import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { deleteUser } from "@/lib/data/store";

export const runtime = "nodejs";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  const { user, response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  try {
    await deleteUser({ userId: params.userId, requesterId: user.id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "User deletion failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
