import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { User } from "@/types";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { MobileNavMenu, NavMenu } from "@/components/app/NavMenu";
import {
  LogOutIcon,
} from "@/components/icons";
import { logoutUser } from "@/lib/auth.api";

async function handleLogout() {
  "use server";

  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  await logoutUser(cookieHeader);
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
  redirect("/auth");
}

export function AppShell({
  children,
  user,
}: {
  readonly children: React.ReactNode;
  readonly user: User;
}) {
  return (
    <div className="min-h-screen grid md:grid-cols-[260px_1fr]">
      <aside className="hidden md:flex flex-col gap-8 px-6 py-8 border-r border-white/10 bg-[rgba(10,10,10,0.8)]">
        <Logo />
        <NavMenu />
        <div className="mt-auto glass rounded-2xl p-4">
          <div className="text-xs uppercase tracking-[0.3em] text-white/50">
            Signed in
          </div>
          <div className="mt-2 text-sm font-semibold">{user.name}</div>
          <div className="text-xs text-white/60">{user.email}</div>
          <form action={handleLogout} className="mt-4">
            <Button type="submit" variant="ghost" className="w-full justify-center">
              <LogOutIcon />
              Logout
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex flex-col min-h-screen">
        <header className="md:hidden flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[rgba(10,10,10,0.8)]">
          <Logo />
          <form action={handleLogout}>
            <Button type="submit" variant="ghost" aria-label="Logout">
              <LogOutIcon />
            </Button>
          </form>
        </header>

        <main className="flex-1 px-4 py-6 pb-24 sm:px-6 sm:py-8 lg:px-12 md:pb-8">{children}</main>
      </div>
      <MobileNavMenu />
    </div>
  );
}
