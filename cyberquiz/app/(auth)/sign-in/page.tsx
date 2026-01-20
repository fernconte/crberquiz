import { GlassPanel } from "@/components/ui/GlassPanel";

export default function SignInPage() {
  return (
    <main className="min-h-screen px-6 py-12 md:px-12">
      <div className="mx-auto max-w-md">
        <GlassPanel className="p-8">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="mt-3 text-white/70">
            Auth UI goes here. Supabase auth will handle magic links or
            password-based sign-in.
          </p>
        </GlassPanel>
      </div>
    </main>
  );
}
