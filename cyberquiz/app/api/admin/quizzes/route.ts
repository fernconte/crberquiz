import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createQuizAsAdmin, getQuizzes } from "@/lib/data/store";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  const quizzes = await getQuizzes();
  const summary = quizzes.map((quiz) => ({
    id: quiz.id,
    title: quiz.title,
    categoryId: quiz.categoryId,
    createdAt: quiz.createdAt,
    questionsCount: quiz.questions.length,
  }));

  return NextResponse.json({ quizzes: summary });
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  try {
    const body = await request.json();
    const quiz = await createQuizAsAdmin({
      title: String(body.title ?? ""),
      description: String(body.description ?? ""),
      categoryId: String(body.categoryId ?? ""),
      questions: Array.isArray(body.questions) ? body.questions : [],
      adminId: user.id,
    });

    return NextResponse.json({ quiz: { id: quiz.id } });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Quiz creation failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
