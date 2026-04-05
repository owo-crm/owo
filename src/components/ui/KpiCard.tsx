import { Card } from "@/components/ui/Card";
import type { KpiCardProps } from "@/components/ui/types";
import { cn } from "@/lib/ui";

export function KpiCard({ label, value, tone = "default" }: KpiCardProps) {
  return (
    <Card
      className={cn(
        tone === "accent"
          ? "border-[#8ea3ff]/45 bg-[linear-gradient(120deg,rgba(107,127,240,0.16)_0%,rgba(107,127,240,0.08)_100%)]"
          : "border-[#d3dcf7]",
      )}
    >
      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold leading-none text-slate-900">{value}</p>
    </Card>
  );
}
