import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { deleteQuiz } from "@/lib/data/store";

export const runtime = "nodejs";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { quizId: string } },
) {
  const { response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  try {
    await deleteQuiz(params.quizId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Quiz deletion failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
