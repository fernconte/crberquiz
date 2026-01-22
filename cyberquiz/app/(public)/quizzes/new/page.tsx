import { GlassPanel } from "@/components/ui/GlassPanel";
import { QuizSubmissionForm } from "@/components/quiz/QuizSubmissionForm";
import { getCategories } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export default async function NewQuizPage() {
  const categories = await getCategories();

  return (
    <main className="min-h-screen px-6 py-12 md:px-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="text-3xl font-semibold">Submit a quiz</h1>
          <p className="mt-2 text-white/70">
            Share your questions with the community. Admins will review before
            publishing.
          </p>
          <p className="mt-2 text-sm text-white/60">
            Select one correct answer for each question.
          </p>
        </div>

        <GlassPanel className="p-8">
          <QuizSubmissionForm categories={categories} />
        </GlassPanel>
      </div>
    </main>
  );
}
