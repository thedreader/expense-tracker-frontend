"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import type { User } from "@/types";
import { getCurrentUser } from "@/lib/user.api";

export default function ProtectedLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    const verifySession = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (active) {
          setUser(currentUser);
          setChecking(false);
        }
      } catch {
        if (active) {
          router.replace("/auth");
        }
      }
    };

    setChecking(true);
    verifySession();

    return () => {
      active = false;
    };
  }, [router]);

  if (checking || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[var(--accent-1)]" />
      </div>
    );
  }

  return <AppShell user={user}>{children}</AppShell>;
}
