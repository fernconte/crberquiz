import { GlassPanel } from "@/components/ui/GlassPanel";

export default function AdminDashboardPage() {
  return (
    <main className="min-h-screen px-6 py-12 md:px-12">
      <div className="mx-auto max-w-5xl">
        <GlassPanel className="p-8">
          <h1 className="text-2xl font-semibold">Admin dashboard</h1>
          <p className="mt-3 text-white/70">
            Pending quizzes, moderation stats, and review tools will render
            here.
          </p>
        </GlassPanel>
      </div>
    </main>
  );
}
