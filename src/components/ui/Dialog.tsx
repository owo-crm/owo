"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { TbX } from "react-icons/tb";
import { cn } from "@/lib/ui";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-[#1f3b9b]/20 backdrop-blur-[2px]" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[min(92vw,560px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#ccd7f5] bg-white p-4 text-slate-900 shadow-[0_28px_56px_rgba(76,103,227,0.24)]",
          className,
        )}
      >
        <DialogPrimitive.Close className="absolute right-3 top-3 rounded-md p-1 text-slate-500 hover:bg-[#eef2ff] hover:text-slate-900">
          <TbX className="h-4 w-4" />
        </DialogPrimitive.Close>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
