import { GlassPanel } from "@/components/ui/GlassPanel";
import { AuthForm } from "@/components/auth/AuthForm";

export default function SignUpPage() {
  return (
    <main className="min-h-screen px-6 py-12 md:px-12">
      <div className="mx-auto max-w-md">
        <GlassPanel className="p-8">
          <h1 className="text-2xl font-semibold">Create account</h1>
          <p className="mt-3 text-white/70">
            Create an account to submit quizzes for review.
          </p>
          <AuthForm mode="signup" />
        </GlassPanel>
      </div>
    </main>
  );
}
