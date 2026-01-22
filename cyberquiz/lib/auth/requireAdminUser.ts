import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserBySession } from "@/lib/data/store";
import { SESSION_COOKIE } from "@/lib/auth/session";

export async function requireAdminUser() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const user = await getUserBySession(token);
  if (!user || user.role !== "admin") {
    redirect("/sign-in");
  }
  return user;
}
