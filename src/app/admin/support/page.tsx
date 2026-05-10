import { AdminSupportInbox } from "@/components/manus-crm/support/AdminSupportInbox";

export default function AdminSupportPage() {
  return (
    <main className="min-h-screen bg-[var(--app-bg,#f8fafc)] p-4 text-[var(--app-text,#0f172a)] lg:p-6">
      <AdminSupportInbox />
    </main>
  );
}

