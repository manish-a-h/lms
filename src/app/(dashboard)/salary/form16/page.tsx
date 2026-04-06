import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Printer } from "lucide-react";
import { verifyAccessToken } from "@/lib/auth";
import { getForm16Data } from "@/lib/data/salary";
import { Form16Layout } from "@/components/salary/form16-layout";
import { formatCurrency } from "@/lib/format";

export default async function Form16Page({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
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

  const params = await searchParams;
  const currentYear = new Date().getFullYear();
  const defaultStartYear = currentYear - 1;
  const startYear = params.year
    ? parseInt(params.year, 10)
    : defaultStartYear;
  const year = isNaN(startYear) ? defaultStartYear : startYear;

  const data = await getForm16Data(sessionUser.sub, year);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 1 - i);

  return (
    <Form16Layout
      title="IT Form-16"
      subtitle={`Annual tax statement for FY ${data.financialYear}`}
      year={year}
      years={years}
      data={data}
      basePath="/salary/form16"
    >
      {/* Annual Component Breakdown */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground mb-3">
            Annual Earnings
          </h3>
          {data.earningsTotals.map((item) => (
            <div key={item.name} className="flex justify-between py-1.5 text-sm">
              <span>{item.name}</span>
              <span className="font-medium tabular-nums">{formatCurrency(item.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 text-sm font-semibold" style={{ borderTop: "1px solid rgba(84,95,115,0.18)" }}>
            <span>Total Earnings</span>
            <span className="tabular-nums text-green-700">{formatCurrency(data.totalGross)}</span>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground mb-3">
            Annual Deductions
          </h3>
          {data.deductionsTotals.map((item) => (
            <div key={item.name} className="flex justify-between py-1.5 text-sm">
              <span>{item.name}</span>
              <span className="font-medium tabular-nums">{formatCurrency(item.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 text-sm font-semibold" style={{ borderTop: "1px solid rgba(84,95,115,0.18)" }}>
            <span>Total Deductions</span>
            <span className="tabular-nums text-destructive">{formatCurrency(data.totalDeductions)}</span>
          </div>
        </div>
      </div>

      {/* Tax Summary */}
      <div className="rounded-xl bg-accent/40 p-5">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-3">Tax Computation Summary</h3>
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gross Salary (Annual)</span>
            <span className="font-medium tabular-nums">{formatCurrency(data.totalGross)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Deductions</span>
            <span className="font-medium tabular-nums">−{formatCurrency(data.totalDeductions)}</span>
          </div>
          <div className="flex justify-between pt-2 font-semibold text-base" style={{ borderTop: "1px solid rgba(84,95,115,0.18)" }}>
            <span>Net Taxable Income</span>
            <span className="text-primary tabular-nums">{formatCurrency(data.totalNet)}</span>
          </div>
        </div>
      </div>
    </Form16Layout>
  );
}
