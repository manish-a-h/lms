import Link from "next/link";
import { 
  Briefcase, 
  LayoutDashboard, 
  UserCircle, 
  Settings, 
  LogOut,
  Calendar,
  Wallet
} from "lucide-react";

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leave', label: 'Leave', icon: Calendar },
  { href: '/salary', label: 'Salary', icon: Wallet },
  { href: '/profile', label: 'Profile', icon: UserCircle },
  { href: '/admin', label: 'Admin Panel', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-border bg-sidebar hidden md:flex flex-col h-full">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <h1 className="font-bold text-xl text-sidebar-foreground flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-primary" />
          HRMS Portal
        </h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground"
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <form method="post" action="/logout">
          <button type="submit" className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
}
