"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { TbX } from "react-icons/tb";
import { cn } from "@/lib/ui";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export function SheetContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-[#1f3b9b]/18 backdrop-blur-[1px]" />
      <DialogPrimitive.Content
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-2xl border border-[#ccd7f5] bg-white p-4 text-slate-900 shadow-[0_-14px_46px_rgba(76,103,227,0.24)] lg:bottom-auto lg:left-auto lg:right-0 lg:top-0 lg:h-full lg:max-h-none lg:w-[420px] lg:rounded-none lg:rounded-l-2xl",
          className,
        )}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#c6d2f7] lg:hidden" />
        <DialogPrimitive.Close className="absolute right-3 top-3 rounded-md p-1 text-slate-500 hover:bg-[#eef2ff] hover:text-slate-900">
          <TbX className="h-4 w-4" />
        </DialogPrimitive.Close>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
