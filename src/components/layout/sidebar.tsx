"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Briefcase,
  Calendar,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Settings,
  UserCircle,
  Wallet,
  X,
} from "lucide-react";

type SidebarProps = {
  userRole?: string;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["employee", "manager", "hr_admin"] },
  { href: "/leave", label: "Leave", icon: Calendar, roles: ["employee", "manager", "hr_admin"] },
  { href: "/manager", label: "Manager", icon: ClipboardList, roles: ["manager", "hr_admin"] },
  { href: "/salary", label: "Salary", icon: Wallet, roles: ["employee", "manager", "hr_admin"] },
  { href: "/profile", label: "Profile", icon: UserCircle, roles: ["employee", "manager", "hr_admin"] },
  { href: "/admin", label: "Admin Panel", icon: Settings, roles: ["hr_admin"] },
];

export function Sidebar({
  userRole = "employee",
  mobileOpen = false,
  onMobileOpenChange,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError(null);

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });

      if (!response.ok) {
        throw new Error(`Logout failed with status ${response.status}`);
      }

      onMobileOpenChange?.(false);
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("[SIDEBAR_LOGOUT]", error);
      setLogoutError("Unable to log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  const content = (
    <>
      <div className="flex items-start justify-between px-6 pt-7 pb-5">
        <div className="space-y-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
            <Briefcase className="h-5 w-5 text-[#9fbfff]" />
          </div>
          <div>
            <p className="font-heading text-xl font-bold text-sidebar-foreground">HRMS Portal</p>
            <p className="text-xs tracking-[0.2em] uppercase text-white/60">Administrative Atelier</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onMobileOpenChange?.(false)}
          className="md:hidden rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent"
          aria-label="Close mobile menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 pb-3">
        <div className="rounded-2xl bg-white/6 px-4 py-3 text-xs text-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          Signed in as <span className="font-semibold text-white">{userRole.replace("_", " ")}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        <nav className="space-y-1.5 px-3">
          {navItems
            .filter((item) => item.roles.includes(userRole))
            .map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onMobileOpenChange?.(false)}
                  className={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[linear-gradient(135deg,rgba(0,74,198,0.55),rgba(0,123,113,0.18))] text-white shadow-[0_16px_28px_-20px_rgba(0,0,0,0.5)]"
                      : "text-white/78 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <span
                    className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${
                      isActive ? "bg-[#9fbfff]" : "bg-transparent"
                    }`}
                  />
                  <item.icon className="w-5 h-5 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
        </nav>
      </div>

      <div className="p-4 space-y-2">
        {logoutError ? (
          <p className="text-xs text-rose-200">{logoutError}</p>
        ) : null}

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 rounded-xl bg-white/6 px-4 py-3 text-sm font-medium text-white/80 transition-all hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          <LogOut className="w-5 h-5" />
          {loggingOut ? "Logging out…" : "Logout"}
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden h-full w-72 flex-col bg-[linear-gradient(180deg,#00174b_0%,#102144_55%,#2d3133_100%)] text-sidebar-foreground shadow-[18px_0_48px_-30px_rgba(8,18,37,0.55)] md:flex">
        {content}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[rgba(8,18,37,0.48)] backdrop-blur-sm"
            onClick={() => onMobileOpenChange?.(false)}
            aria-label="Close mobile menu overlay"
          />
          <aside
            id="mobile-sidebar"
            className="relative z-10 flex h-full w-72 flex-col bg-[linear-gradient(180deg,#00174b_0%,#102144_55%,#2d3133_100%)] shadow-2xl"
          >
            {content}
          </aside>
        </div>
      ) : null}
    </>
  );
}
