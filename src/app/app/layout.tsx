import { AppShell } from "@/components/product/AppShell";
import { resolveShellBusiness } from "@/lib/shell-context";

export const dynamic = "force-dynamic";

export default async function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const business = await resolveShellBusiness();

  return (
    <AppShell businessName={business?.name ?? "No business connected"}>
      {children}
    </AppShell>
  );
}
