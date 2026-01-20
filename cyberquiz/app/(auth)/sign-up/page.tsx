import { GlassPanel } from "@/components/ui/GlassPanel";

export default function SignUpPage() {
  return (
    <main className="min-h-screen px-6 py-12 md:px-12">
      <div className="mx-auto max-w-md">
        <GlassPanel className="p-8">
          <h1 className="text-2xl font-semibold">Create account</h1>
          <p className="mt-3 text-white/70">
            Registration flow will live here. Supabase auth and profile setup
            will plug in next.
          </p>
        </GlassPanel>
      </div>
    </main>
  );
}
