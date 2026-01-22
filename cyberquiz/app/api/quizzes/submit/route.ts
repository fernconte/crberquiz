import { NextResponse, type NextRequest } from "next/server";
import { getSessionToken } from "@/lib/auth/session";
import { getUserBySession, submitQuiz } from "@/lib/data/store";

export const runtime = "nodejs";

type IncomingQuestion = {
  prompt?: string;
  options?: Array<{ label?: string; isCorrect?: boolean }>;
};

export async function POST(request: NextRequest) {
  try {
    const token = getSessionToken(request);
    const user = await getUserBySession(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const questions = Array.isArray(body.questions) ? body.questions : [];

    const normalizedQuestions = questions.map((question: IncomingQuestion) => ({
      prompt: String(question.prompt ?? ""),
      options: Array.isArray(question.options)
        ? question.options.map((option) => ({
            label: String(option.label ?? ""),
            isCorrect: Boolean(option.isCorrect),
          }))
        : [],
    }));

    await submitQuiz({
      title: String(body.title ?? ""),
      description: String(body.description ?? ""),
      categoryId: String(body.categoryId ?? ""),
      questions: normalizedQuestions,
      userId: user.id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Submission failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
