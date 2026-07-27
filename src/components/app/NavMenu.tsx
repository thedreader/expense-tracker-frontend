"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AnalyticsIcon,
  DashboardIcon,
  ExpensesIcon,
  PlusIcon,
  ProfileIcon,
  SettingsIcon,
} from "@/components/icons";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/expenses", label: "Expenses", icon: ExpensesIcon },
  { href: "/analytics", label: "Analytics", icon: AnalyticsIcon },
  { href: "/expenses/new", label: "New expense", icon: PlusIcon },
  { href: "/profile", label: "Profile", icon: ProfileIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

const ITEM_HEIGHT = 44;
const ITEM_GAP = 8;

function getActiveHref(pathname: string) {
  if (pathname.startsWith("/expenses/") && pathname !== "/expenses/new") {
    return "/expenses";
  }

  let active = "";
  for (const item of navItems) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      if (item.href.length > active.length) {
        active = item.href;
      }
    }
  }
  return active || "/dashboard";
}

export function NavMenu() {
  const pathname = usePathname();
  const activeHref = getActiveHref(pathname);
  const activeIndex = Math.max(
    navItems.findIndex((item) => item.href === activeHref),
    0
  );

  return (
    <nav className="relative">
      <div
        aria-hidden
        className="absolute left-0 right-0 rounded-xl bg-white/10 transition-transform duration-300 ease-out"
        style={{
          height: `${ITEM_HEIGHT}px`,
          transform: `translateY(${activeIndex * (ITEM_HEIGHT + ITEM_GAP)}px)`,
        }}
      />
      <div className="relative space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === activeHref;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-11 items-center gap-3 rounded-xl px-4 text-sm transition-colors ${
                isActive
                  ? "text-white"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileNavMenu() {
  const pathname = usePathname();
  const activeHref = getActiveHref(pathname);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[rgba(10,10,10,0.92)] pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <div className="grid grid-cols-6 items-end px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === activeHref;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-11 min-w-0 w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-lg px-1 py-2 text-[11px] transition-all ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:text-white"
              }`}
              aria-label={item.label}
              title={item.label}
            >
              <Icon />
              {isActive ? <span className="block max-w-full truncate">{item.label}</span> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
