"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "primary" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "default", asChild = false, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap disabled:pointer-events-none disabled:opacity-50",
          {
            "btn-primary": variant === "primary",
            "btn-outline": variant === "outline",
            "rounded-full px-4 py-2 text-sm font-medium text-strong transition-colors bg-hover-soft focus-ring-theme": variant === "ghost",
            "text-primary underline-offset-4 hover:underline focus-ring-theme": variant === "link",
            "text-sm": size === "default",
            "min-h-[var(--control-height-sm)] px-4 text-xs": size === "sm",
            "min-h-[var(--control-height-lg)] px-8 text-base": size === "lg",
            "h-10 w-10 rounded-full p-0": size === "icon",
          },
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
