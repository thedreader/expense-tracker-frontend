import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--accent-1)] text-black flex items-center justify-center font-semibold">
            NL
          </div>
          <span className="text-lg tracking-tight">Neon Ledger</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/auth"
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/auth"
            className="rounded-full px-5 py-2 bg-[var(--accent-1)] text-[#0D0D0D] font-semibold hover:bg-[var(--accent-3)] hover:text-white transition-colors"
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="flex-1 px-6 md:px-12 py-12 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs uppercase tracking-[0.3em] text-white/70">
            Daily clarity for monthly goals
          </div>
          <h1 className="text-4xl md:text-6xl font-semibold leading-tight">
            Track every spend, feel the month stay under control.
          </h1>
          <p className="text-lg text-white/70 max-w-xl">
            Neon Ledger turns daily expenses into clean, confident monthly insights.
            Log transactions in seconds, spot patterns, and budget with a calm, focused dashboard.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/auth"
              className="rounded-full px-6 py-3 bg-[var(--accent-1)] text-[#0D0D0D] font-semibold hover:bg-[var(--accent-3)] hover:text-white transition-colors"
            >
              Start tracking
            </Link>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-white/60">
            <div>
              <div className="text-white text-2xl font-semibold">3 min</div>
              Setup to first entry
            </div>
            <div>
              <div className="text-white text-2xl font-semibold">9</div>
              Built-in categories
            </div>
            <div>
              <div className="text-white text-2xl font-semibold">30 days</div>
              Monthly clarity
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-8 border border-white/10 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">This month</h2>
            <span className="text-xs uppercase tracking-[0.2em] text-white/60">Feb 2026</span>
          </div>
          <div className="grid gap-4">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <p className="text-white/60 text-sm">Total spent</p>
              <p className="text-3xl font-semibold">$1,842.90</p>
              <div className="mt-2 text-sm text-[var(--accent-1)]">-8% vs last month</div>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <p className="text-white/60 text-sm">Top category</p>
              <p className="text-xl font-semibold">Rent</p>
              <div className="mt-2 flex items-center gap-2 text-sm text-white/60">
                <span className="h-2 w-2 rounded-full bg-[var(--accent-2)]"></span>
                <span>$950.00 logged</span>
              </div>
            </div>
            <div className="rounded-2xl bg-gradient-to-r from-[rgba(0,255,133,0.2)] to-[rgba(30,144,255,0.1)] border border-white/10 p-4">
              <p className="text-white/70 text-sm">Next action</p>
              <p className="text-lg font-semibold">Log today&apos;s expenses</p>
              <p className="text-xs text-white/60 mt-2">
                Keep the streak going to unlock clearer trends.
              </p>
            </div>
          </div>
        </div>
      </main>

      <section className="px-6 md:px-12 pb-16 grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Fast logging",
            text: "Capture a spend with name, amount, and category in under 15 seconds.",
          },
          {
            title: "Smart summaries",
            text: "See category leaders, monthly totals, and the cost of habits at a glance.",
          },
          {
            title: "Built for focus",
            text: "Dark, neon-forward UI that keeps attention on what matters: your money.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="glass rounded-2xl p-6 border border-white/10"
          >
            <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
            <p className="text-white/70 text-sm">{item.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
