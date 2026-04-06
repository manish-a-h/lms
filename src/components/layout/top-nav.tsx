"use client";

import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

type TopNavProps = {
  userName: string;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
};

export function TopNav({
  userName,
  mobileMenuOpen,
  onToggleMobileMenu,
}: TopNavProps) {
  const initials = userName
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-10 mx-3 mt-3 flex h-[4.5rem] w-auto items-center justify-between rounded-[1.5rem] bg-white/72 px-4 shadow-[0_20px_40px_-28px_rgba(25,28,30,0.35)] ring-1 ring-black/5 backdrop-blur-xl md:mx-4 md:px-6 lg:mx-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Toggle mobile menu"
          aria-controls="mobile-sidebar"
          aria-expanded={mobileMenuOpen}
          onClick={onToggleMobileMenu}
        >
          <Menu className="w-5 h-5" />
          <span className="sr-only">Toggle mobile menu</span>
        </Button>
        <div className="leading-tight">
          <p className="hidden text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground md:block">
            Workspace
          </p>
          <span className="font-heading text-base font-semibold text-foreground md:text-lg">HRMS Portal</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative bg-white/55" aria-label="Notifications">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive" />
        </Button>

        <div className="flex items-center gap-2 rounded-full bg-muted/75 px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,#004ac6,#2b6ff0)] text-xs font-bold text-white"
            title={userName}
          >
            {initials}
          </div>
          <span className="hidden md:block text-sm font-medium text-foreground">{userName}</span>
        </div>
      </div>
    </header>
  );
}
