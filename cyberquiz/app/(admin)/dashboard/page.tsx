import { GlassPanel } from "@/components/ui/GlassPanel";
import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <main className="min-h-screen px-6 py-12 md:px-12">
      <div className="mx-auto max-w-5xl">
        <GlassPanel className="p-8">
          <h1 className="text-2xl font-semibold">Admin dashboard</h1>
          <p className="mt-3 text-white/70">
            Review pending quizzes and approve them for publishing.
          </p>
          <div className="mt-6">
            <Link
              href="/quizzes/pending"
              className="inline-flex rounded-full border border-cyber-cyan/40 px-4 py-2 text-sm text-cyber-cyan transition hover:border-cyber-neon/60 hover:text-cyber-neon"
            >
              Review submissions
            </Link>
          </div>
        </GlassPanel>
      </div>
    </main>
  );
}
