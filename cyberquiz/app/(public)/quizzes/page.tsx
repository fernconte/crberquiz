import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";

const sampleQuizzes = [
  {
    id: "web-001",
    title: "OWASP Top 10 Sprint",
    questions: 12,
  },
  {
    id: "iot-042",
    title: "IoT Protocol Triage",
    questions: 10,
  },
  {
    id: "crypto-013",
    title: "Cipher Suites Under Pressure",
    questions: 8,
  },
];

export default function QuizzesPage() {
  return (
    <main className="min-h-screen px-6 py-12 md:px-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div>
          <h1 className="text-3xl font-semibold">Quiz library</h1>
          <p className="mt-2 text-white/70">
            Approved community quizzes will appear here.
          </p>
        </div>

        <section className="grid gap-6 md:grid-cols-2">
          {sampleQuizzes.map((quiz) => (
            <GlassPanel key={quiz.id} className="flex flex-col gap-4 p-6">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {quiz.title}
                </h2>
                <p className="mt-2 text-sm text-white/70">
                  {quiz.questions} questions
                </p>
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
