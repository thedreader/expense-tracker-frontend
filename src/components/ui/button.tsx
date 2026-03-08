import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
        variant === "primary" &&
          "bg-[var(--accent-1)] text-[#0D0D0D] hover:bg-[var(--accent-3)] hover:text-white",
        variant === "secondary" &&
          "bg-white/10 text-white hover:bg-white/20",
        variant === "ghost" && "bg-transparent text-white/70 hover:text-white",
        variant === "outline" &&
          "border border-white/15 text-white/80 hover:border-white/40 hover:text-white",
        className
      )}
      {...props}
    />
  );
}
