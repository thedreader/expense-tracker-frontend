import Link from "next/link";
import { memo } from "react";
import { Button } from "@/components/ui/button";

function EmptyStateBase({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="glass rounded-2xl p-8 border border-white/10 text-center">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-white/60 mb-6">{description}</p>
      {actionLabel && actionHref ? (
        <Link href={actionHref}>
          <Button>{actionLabel}</Button>
        </Link>
      ) : null}
    </div>
  );
}

export const EmptyState = memo(EmptyStateBase);
EmptyState.displayName = "EmptyState";
