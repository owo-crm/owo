/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const avatarStatusVariants = cva("flex size-2 items-center rounded-full border-2 border-background", {
  variants: {
    variant: {
      online: "bg-green-600",
      offline: "bg-zinc-500 dark:bg-zinc-300",
      busy: "bg-amber-500",
      away: "bg-blue-500",
    },
  },
  defaultVariants: {
    variant: "online",
  },
});

type AvatarProps = React.HTMLAttributes<HTMLDivElement>;
type AvatarImageProps = React.ImgHTMLAttributes<HTMLImageElement>;
type AvatarFallbackProps = React.HTMLAttributes<HTMLDivElement>;

function Avatar({ className, ...props }: AvatarProps) {
  return <div data-slot="avatar" className={cn("relative flex size-10 shrink-0", className)} {...props} />;
}

function AvatarImage({ className, alt = "", ...props }: AvatarImageProps) {
  return (
    <div className={cn("relative size-full overflow-hidden rounded-full", className)}>
      <img data-slot="avatar-image" alt={alt} className="h-full w-full object-cover" {...props} />
    </div>
  );
}

function AvatarFallback({ className, ...props }: AvatarFallbackProps) {
  return (
    <div
      data-slot="avatar-fallback"
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full border border-border bg-accent text-xs text-accent-foreground",
        className,
      )}
      {...props}
    />
  );
}

function AvatarIndicator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="avatar-indicator"
      className={cn("absolute bottom-0 right-0 flex size-6 items-center justify-center", className)}
      {...props}
    />
  );
}

function AvatarStatus({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof avatarStatusVariants>) {
  return <div data-slot="avatar-status" className={cn(avatarStatusVariants({ variant }), className)} {...props} />;
}

export { Avatar, AvatarFallback, AvatarImage, AvatarIndicator, AvatarStatus, avatarStatusVariants };
