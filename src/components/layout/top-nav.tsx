import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TopNav() {
  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 w-full">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-5 h-5" />
          <span className="sr-only">Toggle mobile menu</span>
          {/* TODO: Wire this Button to a toggleSidebar prop/context provided by DashboardLayout */}
        </Button>
        <span className="font-semibold md:hidden">HRMS Portal</span>
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full"></span>
          <span className="sr-only">Notifications</span>
        </Button>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
          JD
        </div>
      </div>
    </header>
  );
}
