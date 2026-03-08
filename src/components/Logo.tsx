import { memo } from "react";

function LogoBase() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-[var(--accent-1)] text-[#0D0D0D] flex items-center justify-center font-semibold">
        NL
      </div>
      <div>
        <div className="text-sm uppercase tracking-[0.3em] text-white/60">Ledger</div>
        <div className="text-lg font-semibold">Neon</div>
      </div>
    </div>
  );
}

export const Logo = memo(LogoBase);
Logo.displayName = "Logo";
