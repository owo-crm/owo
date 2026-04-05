"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { TbChevronDown } from "react-icons/tb";
import { cn } from "@/lib/ui";

export type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  options: SelectOption[];
  className?: string;
};

export function Select({ value, onValueChange, placeholder, options, className }: SelectProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        className={cn(
          "inline-flex h-10 w-full items-center justify-between rounded-xl border border-[#ccd7f5] bg-white px-3 text-sm text-slate-900",
          "transition-colors focus-visible:border-[#6b7ff0]/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b7ff0]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder ?? "Select"} />
        <SelectPrimitive.Icon>
          <TbChevronDown className="h-4 w-4 text-slate-500" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-50 min-w-[220px] overflow-hidden rounded-xl border border-[#ccd7f5] bg-white p-1 shadow-[0_20px_48px_rgba(76,103,227,0.2)]"
        >
          <SelectPrimitive.Viewport className="space-y-0.5">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className="cursor-pointer rounded-lg px-2.5 py-2 text-sm text-slate-700 outline-none transition-colors data-[highlighted]:bg-[#edf2ff] data-[state=checked]:text-[#243a8f]"
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
