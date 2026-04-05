import { cookies } from "next/headers";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyAccessToken } from "@/lib/auth";

export async function TopNav() {
  // Read user from cookie server-side
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  let userName = "User";
  if (token) {
    try {
      const payload = await verifyAccessToken(token);
      userName = payload.name ?? "User";
    } catch {
      // ignore expired token — middleware handles redirect
    }
  }

  const initials = userName
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 w-full">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Toggle mobile menu">
          <Menu className="w-5 h-5" />
          <span className="sr-only">Toggle mobile menu</span>
        </Button>
        <span className="font-semibold md:hidden">HRMS Portal</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="w-5 h-5" />
          {/* Unread indicator — replace with real count when notifications model is ready */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        {/* User avatar with initials */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full bg-[#2E75B6] flex items-center justify-center text-xs font-bold text-white"
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
