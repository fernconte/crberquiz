import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { getCategories } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const categories = await getCategories();

  return (
    <main className="min-h-screen px-6 py-12 md:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <GlassPanel className="relative overflow-hidden p-10 md:p-14">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyber-magenta/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-cyber-cyan/20 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-6">
            <p className="text-sm uppercase tracking-[0.3em] text-cyber-cyan">
              LandofCyber
            </p>
            <h1 className="text-3xl font-bold text-white md:text-5xl">
              Train like a defender. Compete like a hacker.
            </h1>
            <p className="max-w-2xl text-lg text-white/80">
              Dive into live, community-built quizzes across the cybersecurity
              landscape. Earn time bonuses, climb the leaderboard, and build
              your reputation.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/quizzes"
                className="rounded-full border border-cyber-neon/50 bg-cyber-neon/10 px-6 py-3 text-sm font-semibold text-cyber-neon shadow-neon transition hover:bg-cyber-neon/20"
              >
                Start a quiz
              </Link>
              <Link
                href="/sign-up"
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-cyber-cyan/60 hover:text-cyber-cyan"
              >
                Create an account
              </Link>
            </div>
          </div>
        </GlassPanel>

        <section className="grid gap-6 md:grid-cols-2">
          {categories.map((category) => (
            <GlassPanel key={category.id} className="p-6">
              <h2 className="text-xl font-semibold text-white">
                {category.name}
              </h2>
              <p className="mt-2 text-sm text-white/70">
                {category.description}
              </p>
            </GlassPanel>
          ))}
        </section>
      </div>
    </main>
  );
}
