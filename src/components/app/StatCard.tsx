import { memo, ReactNode } from "react";

function StatCardBase({
  label,
  value,
  helper,
  accent,
  icon,
}: {
  label: string;
  value: string;
  helper?: string;
  accent?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-white/60">{label}</p>
          <h3 className="truncate text-2xl font-semibold mt-2">{value}</h3>
        </div>
        {icon ? (
          <div
            className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center bg-white/10"
            style={accent ? { backgroundColor: `${accent}20` } : undefined}
          >
            <span style={accent ? { color: accent } : undefined}>{icon}</span>
          </div>
        ) : null}
      </div>
      {helper ? <p className="mt-3 text-sm text-white/50">{helper}</p> : null}
    </div>
  );
}

export const StatCard = memo(StatCardBase);
StatCard.displayName = "StatCard";
