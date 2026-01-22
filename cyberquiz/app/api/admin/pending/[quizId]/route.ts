import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import {
  approvePendingQuiz,
  rejectPendingQuiz,
  updatePendingQuiz,
} from "@/lib/data/store";
export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { quizId: string } },
) {
  const { response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  try {
    const body = await request.json();

    await updatePendingQuiz({
      quizId: params.quizId,
      title: String(body.title ?? ""),
      description: String(body.description ?? ""),
      categoryId: String(body.categoryId ?? ""),
      questions: Array.isArray(body.questions) ? body.questions : [],
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Update failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { quizId: string } },
) {
  const { user, response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  try {
    const body = await request.json();
    const action = String(body.action ?? "");

    if (action === "approve") {
      await approvePendingQuiz({ quizId: params.quizId, adminId: user.id });
      return NextResponse.json({ ok: true });
    }

    if (action === "reject") {
      const reason = String(body.rejectionReason ?? "").trim();
      if (!reason) {
        return NextResponse.json(
          { error: "Rejection reason required." },
          { status: 400 },
        );
      }
      await rejectPendingQuiz({
        quizId: params.quizId,
        adminId: user.id,
        rejectionReason: reason,
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Action failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
