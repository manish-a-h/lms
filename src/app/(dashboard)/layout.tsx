import { cookies } from "next/headers";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { verifyAccessToken } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  let userName = "User";
  let userRole = "employee";

  if (token) {
    try {
      const payload = await verifyAccessToken(token);
      userName = payload.name ?? "User";
      userRole = payload.role ?? "employee";
    } catch {
      // Middleware handles redirecting invalid sessions.
    }
  }

  return (
    <DashboardShell userName={userName} userRole={userRole}>
      {children}
    </DashboardShell>
  );
}
