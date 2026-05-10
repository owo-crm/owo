import { ManusCrmShell } from "@/components/manus-crm/ManusCrmShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <ManusCrmShell>{children}</ManusCrmShell>;
}
