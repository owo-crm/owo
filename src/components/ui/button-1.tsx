import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
        outline: "border border-input bg-background text-foreground hover:bg-accent",
        ghost: "text-foreground hover:bg-accent",
        dim: "text-muted-foreground hover:bg-accent hover:text-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        mono: "bg-zinc-950 text-white hover:bg-zinc-900 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300",
        dashed: "border border-dashed border-input bg-background text-foreground hover:bg-accent",
        foreground: "text-foreground hover:bg-accent",
        inverse: "text-inherit hover:bg-accent/60",
      },
      size: {
        sm: "h-7 px-2.5 text-xs",
        md: "h-8.5 px-3 text-sm",
        lg: "h-10 px-4 text-sm",
        icon: "size-8.5 p-0",
      },
      mode: {
        default: "",
        icon: "p-0",
        link: "h-auto rounded-none bg-transparent p-0 underline-offset-4 hover:underline",
        input: "justify-start border border-input bg-background px-3 text-left",
      },
      shape: {
        default: "",
        circle: "rounded-full",
      },
      appearance: {
        default: "",
        ghost: "bg-transparent",
      },
      autoHeight: {
        true: "h-auto min-h-8.5",
        false: "",
      },
      placeholder: {
        true: "text-muted-foreground",
        false: "",
      },
      underline: {
        solid: "",
        dashed: "",
      },
      underlined: {
        solid: "",
        dashed: "",
      },
    },
    compoundVariants: [
      { size: "sm", mode: "icon", className: "size-7" },
      { size: "md", mode: "icon", className: "size-8.5" },
      { size: "lg", mode: "icon", className: "size-10" },
      { variant: "primary", mode: "default", appearance: "default", className: "shadow-xs shadow-black/5" },
      { variant: "outline", mode: "default", appearance: "default", className: "shadow-xs shadow-black/5" },
      { variant: "dim", mode: "icon", className: "text-muted-foreground hover:text-foreground" },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
      mode: "default",
      shape: "default",
      appearance: "default",
      autoHeight: false,
      placeholder: false,
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    selected?: boolean;
    asChild?: boolean;
  };

function Button({
  className,
  selected,
  variant,
  shape,
  appearance,
  mode,
  size,
  autoHeight,
  underlined,
  underline,
  asChild = false,
  placeholder = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(
        buttonVariants({
          variant,
          size,
          shape,
          appearance,
          mode,
          autoHeight,
          placeholder,
          underlined,
          underline,
        }),
        className,
      )}
      {...(selected ? { "data-state": "open" } : {})}
      {...props}
    />
  );
}

type ButtonArrowProps = React.SVGProps<SVGSVGElement> & {
  icon?: LucideIcon;
};

function ButtonArrow({ icon: Icon = ChevronDown, className, ...props }: ButtonArrowProps) {
  return <Icon data-slot="button-arrow" className={cn("ms-auto -me-1", className)} {...props} />;
}

export { Button, ButtonArrow, buttonVariants };
