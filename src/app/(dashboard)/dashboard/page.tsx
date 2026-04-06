import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "@/lib/auth";
import { getLeaveBalances, getRecentLeaveRequests, getLeaveTypes, getUpcomingApprovedLeaves } from "@/lib/data/leave";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  PlusCircle,
  TrendingUp,
  Bell,
  Calendar,
} from "lucide-react";
import Link from "next/link";

// ─── Status badge colours from DRD ──────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    pending:   { bg: "bg-orange-100",  text: "text-orange-700",  label: "Pending"   },
    approved:  { bg: "bg-green-100",   text: "text-green-700",   label: "Approved"  },
    rejected:  { bg: "bg-red-100",     text: "text-red-700",     label: "Rejected"  },
    cancelled: { bg: "bg-gray-100",    text: "text-gray-600",    label: "Cancelled" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

// ─── Leave Balance Card ───────────────────────────────────────────────────────
function BalanceCard({
  name,
  total,
  used,
  remaining,
  hasBalance,
}: {
  name: string;
  total: number;
  used: number;
  remaining: number;
  hasBalance: boolean;
}) {
  const pct = hasBalance && total > 0 ? Math.round((used / total) * 100) : 0;

  return (
    <div className="atelier-panel flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">{name}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {hasBalance ? remaining : "—"}
          </p>
          <p className="text-xs text-muted-foreground">
            {hasBalance ? "days remaining" : "Not initialised yet"}
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,rgba(0,74,198,0.12),rgba(0,123,113,0.12))]">
          <CalendarDays className="h-5 w-5 text-primary" />
        </div>
      </div>

      {hasBalance ? (
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>{used} used</span>
            <span>{total} total</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[linear-gradient(135deg,#004ac6,#2b6ff0)] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Contact HR to initialise this leave balance.
        </p>
      )}
    </div>
  );
}

type DashboardSessionUser = {
  sub: string;
  name: string;
  email: string;
  role: string;
  jti: string;
};

type DashboardLeaveType = {
  id: string;
  name: string;
};

type DashboardBalance = {
  leaveTypeId: string;
  totalDays: number;
  usedDays: number;
};

type DashboardRequest = {
  id: string;
  startDate: Date | string;
  endDate: Date | string;
  noOfDays: number;
  status: string;
  leaveType: { name: string };
};

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  // Read session from cookie (server-side)
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    redirect("/login");
  }

  let sessionUser: DashboardSessionUser;
  try {
    sessionUser = await verifyAccessToken(token);
  } catch {
    redirect("/login");
  }

  const currentYear = new Date().getFullYear();

  // Fetch data in parallel
  const [leaveTypes, balances, recentRequests, upcomingLeaves] = await Promise.all([
    getLeaveTypes(),
    getLeaveBalances(sessionUser.sub, currentYear),
    getRecentLeaveRequests(sessionUser.sub, 5),
    getUpcomingApprovedLeaves(sessionUser.sub),
  ]);

  const typedLeaveTypes = leaveTypes as DashboardLeaveType[];
  const typedBalances = balances as DashboardBalance[];
  const typedRecentRequests = recentRequests as DashboardRequest[];
  const typedUpcomingLeaves = upcomingLeaves as DashboardRequest[];

  // Merge leave types with balance data
  const balanceCards = typedLeaveTypes.map((lt) => {
    const balance = typedBalances.find((entry) => entry.leaveTypeId === lt.id);
    const total = balance?.totalDays ?? 0;
    const used = balance?.usedDays ?? 0;

    return {
      id: lt.id,
      name: lt.name,
      total,
      used,
      remaining: total - used,
      hasBalance: Boolean(balance),
    };
  });

  const hasAnyBalance = balanceCards.some((balance) => balance.hasBalance);

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Initials from name
  const initials = sessionUser.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto max-w-7xl space-y-10">

      {/* ── Welcome Block ── */}
      <div className="atelier-panel-muted flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#004ac6,#2b6ff0)] text-lg font-bold text-white shadow-[0_18px_30px_-18px_rgba(0,74,198,0.55)]">
            {initials}
          </div>
          <div>
            <p className="eyebrow-label">Today</p>
            <h1 className="editorial-title text-2xl font-bold text-foreground">
              Welcome back, {sessionUser.name.split(" ")[0]}!
            </h1>
            <p className="text-sm text-muted-foreground">{dateStr}</p>
          </div>
        </div>
        <Link
          href="/leave/apply"
          id="apply-leave-cta"
          className="inline-flex items-center gap-2 rounded-md bg-[linear-gradient(135deg,#004ac6,#2b6ff0)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_18px_30px_-18px_rgba(0,74,198,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_34px_-18px_rgba(0,74,198,0.45)]"
        >
          <PlusCircle className="w-4 h-4" />
          Apply for Leave
        </Link>
      </div>

      {/* ── Leave Balance Cards ── */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
          <TrendingUp className="w-4 h-4 text-primary" />
          Leave Balances — {currentYear}
        </h2>
        {!hasAnyBalance ? (
          <div className="atelier-panel p-8 text-center text-sm text-muted-foreground">
            No leave balances found. Contact HR to initialise your leave balance.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {balanceCards.map((b) => (
              <BalanceCard key={b.id} {...b} />
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Recent Leave Requests (2/3 width) ── */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Clock className="w-4 h-4 text-primary" />
              Recent Leave Requests
            </h2>
            <Link
              href="/leave"
              className="text-xs text-[#2E75B6] hover:text-[#1E3A5F] font-medium transition"
            >
              View all →
            </Link>
          </div>

          <div className="atelier-panel overflow-hidden">
            {recentRequests.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#6B7280]">
                No leave requests yet.{" "}
                <Link href="/leave/apply" className="text-[#2E75B6] hover:underline">
                  Apply for your first leave.
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/80">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wide">From</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wide">To</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Days</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {typedRecentRequests.map((req, i: number) => (
                      <tr
                        key={req.id}
                        className={`border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB] transition-colors ${
                          i % 2 === 1 ? "bg-[#F9FAFB]" : "bg-white"
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-[#111827]">
                          {req.leaveType.name}
                        </td>
                        <td className="px-4 py-3 text-[#6B7280]">
                          {new Date(req.startDate).toLocaleDateString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3 text-[#6B7280]">
                          {new Date(req.endDate).toLocaleDateString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3 text-[#111827]">{req.noOfDays}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={req.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* ── Right Column ── */}
        <div className="space-y-6">

          {/* Upcoming Approved Leaves */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
              <CheckCircle2 className="w-4 h-4 text-[#007b71]" />
              Upcoming Leaves
            </h2>
            <div className="atelier-panel overflow-hidden">
              {upcomingLeaves.length === 0 ? (
                <div className="p-6 text-center text-sm text-[#6B7280]">
                  No upcoming approved leaves.
                </div>
              ) : (
                typedUpcomingLeaves.map((lv) => (
                  <div key={lv.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-[#70AD47]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#111827] truncate">
                        {lv.leaveType.name}
                      </p>
                      <p className="text-xs text-[#6B7280]">
                        {new Date(lv.startDate).toLocaleDateString("en-IN", {
                          day: "2-digit", month: "short",
                        })}{" "}
                        —{" "}
                        {new Date(lv.endDate).toLocaleDateString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </p>
                    </div>
                    <span className="ml-auto text-xs font-semibold text-[#70AD47]">
                      {lv.noOfDays}d
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Notifications Panel */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
              <Bell className="w-4 h-4 text-primary" />
              Notifications
            </h2>
            <div className="atelier-panel overflow-hidden">
              <div className="p-6 text-center text-sm text-[#6B7280]">
                No new notifications.
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
