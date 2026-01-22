import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { getCategories, getQuizzes } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export default async function QuizzesPage() {
  const categories = await getCategories();
  const quizzes = await getQuizzes();
  const categoryMap = new Map(
    categories.map((category) => [category.id, category.name]),
  );

  return (
    <main className="min-h-screen px-6 py-12 md:px-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Quiz library</h1>
            <p className="mt-2 text-white/70">
              Approved community quizzes will appear here.
            </p>
          </div>
          <Link
            href="/quizzes/new"
            className="rounded-full border border-cyber-neon/50 bg-cyber-neon/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyber-neon shadow-neon transition hover:bg-cyber-neon/20"
          >
            Submit a quiz
          </Link>
        </div>

        <section className="grid gap-6 md:grid-cols-2">
          {quizzes.map((quiz) => (
            <GlassPanel key={quiz.id} className="flex flex-col gap-4 p-6">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {quiz.title}
                </h2>
                <p className="mt-2 text-sm text-white/70">
                  {categoryMap.get(quiz.categoryId) ?? "General"} ·{" "}
                  {quiz.questions.length} questions
                </p>
                <p className="mt-3 text-sm text-white/60">{quiz.description}</p>
              </div>
              <Link
                href={`/quizzes/${quiz.id}`}
                className="mt-auto inline-flex w-fit items-center gap-2 rounded-full border border-cyber-cyan/40 px-4 py-2 text-sm text-cyber-cyan transition hover:border-cyber-neon/60 hover:text-cyber-neon"
              >
                Launch quiz
              </Link>
            </GlassPanel>
          ))}
        </section>
      </div>
    </main>
  );
}
