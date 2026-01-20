import { GlassPanel } from "@/components/ui/GlassPanel";

export default function PendingQuizzesPage() {
  return (
    <main className="min-h-screen px-6 py-12 md:px-12">
      <div className="mx-auto max-w-5xl">
        <GlassPanel className="p-8">
          <h1 className="text-2xl font-semibold">Pending quizzes</h1>
          <p className="mt-3 text-white/70">
            Moderation queue will populate from Supabase.
          </p>
        </GlassPanel>
      </div>
    </main>
  );
}
