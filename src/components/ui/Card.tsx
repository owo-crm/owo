import { cn } from "@/lib/ui";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-[#d3dcf7] bg-white p-4 shadow-[0_12px_30px_rgba(76,103,227,0.12)]",
        className,
      )}
    >
      {children}
    </article>
  );
}
