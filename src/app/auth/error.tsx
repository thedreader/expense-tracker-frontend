"use client";

import { Button } from "@/components/ui/button";

export default function AuthError({
  reset,
}: {
  readonly reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-[var(--accent-3)]/40 bg-[rgba(255,0,153,0.1)] p-6">
        <h2 className="text-lg font-semibold">Unable to load auth page</h2>
        <p className="mt-2 text-sm text-white/75">
          Please retry. If the issue continues, refresh the browser.
        </p>
        <Button className="mt-4" onClick={reset}>
          Retry
        </Button>
      </div>
    </div>
  );
}
