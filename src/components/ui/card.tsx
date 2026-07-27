import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: Readonly<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-2xl border border-white/10 bg-[var(--panel)] p-4 sm:p-6 shadow-[var(--shadow)]",
        className
      )}
      {...props}
    />
  );
}
