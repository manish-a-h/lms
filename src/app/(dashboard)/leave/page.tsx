import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, ClipboardList, PlusCircle } from "lucide-react";
import { CancelLeaveButton } from "@/components/leave/cancel-leave-button";
import { LeaveStatusBadge } from "@/components/leave/leave-status-badge";
import { verifyAccessToken } from "@/lib/auth";
import { getLeaveOverview, getUserLeaveHistory } from "@/lib/data/leave";

export default async function LeavePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const sessionUser = await verifyAccessToken(token).catch(() => null);
  if (!sessionUser) {
    redirect("/login");
  }

  const currentYear = new Date().getFullYear();
  const [leaveOverview, leaveHistory] = await Promise.all([
    getLeaveOverview(sessionUser.sub, currentYear),
    getUserLeaveHistory(sessionUser.sub, 1, 8),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="atelier-panel-muted flex flex-col gap-3 p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div>
          <p className="eyebrow-label">Leave workspace</p>
          <h1 className="editorial-title text-3xl font-bold text-foreground">Leave management</h1>
          <p className="text-sm text-muted-foreground">
            Apply for leave, review your balance, and track your recent requests.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {sessionUser.role === "manager" || sessionUser.role === "hr_admin" ? (
            <Link
              href="/manager"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-white/75 px-4 py-2 text-sm font-medium text-foreground ring-1 ring-black/5 transition hover:bg-white"
            >
              <ClipboardList className="h-4 w-4" />
              Manager approvals
            </Link>
          ) : null}

          <Link
            href="/leave/apply"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[linear-gradient(135deg,#004ac6,#2b6ff0)] px-4 py-2 text-sm font-semibold text-white shadow-[0_18px_30px_-18px_rgba(0,74,198,0.55)] transition hover:-translate-y-0.5"
          >
            <PlusCircle className="h-4 w-4" />
            Apply for leave
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {leaveOverview.balanceCards.map((balance) => (
          <div key={balance.id} className="atelier-panel p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{balance.name}</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{balance.remaining}</p>
            <p className="text-xs text-muted-foreground">days remaining</p>
            <div className="mt-4 space-y-1 text-sm text-muted-foreground">
              <p>Total: {balance.total}</p>
              <p>Used: {balance.used}</p>
              <p>Pending: {balance.pending}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="atelier-panel p-6">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-[#2E75B6]" />
          <h2 className="text-lg font-semibold text-foreground">Recent leave history</h2>
        </div>

        {leaveHistory.requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No leave requests yet. Use the apply flow to submit your first request.
          </p>
        ) : (
          <div className="space-y-3">
            {leaveHistory.requests.map((request) => (
              <div key={request.id} className="atelier-panel-muted p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{request.leaveType.name}</p>
                      <LeaveStatusBadge status={request.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(request.startDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })} to {new Date(request.endDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })} • {request.noOfDays} day(s)
                    </p>
                    <p className="text-sm text-foreground">{request.reason}</p>
                  </div>

                  {request.status === "pending" ? (
                    <CancelLeaveButton requestId={request.id} />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
