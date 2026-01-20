import { notFound } from "next/navigation";
import { GlassPanel } from "@/components/ui/GlassPanel";

type QuizPageProps = {
  params: { quizId: string };
};

export default function QuizPage({ params }: QuizPageProps) {
  if (!params.quizId) {
    notFound();
  }

  return (
    <main className="min-h-screen px-6 py-12 md:px-12">
      <div className="mx-auto max-w-4xl">
        <GlassPanel className="p-8">
          <h1 className="text-2xl font-semibold">Quiz {params.quizId}</h1>
          <p className="mt-3 text-white/70">
            Quiz flow will render here once wired to Supabase.
          </p>
        </GlassPanel>
      </div>
    </main>
  );
}
