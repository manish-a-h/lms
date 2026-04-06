import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { verifyAccessToken } from "@/lib/auth";
import { getSalarySlipDetail } from "@/lib/data/salary";
import { SalarySlipDetail } from "@/components/salary/salary-slip-detail";

export default async function SalarySlipPage({
  params,
}: {
  params: Promise<{ slipId: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const sessionUser = await verifyAccessToken(token).catch(() => null);
  if (!sessionUser) {
    redirect("/login");
  }

  const { slipId } = await params;
  const slip = await getSalarySlipDetail(sessionUser.sub, slipId);

  if (!slip) {
    redirect("/salary");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header — hidden in print */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <p className="eyebrow-label">Salary</p>
          <h1 className="editorial-title text-2xl font-bold text-foreground">
            Pay Slip Detail
          </h1>
        </div>
        <Link
          href="/salary"
          className="inline-flex items-center gap-2 rounded-md bg-white/75 px-4 py-2 text-sm font-medium text-foreground ring-1 ring-black/5 transition hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Salary
        </Link>
      </div>

      <SalarySlipDetail slip={slip} />
    </div>
  );
}
