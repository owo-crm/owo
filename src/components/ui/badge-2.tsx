import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-md border border-transparent px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        success: "bg-emerald-500 text-white",
        warning: "bg-amber-500 text-black",
        info: "bg-violet-500 text-white",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border-border bg-transparent text-foreground",
      },
      appearance: {
        default: "",
        light: "",
        outline: "",
        ghost: "border-transparent bg-transparent px-0",
      },
      size: {
        lg: "h-7 min-w-7 px-2 text-xs",
        md: "h-6 min-w-6 px-2 text-xs",
        sm: "h-5 min-w-5 rounded-sm px-1.5 text-[11px]",
        xs: "h-4 min-w-4 rounded-sm px-1 text-[10px]",
      },
      shape: {
        default: "",
        circle: "rounded-full",
      },
      disabled: {
        true: "pointer-events-none opacity-50",
        false: "",
      },
    },
    compoundVariants: [
      { variant: "primary", appearance: "light", className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
      { variant: "secondary", appearance: "light", className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200" },
      { variant: "success", appearance: "light", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
      { variant: "warning", appearance: "light", className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
      { variant: "info", appearance: "light", className: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300" },
      { variant: "destructive", appearance: "light", className: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" },
      { variant: "primary", appearance: "outline", className: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300" },
      { variant: "success", appearance: "outline", className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300" },
      { variant: "warning", appearance: "outline", className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300" },
      { variant: "info", appearance: "outline", className: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300" },
      { variant: "destructive", appearance: "outline", className: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300" },
      { size: "lg", appearance: "ghost", className: "h-auto min-w-0" },
      { size: "md", appearance: "ghost", className: "h-auto min-w-0" },
      { size: "sm", appearance: "ghost", className: "h-auto min-w-0" },
      { size: "xs", appearance: "ghost", className: "h-auto min-w-0" },
    ],
    defaultVariants: {
      variant: "primary",
      appearance: "default",
      size: "md",
      disabled: false,
    },
  },
);

const badgeButtonVariants = cva(
  "inline-flex size-3.5 cursor-pointer items-center justify-center rounded-md opacity-60 transition-opacity hover:opacity-100",
  {
    variants: {
      variant: {
        default: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
  };

function Badge({
  className,
  variant,
  size,
  appearance,
  shape,
  disabled,
  asChild = false,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size, appearance, shape, disabled }), className)}
      {...props}
    />
  );
}

type BadgeButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof badgeButtonVariants> & {
    asChild?: boolean;
  };

function BadgeButton({ className, variant, asChild = false, ...props }: BadgeButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="badge-button" className={cn(badgeButtonVariants({ variant }), className)} {...props} />;
}

function BadgeDot({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="badge-dot" className={cn("size-1.5 rounded-full bg-current opacity-75", className)} {...props} />;
}

export { Badge, BadgeButton, BadgeDot, badgeVariants };
