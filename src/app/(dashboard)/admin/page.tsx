import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Activity, CalendarDays, FileBarChart2, ShieldCheck, Users } from "lucide-react";
import { verifyAccessToken } from "@/lib/auth";
import { getAdminOverview } from "@/lib/data/admin";
import { AccessManagementPanel } from "@/components/admin/access-management-panel";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const sessionUser = await verifyAccessToken(token).catch(() => null);
  if (!sessionUser || sessionUser.role !== "hr_admin") {
    redirect("/dashboard");
  }

  const overview = await getAdminOverview();

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="atelier-panel-muted p-5 md:p-6">
        <p className="eyebrow-label">HR command center</p>
        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="editorial-title text-3xl font-bold text-foreground">HR admin overview</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Manage access, review leave activity, maintain holidays, and keep the workforce dashboard organized from one place.
            </p>
          </div>
          <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-muted-foreground ring-1 ring-black/5">
            {overview.pendingApprovals.length} pending request{overview.pendingApprovals.length === 1 ? "" : "s"}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <div className="atelier-panel p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Total users</p>
          <p className="mt-2 flex items-center gap-2 text-3xl font-bold text-foreground">
            <Users className="h-5 w-5 text-[#2E75B6]" />
            {overview.totalUsers}
          </p>
        </div>
        <div className="atelier-panel p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Active employees</p>
          <p className="mt-2 flex items-center gap-2 text-3xl font-bold text-foreground">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            {overview.activeUsersCount}
          </p>
        </div>
        <div className="atelier-panel p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Leave policies</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{overview.leaveTypes.length}</p>
        </div>
        <div className="atelier-panel p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Approved emails</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{overview.approvedEmails.filter((item) => item.isActive).length}</p>
        </div>
      </section>

      <AccessManagementPanel approvedEmails={overview.approvedEmails} users={overview.users} />

      <section className="grid items-start gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#2E75B6]" />
              <h2 className="text-lg font-semibold text-foreground">Leave policies</h2>
            </div>
            <div className="space-y-3">
              {overview.leaveTypes.map((leaveType) => (
                <div key={leaveType.id} className="atelier-panel-muted p-3 text-sm">
                  <p className="font-medium text-foreground">{leaveType.name}</p>
                  <p className="text-muted-foreground">
                    {leaveType.maxDaysPerYear} day(s) / year • {leaveType.carryForward ? "Carry forward enabled" : "No carry forward"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[#2E75B6]" />
              <h2 className="text-lg font-semibold text-foreground">Upcoming public holidays</h2>
            </div>
            <div className="space-y-3">
              {overview.holidays.slice(0, 4).map((holiday) => (
                <div key={holiday.id} className="atelier-panel-muted p-3 text-sm">
                  <p className="font-medium text-foreground">{holiday.name}</p>
                  <p className="text-muted-foreground">
                    {new Date(holiday.date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#2E75B6]" />
              <h2 className="text-lg font-semibold text-foreground">Recent activity log</h2>
            </div>

            {overview.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Activity entries will appear here as leave, user, and policy actions are performed.
              </p>
            ) : (
              <div className="space-y-3">
                {overview.recentActivity.map((entry) => (
                  <div key={entry.id} className="atelier-panel-muted p-4 text-sm">
                    <p className="font-medium text-foreground">{entry.message}</p>
                    <p className="text-muted-foreground">
                      {entry.actor?.name ?? "System"} • {new Date(entry.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <FileBarChart2 className="h-5 w-5 text-[#2E75B6]" />
              <h2 className="text-lg font-semibold text-foreground">Reports</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Date-filtered reporting and export flows can now build cleanly on this improved admin layout.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
