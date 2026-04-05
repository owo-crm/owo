"use client";

import { cn } from "@/lib/ui";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-xl border border-[#ccd7f5] bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400",
        "transition-colors focus-visible:border-[#6b7ff0]/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b7ff0]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        className,
      )}
      {...props}
    />
  );
}
