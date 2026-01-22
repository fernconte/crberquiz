import { AdminPanel } from "@/components/admin/AdminPanel";
import { requireAdminUser } from "@/lib/auth/requireAdminUser";

export default async function AdminDashboardPage() {
  await requireAdminUser();

  return (
    <main className="min-h-screen px-6 py-12 md:px-12">
      <div className="mx-auto max-w-6xl">
        <AdminPanel />
      </div>
    </main>
  );
}
