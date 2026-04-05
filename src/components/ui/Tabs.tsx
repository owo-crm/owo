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
        "inline-flex h-10 items-center rounded-xl border border-[#d2dcf8] bg-white p-1",
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
        "inline-flex h-8 items-center rounded-lg px-3 text-xs text-slate-600 transition-colors",
        "data-[state=active]:bg-[#e8eeff] data-[state=active]:text-[#243a8f]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b7ff0]/65",
        className,
      )}
    >
      {children}
    </TabsPrimitive.Trigger>
  );
}
