import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createCategory, getCategories } from "@/lib/data/store";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  const categories = await getCategories();
  return NextResponse.json({ categories });
}

export async function POST(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  try {
    const body = await request.json();
    const category = await createCategory({
      name: String(body.name ?? ""),
      description: body.description ? String(body.description) : undefined,
    });
    return NextResponse.json({ category });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Category creation failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
