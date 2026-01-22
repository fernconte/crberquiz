import { notFound } from "next/navigation";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { getCategoryById, getQuizById } from "@/lib/data/store";

export const dynamic = "force-dynamic";

type QuizPageProps = {
  params: { quizId: string };
};

export default async function QuizPage({ params }: QuizPageProps) {
  if (!params.quizId) {
    notFound();
  }

  const quiz = await getQuizById(params.quizId);
  if (!quiz) {
    notFound();
  }

  const category = await getCategoryById(quiz.categoryId);

  return (
    <main className="min-h-screen px-6 py-12 md:px-12">
      <div className="mx-auto max-w-4xl">
        <GlassPanel className="p-8">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.3em] text-cyber-cyan">
              {category?.name ?? "General"}
            </p>
            <h1 className="text-2xl font-semibold">{quiz.title}</h1>
            <p className="text-white/70">{quiz.description}</p>
          </div>

          <div className="mt-8 space-y-6">
            {quiz.questions.map((question, index) => (
              <div
                key={question.id}
                className="rounded-2xl border border-white/10 bg-cyber-surface/60 p-5"
              >
                <p className="text-sm text-cyber-cyan">
                  Question {index + 1}
                </p>
                <p className="mt-2 text-base text-white">{question.prompt}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {question.options.map((option) => (
                    <div
                      key={option.id}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80"
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </main>
  );
}
