"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";

type DashboardShellProps = {
  children: React.ReactNode;
  userName: string;
  userRole: string;
};

export function DashboardShell({
  children,
  userName,
  userRole,
}: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar
        userRole={userRole}
        mobileOpen={mobileMenuOpen}
        onMobileOpenChange={setMobileMenuOpen}
      />

      <div className="flex h-full w-full flex-1 flex-col bg-[linear-gradient(180deg,rgba(247,249,251,0.88),rgba(242,244,246,0.72))]">
        <TopNav
          userName={userName}
          mobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={() => setMobileMenuOpen((open) => !open)}
        />

        <main
          className="flex-1 overflow-auto px-4 pb-8 pt-4 md:px-6 lg:px-8"
          onClick={() => {
            if (mobileMenuOpen) {
              setMobileMenuOpen(false);
            }
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
