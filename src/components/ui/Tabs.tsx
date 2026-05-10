"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/ui";

export const Tabs = TabsPrimitive.Root;
export const TabsContent = TabsPrimitive.Content;

export function TabsList({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex h-10 items-center rounded-xl border border-[var(--app-border,#d2dcf8)] bg-[var(--app-surface,#ffffff)] p-1",
        className,
      )}
    >
      {children}
    </TabsPrimitive.List>
  );
}

export function TabsTrigger({
  className,
  children,
  value,
}: {
  className?: string;
  children: React.ReactNode;
  value: string;
}) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      className={cn(
        "inline-flex h-8 items-center rounded-lg px-3 text-xs text-[var(--app-muted,#64748b)] transition-colors",
        "data-[state=active]:bg-[#2D5CFE] data-[state=active]:text-white data-[state=active]:[&_svg]:text-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b7ff0]/65",
        className,
      )}
    >
      {children}
    </TabsPrimitive.Trigger>
  );
}
