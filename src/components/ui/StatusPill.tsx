import type { StatusPillProps } from "@/components/ui/types";
import { cn } from "@/lib/ui";

const toneClass: Record<NonNullable<StatusPillProps["tone"]>, string> = {
  default: "border border-[#6b7ff0]/35 bg-[#eef2ff] text-[#2f45a1]",
  success: "border border-emerald-500/35 bg-emerald-50 text-emerald-700",
  danger: "border border-[#ef4444]/35 bg-red-50 text-red-700",
  muted: "border border-slate-300 bg-slate-100 text-slate-600",
};

function toRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const normalized =
    clean.length === 3
      ? clean
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return undefined;
  }
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function StatusPill({ label, tone = "default", colorHex }: StatusPillProps) {
  const customStyle =
    colorHex && toRgba(colorHex, 0.16)
      ? {
          backgroundColor: toRgba(colorHex, 0.16),
          borderColor: toRgba(colorHex, 0.42),
          color: colorHex,
        }
      : undefined;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        toneClass[tone],
      )}
      style={customStyle}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: colorHex ?? "currentColor", opacity: colorHex ? 1 : 0.65 }}
      />
      {label}
    </span>
  );
}
