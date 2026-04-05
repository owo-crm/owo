import type { FormFieldProps } from "@/components/ui/types";
import { cn } from "@/lib/ui";

export function FormField({
  label,
  hint,
  error,
  className,
  children,
}: FormFieldProps & { children: React.ReactNode }) {
  return (
    <label className={cn("grid gap-1.5", className)}>
      {label ? <span className="text-xs uppercase tracking-[0.11em] text-slate-500">{label}</span> : null}
      {children}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
      {!error && hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}
