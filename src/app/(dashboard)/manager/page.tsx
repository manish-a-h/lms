import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AlertTriangle, CalendarDays, ClipboardList, ShieldCheck } from "lucide-react";
import { HrCalendar } from "@/components/admin/hr-calendar";
import { ManagerApprovalActions } from "@/components/leave/manager-approval-actions";
import { LeaveStatusBadge } from "@/components/leave/leave-status-badge";
import { verifyAccessToken } from "@/lib/auth";
import { getPendingLeaveRequests, getTeamConflictWarnings } from "@/lib/data/leave";

export default async function ManagerPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const sessionUser = await verifyAccessToken(token).catch(() => null);
  if (!sessionUser || !["manager", "hr_admin"].includes(sessionUser.role)) {
    redirect("/dashboard");
  }

  const [pendingRequests, conflictWarnings] = await Promise.all([
    getPendingLeaveRequests(sessionUser.role === "manager" ? sessionUser.sub : undefined),
    getTeamConflictWarnings(sessionUser.role === "manager" ? sessionUser.sub : undefined),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="atelier-panel-muted flex flex-col gap-3 p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div>
          <p className="eyebrow-label">Approval desk</p>
          <h1 className="editorial-title text-3xl font-bold text-foreground">Manager approvals</h1>
          <p className="text-sm text-muted-foreground">
            Review pending leave requests, act quickly, and watch for team conflicts.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="atelier-panel p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Pending approvals</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{pendingRequests.length}</p>
        </div>
        <div className="atelier-panel p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Team conflicts</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{conflictWarnings.length}</p>
        </div>
        <div className="atelier-panel p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Approval mode</p>
          <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            {sessionUser.role === "hr_admin" ? "HR Admin override" : "Manager review"}
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-[#2E75B6]" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">Team availability calendar</h2>
            <p className="text-sm text-muted-foreground">
              Shared visibility for managers and HR admins across leave and holiday schedules.
            </p>
          </div>
        </div>
        <HrCalendar />
      </section>

      <section className="atelier-panel p-6">
        <div className="mb-4 flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-[#2E75B6]" />
          <h2 className="text-lg font-semibold text-foreground">Pending requests</h2>
        </div>

        {pendingRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pending approvals yet for your assigned team.
          </p>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div key={request.id} className="atelier-panel-muted p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{request.user.name}</p>
                      <LeaveStatusBadge status={request.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {request.leaveType.name} • {request.noOfDays} day(s) • {request.user.department ?? "Department pending"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(request.startDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })} to {new Date(request.endDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-foreground">{request.reason}</p>
                  </div>

                  <ManagerApprovalActions requestId={request.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <h2 className="text-lg font-semibold text-foreground">Conflict warnings</h2>
        </div>

        {conflictWarnings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No upcoming dates currently show 3 or more overlapping team leave requests.
          </p>
        ) : (
          <div className="space-y-3">
            {conflictWarnings.map((warning) => (
              <div key={warning.date} className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
                <span className="font-medium text-amber-900">{warning.date}</span>
                <span className="text-amber-800">{warning.count} team members overlap</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
