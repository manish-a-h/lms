import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Printer } from "lucide-react";
import { verifyAccessToken } from "@/lib/auth";
import { getForm16Data } from "@/lib/data/salary";
import { Form16PrintButton } from "@/components/salary/form16-print-button";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

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
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <p className="eyebrow-label">Tax Documents</p>
          <h1 className="editorial-title text-2xl font-bold text-foreground">
            IT Form-16
          </h1>
          <p className="text-sm text-muted-foreground">
            Annual tax statement for FY {data.financialYear}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Year Selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="form16-year" className="text-xs text-muted-foreground">
              FY:
            </label>
            {years.map((y) => (
              <Link
                key={y}
                href={`/salary/form16?year=${y}`}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  y === year
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-white/70 text-foreground ring-1 ring-black/5 hover:bg-white"
                }`}
              >
                {y}-{y + 1}
              </Link>
            ))}
          </div>

          <Link
            href="/salary"
            className="inline-flex items-center gap-2 rounded-md bg-white/75 px-3 py-1.5 text-xs font-medium text-foreground ring-1 ring-black/5 transition hover:bg-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        </div>
      </div>

      {/* Form-16 Content */}
      <div className="atelier-panel p-6 print:shadow-none print:ring-0 print:bg-white print:rounded-none" id="form16-print">
        {/* Title */}
        <div className="text-center mb-6 pb-4" style={{ borderBottom: "2px solid #004ac6" }}>
          <h2 className="font-heading text-xl font-bold text-foreground">
            Form 16 — Certificate under Section 203 of the Income Tax Act
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Financial Year: {data.financialYear} | Assessment Year: {year + 1}-{year + 2}
          </p>
        </div>

        {/* Employee Details */}
        {data.user && (
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div className="space-y-1.5">
              <p><span className="text-muted-foreground">Name:</span> <span className="font-medium">{data.user.name}</span></p>
              <p><span className="text-muted-foreground">Department:</span> <span className="font-medium">{data.user.department ?? "—"}</span></p>
              <p><span className="text-muted-foreground">Designation:</span> <span className="font-medium">{data.user.designation ?? "—"}</span></p>
            </div>
            <div className="space-y-1.5 text-right">
              <p><span className="text-muted-foreground">PAN:</span> <span className="font-medium">{data.user.panNo ?? "—"}</span></p>
              <p><span className="text-muted-foreground">Employer:</span> <span className="font-medium">{data.user.institution ?? "NITTE University"}</span></p>
            </div>
          </div>
        )}

        {data.slips.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No salary data available for FY {data.financialYear}.
          </div>
        ) : (
          <>
            {/* Monthly Breakdown */}
            <section className="mb-8">
              <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground mb-3">
                Monthly Salary Summary
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/80">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Month</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Gross Salary</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Net Salary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.slips.map((slip, i) => (
                      <tr key={`${slip.month}-${slip.year}`} className={i % 2 === 1 ? "bg-muted/30" : ""}>
                        <td className="px-4 py-2 font-medium">{monthNames[slip.month - 1]} {slip.year}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(slip.grossSalary)}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(slip.netSalary)}</td>
                      </tr>
                    ))}
                    <tr className="font-semibold" style={{ borderTop: "2px solid rgba(84,95,115,0.18)" }}>
                      <td className="px-4 py-2.5">Total</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{formatCurrency(data.totalGross)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-primary">{formatCurrency(data.totalNet)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

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
          </>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground print:mt-8">
          This is a computer-generated Form 16. No signature required.
        </p>
      </div>

      {/* Print Button */}
      <div className="print:hidden">
        <Form16PrintButton />
      </div>
    </div>
  );
}
