"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { User } from "@/types";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { MobileNavMenu, NavMenu } from "@/components/app/NavMenu";
import { LogOutIcon, SparkleIcon } from "@/components/icons";
import { logoutUser } from "@/lib/auth.api";

const AiExpenseModal = dynamic(
  () => import("@/components/app/AiExpenseModal"),
  { ssr: false },
);

const HIDDEN_FAB_ROUTES = ["/profile", "/settings"];

export function AppShell({
  children,
  user,
}: {
  readonly children: React.ReactNode;
  readonly user: User;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const showFab = !HIDDEN_FAB_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  const handleLogout = async () => {
    try {
      await logoutUser();
    } finally {
      router.replace("/auth");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-[260px_1fr]">
      <aside className="hidden md:flex flex-col gap-8 px-6 py-8 border-r border-white/10 bg-[rgba(10,10,10,0.8)]">
        <Logo />
        <NavMenu />
        <div className="mt-auto glass rounded-2xl p-4">
          <div className="text-xs uppercase tracking-[0.3em] text-white/50">
            Signed in
          </div>
          <div className="mt-2 break-words text-sm font-semibold">{user.name}</div>
          <div className="break-all text-xs text-white/60">{user.email}</div>
          <Button
            type="button"
            variant="ghost"
            className="mt-4 w-full justify-center"
            onClick={handleLogout}
          >
            <LogOutIcon />
            Logout
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col min-h-screen">
        <header className="md:hidden flex items-center justify-between px-4 py-4 border-b border-white/10 bg-[rgba(10,10,10,0.8)] sm:px-6">
          <Logo />
          <Button
            type="button"
            variant="ghost"
            aria-label="Logout"
            onClick={handleLogout}
          >
            <LogOutIcon />
          </Button>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-8 lg:px-12 md:pb-8">
          {children}
        </main>
      </div>
      <MobileNavMenu />

      {/* AI FAB */}
      {showFab ? (
        <button
          type="button"
          onClick={() => setAiModalOpen(true)}
          aria-label="AI expense entry"
          className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-2)] to-[var(--accent-3)] text-white shadow-[0_10px_30px_rgba(30,144,255,0.3)] transition-all hover:scale-110 hover:shadow-[0_14px_40px_rgba(30,144,255,0.45)] active:scale-95 md:bottom-8 md:right-8"
        >
          <SparkleIcon />
        </button>
      ) : null}

      {/* AI modal (lazy-loaded) */}
      {aiModalOpen ? (
        <AiExpenseModal onClose={() => setAiModalOpen(false)} />
      ) : null}
    </div>
  );
}
