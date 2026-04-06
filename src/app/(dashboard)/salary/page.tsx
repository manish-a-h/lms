import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  FileText,
  ArrowRight,
} from "lucide-react";
import { verifyAccessToken } from "@/lib/auth";
import { getSalaryComponents, getSalarySlips } from "@/lib/data/salary";
import { SalaryFilter } from "@/components/salary/salary-filter";

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

export default async function SalaryPage({
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
  const selectedYear = params.year ? parseInt(params.year, 10) : currentYear;
  const year = isNaN(selectedYear) ? currentYear : selectedYear;

  const [salaryStructure, salarySlips] = await Promise.all([
    getSalaryComponents(sessionUser.sub),
    getSalarySlips(sessionUser.sub, year),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div className="atelier-panel-muted flex flex-col gap-4 p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div>
          <p className="eyebrow-label">Compensation</p>
          <h1 className="editorial-title text-3xl font-bold text-foreground">
            Salary & Payslips
          </h1>
          <p className="text-sm text-muted-foreground">
            View your salary structure, download payslips, and access tax
            documents.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/salary/form16?year=${year - 1}`}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-white/75 px-4 py-2 text-sm font-medium text-foreground ring-1 ring-black/5 transition hover:bg-white"
          >
            <FileText className="h-4 w-4" />
            Form-16
          </Link>
          <Link
            href={`/salary/form16/provisional?year=${year}`}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-white/75 px-4 py-2 text-sm font-medium text-foreground ring-1 ring-black/5 transition hover:bg-white"
          >
            <FileText className="h-4 w-4" />
            Provisional Form-16
          </Link>
        </div>
      </div>

      {/* Salary Structure */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
          <Wallet className="h-4 w-4 text-primary" />
          Salary Structure
        </h2>

        {salaryStructure.earnings.length === 0 &&
        salaryStructure.deductions.length === 0 ? (
          <div className="atelier-panel p-8 text-center text-sm text-muted-foreground">
            No salary components configured yet. Contact HR to set up your
            salary structure.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Earnings */}
            <div className="atelier-panel p-5">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground mb-3">
                <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                Earnings
              </h3>
              <div className="space-y-0">
                {salaryStructure.earnings.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between py-2 text-sm"
                  >
                    <span className="text-foreground">
                      {item.componentName}
                    </span>
                    <span className="font-medium tabular-nums text-foreground">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
                <div
                  className="flex justify-between pt-2 text-sm font-semibold"
                  style={{
                    borderTop: "1px solid rgba(84,95,115,0.18)",
                  }}
                >
                  <span>Gross Earnings</span>
                  <span className="tabular-nums text-green-700">
                    {formatCurrency(salaryStructure.totalEarnings)}
                  </span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="atelier-panel p-5">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground mb-3">
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                Deductions
              </h3>
              <div className="space-y-0">
                {salaryStructure.deductions.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between py-2 text-sm"
                  >
                    <span className="text-foreground">
                      {item.componentName}
                    </span>
                    <span className="font-medium tabular-nums text-foreground">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
                <div
                  className="flex justify-between pt-2 text-sm font-semibold"
                  style={{
                    borderTop: "1px solid rgba(84,95,115,0.18)",
                  }}
                >
                  <span>Total Deductions</span>
                  <span className="tabular-nums text-destructive">
                    {formatCurrency(salaryStructure.totalDeductions)}
                  </span>
                </div>
              </div>
            </div>

            {/* Net Summary */}
            <div className="atelier-panel p-5 flex flex-col justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground mb-3">
                  <Receipt className="h-3.5 w-3.5 text-primary" />
                  Net Monthly Pay
                </h3>
                <p className="text-4xl font-bold text-primary tabular-nums mt-4">
                  {formatCurrency(salaryStructure.netSalary)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  per month after deductions
                </p>
              </div>

              <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Gross</span>
                  <span className="tabular-nums">
                    {formatCurrency(salaryStructure.totalEarnings)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Deductions</span>
                  <span className="tabular-nums">
                    −{formatCurrency(salaryStructure.totalDeductions)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Salary Slips */}
      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Receipt className="h-4 w-4 text-primary" />
            Salary Slips — {year}
          </h2>
          <SalaryFilter currentYear={currentYear} />
        </div>

        {salarySlips.length === 0 ? (
          <div className="atelier-panel p-8 text-center text-sm text-muted-foreground">
            No salary slips available for {year}. Slips will appear here once
            generated by HR.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {salarySlips.map((slip) => (
              <Link
                key={slip.id}
                href={`/salary/slips/${slip.id}`}
                className="atelier-panel p-5 group transition hover:-translate-y-0.5 hover:shadow-[0_28px_60px_-34px_rgba(25,28,30,0.38)]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      {monthNames[slip.month - 1]} {slip.year}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-foreground tabular-nums">
                      {formatCurrency(slip.netSalary)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Gross: {formatCurrency(slip.grossSalary)}
                    </p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/60 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Generated:{" "}
                  {new Date(slip.generatedAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
