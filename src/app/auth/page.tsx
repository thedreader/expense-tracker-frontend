import { AuthForm } from "@/components/auth/AuthForm";

export default function AuthPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_0.95fr]">
      <div className="hidden lg:flex flex-col justify-between p-12">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70">
            Expense tracker
          </div>
          <h1 className="mt-6 text-5xl font-semibold leading-tight">
            Your monthly clarity starts with one daily entry.
          </h1>
          <p className="mt-4 text-white/70 max-w-xl">
            Log expenses in seconds, explore category trends, and keep your money
            momentum steady all month long.
          </p>
        </div>
        <div className="glass rounded-3xl p-8 border border-white/10">
          <h3 className="text-lg font-semibold">What you get</h3>
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            <li>Realtime monthly totals and category summaries</li>
            <li>Daily-friendly expense capture</li>
            <li>Secure sessions with refresh tokens</li>
          </ul>
        </div>
      </div>
      <div className="flex items-center justify-center p-8">
        <AuthForm />
      </div>
    </div>
  );
}