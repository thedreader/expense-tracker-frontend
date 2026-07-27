import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-base text-white placeholder:text-white/40 focus:border-[var(--accent-1)] focus:outline-none focus:ring-2 focus:ring-[rgba(0,255,133,0.2)]",
        className
      )}
      {...props}
    />
  );
}
