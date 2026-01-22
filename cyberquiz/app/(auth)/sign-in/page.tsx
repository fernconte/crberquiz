import { GlassPanel } from "@/components/ui/GlassPanel";
import { AuthForm } from "@/components/auth/AuthForm";

export default function SignInPage() {
  return (
    <main className="min-h-screen px-6 py-12 md:px-12">
      <div className="mx-auto max-w-md">
        <GlassPanel className="p-8">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="mt-3 text-white/70">
            Access your saved progress and submissions.
          </p>
          <AuthForm mode="signin" />
        </GlassPanel>
      </div>
    </main>
  );
}
