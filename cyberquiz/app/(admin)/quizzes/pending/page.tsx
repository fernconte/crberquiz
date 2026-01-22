import { GlassPanel } from "@/components/ui/GlassPanel";
import { PendingReview } from "@/components/admin/PendingReview";
import { getCategories } from "@/lib/data/store";
import { requireAdminUser } from "@/lib/auth/requireAdminUser";

export const dynamic = "force-dynamic";

export default async function PendingQuizzesPage() {
  await requireAdminUser();
  const categories = await getCategories();

  return (
    <main className="min-h-screen px-6 py-12 md:px-12">
      <div className="mx-auto max-w-5xl">
        <GlassPanel className="p-8">
          <h1 className="text-2xl font-semibold">Pending quizzes</h1>
          <p className="mt-3 text-white/70">
            Review community submissions before they go live.
          </p>
          <div className="mt-8">
            <PendingReview categories={categories} />
          </div>
        </GlassPanel>
      </div>
    </main>
  );
}
