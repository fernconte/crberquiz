import { NextResponse, type NextRequest } from "next/server";
import { getSessionToken } from "@/lib/auth/session";
import {
  approvePendingQuiz,
  getUserBySession,
  rejectPendingQuiz,
  updatePendingQuiz,
  type Question,
} from "@/lib/data/store";
import crypto from "crypto";

export const runtime = "nodejs";

type IncomingQuestion = {
  id?: string;
  prompt?: string;
  options?: Array<{ id?: string; label?: string; isCorrect?: boolean }>;
};

function normalizeQuestions(questions: IncomingQuestion[]): Question[] {
  return questions.map((question) => ({
    id: question.id ?? `q-${crypto.randomUUID()}`,
    prompt: String(question.prompt ?? ""),
    options: Array.isArray(question.options)
      ? question.options.map((option) => ({
          id: option.id ?? `opt-${crypto.randomUUID()}`,
          label: String(option.label ?? ""),
          isCorrect: Boolean(option.isCorrect),
        }))
      : [],
  }));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { quizId: string } },
) {
  const token = getSessionToken(request);
  const user = await getUserBySession(token);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const questions = Array.isArray(body.questions)
      ? normalizeQuestions(body.questions)
      : [];

    await updatePendingQuiz({
      quizId: params.quizId,
      title: String(body.title ?? ""),
      description: String(body.description ?? ""),
      categoryId: String(body.categoryId ?? ""),
      questions,
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
  const token = getSessionToken(request);
  const user = await getUserBySession(token);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
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
