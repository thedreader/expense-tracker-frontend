"use client";

import { Button } from "@/components/ui/button";

export default function ProtectedError({
  reset,
}: {
  readonly reset: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--accent-3)]/40 bg-[rgba(255,0,153,0.1)] p-6">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="mt-2 text-sm text-white/75">
        We couldn&apos;t load this page. Please try again.
      </p>
      <Button className="mt-4" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
