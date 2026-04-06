import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LeaveApplyWizard } from "@/components/leave/leave-apply-wizard";
import { verifyAccessToken } from "@/lib/auth";
import { getHolidays, getLeaveOverview, getLeaveTypes } from "@/lib/data/leave";

export default async function LeaveApplyPage() {
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
  const [leaveTypes, leaveOverview, holidays] = await Promise.all([
    getLeaveTypes(),
    getLeaveOverview(sessionUser.sub, currentYear),
    getHolidays(currentYear),
  ]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="space-y-3">
        <Link
          href="/leave"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#2E75B6] hover:text-[#1E3A5F]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to leave overview
        </Link>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Apply for leave</h1>
          <p className="text-sm text-muted-foreground">
            Complete the 4-step flow to submit your leave request with balance and holiday checks.
          </p>
        </div>
      </div>

      <LeaveApplyWizard
        leaveTypes={leaveTypes}
        holidays={holidays}
        balanceCards={leaveOverview.balanceCards}
      />
    </div>
  );
}
