import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-[var(--panel)] p-6 shadow-[var(--shadow)]",
        className
      )}
      {...props}
    />
  );
}
