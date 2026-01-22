import { NextResponse, type NextRequest } from "next/server";
import { getSessionToken } from "@/lib/auth/session";
import { getUserBySession, getUserSubmissions } from "@/lib/data/store";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const token = getSessionToken(request);
  const user = await getUserBySession(token);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const submissions = await getUserSubmissions(user.id);
  const view = submissions.map((submission) => ({
    id: submission.id,
    title: submission.title,
    status: submission.status,
    rejectionReason: submission.rejectionReason,
    submittedAt: submission.submittedAt,
  }));
  return NextResponse.json({ submissions: view });
}
