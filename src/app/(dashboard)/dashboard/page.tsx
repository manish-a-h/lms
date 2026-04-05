import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "@/lib/auth";
import { getLeaveBalances, getRecentLeaveRequests, getLeaveTypes, getUpcomingApprovedLeaves } from "@/lib/data/leave";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
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
}: {
  name: string;
  total: number;
  used: number;
  remaining: number;
}) {
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">{name}</p>
          <p className="mt-1 text-2xl font-bold text-[#111827]">{remaining}</p>
          <p className="text-xs text-[#6B7280]">days remaining</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-[#BDD7EE] flex items-center justify-center">
          <CalendarDays className="w-5 h-5 text-[#2E75B6]" />
        </div>
      </div>
      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-[#6B7280] mb-1">
          <span>{used} used</span>
          <span>{total} total</span>
        </div>
        <div className="h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#2E75B6] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  // Read session from cookie (server-side)
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  let sessionUser: { sub: string; name: string; email: string; role: string } | null = null;
  if (token) {
    try {
      const payload = await verifyAccessToken(token);
      sessionUser = payload as typeof sessionUser;
    } catch {
      redirect("/login");
    }
  } else {
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

  // Merge leave types with balance data
  const balanceCards = leaveTypes.map((lt) => {
    const b = balances.find((b) => b.leaveTypeId === lt.id);
    return {
      id: lt.id,
      name: lt.name,
      total: b?.totalDays ?? lt.maxDaysPerYear,
      used: b?.usedDays ?? 0,
      remaining: (b?.totalDays ?? lt.maxDaysPerYear) - (b?.usedDays ?? 0),
    };
  });

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
    <div className="space-y-8 max-w-[1280px] mx-auto">

      {/* ── Welcome Block ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#2E75B6] flex items-center justify-center text-white font-bold text-lg shrink-0">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
              Welcome back, {sessionUser.name.split(" ")[0]}!
            </h1>
            <p className="text-sm text-[#6B7280]">{dateStr}</p>
          </div>
        </div>
        <Link
          href="/leave/apply"
          id="apply-leave-cta"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2E75B6] text-white text-sm font-semibold hover:bg-[#1E3A5F] transition-colors shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Apply for Leave
        </Link>
      </div>

      {/* ── Leave Balance Cards ── */}
      <section>
        <h2 className="text-base font-semibold text-[#111827] mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#2E75B6]" />
          Leave Balances — {currentYear}
        </h2>
        {balanceCards.length === 0 ? (
          <div className="text-sm text-[#6B7280] bg-white border border-[#E5E7EB] rounded-xl p-8 text-center">
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
            <h2 className="text-base font-semibold text-[#111827] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#2E75B6]" />
              Recent Leave Requests
            </h2>
            <Link
              href="/leave"
              className="text-xs text-[#2E75B6] hover:text-[#1E3A5F] font-medium transition"
            >
              View all →
            </Link>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
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
                    <tr className="bg-[#BDD7EE]/30 border-b border-[#E5E7EB]">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wide">From</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wide">To</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Days</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRequests.map((req, i) => (
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
            <h2 className="text-base font-semibold text-[#111827] mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#70AD47]" />
              Upcoming Leaves
            </h2>
            <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] divide-y divide-[#E5E7EB]">
              {upcomingLeaves.length === 0 ? (
                <div className="p-6 text-center text-sm text-[#6B7280]">
                  No upcoming approved leaves.
                </div>
              ) : (
                upcomingLeaves.map((lv) => (
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
            <h2 className="text-base font-semibold text-[#111827] mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#2E75B6]" />
              Notifications
            </h2>
            <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] divide-y divide-[#E5E7EB]">
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
