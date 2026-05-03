"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-white/30 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "accent-gradient shadow-card",
        variant === "secondary" &&
          "border border-white/10 bg-white/6 text-white hover:bg-white/10",
        variant === "ghost" && "bg-transparent text-white/72 hover:text-white",
        className,
      )}
      {...props}
    />
  );
}
