import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Form16PrintButton } from "@/components/salary/form16-print-button";
import { monthNames, formatCurrency } from "@/lib/format";

interface Form16User {
  name: string;
  department: string | null;
  designation: string | null;
  panNo: string | null;
  institution: string | null;
}

interface Form16Slip {
  month: number;
  year: number;
  grossSalary: number;
  netSalary: number;
}

interface Form16Data {
  financialYear: string;
  user?: Form16User | null;
  slips?: Form16Slip[];
  totalGross: number;
  totalNet: number;
}

export function Form16Layout({
  title,
  subtitle,
  watermarkText,
  year,
  years,
  data,
  basePath,
  children,
}: {
  title: string;
  subtitle: string;
  watermarkText?: string;
  year: number;
  years: number[];
  data: Form16Data;
  basePath: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <p className="eyebrow-label">Tax Documents</p>
          <h1 className="editorial-title text-2xl font-bold text-foreground">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {years.length > 0 && (
            <div className="flex items-center gap-2">
              {!watermarkText && (
                <label htmlFor="form16-year" className="text-xs text-muted-foreground">
                  FY:
                </label>
              )}
              {years.map((y) => (
                <Link
                  key={y}
                  href={`${basePath}?year=${y}`}
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
          )}

          <Link
            href="/salary"
            className="inline-flex items-center gap-2 rounded-md bg-white/75 px-3 py-1.5 text-xs font-medium text-foreground ring-1 ring-black/5 transition hover:bg-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        </div>
      </div>

      <div className="relative atelier-panel p-6 print:shadow-none print:ring-0 print:bg-white print:rounded-none">
        {watermarkText && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden rounded-[1.5rem] print:rounded-none">
            <span className="text-[6rem] font-bold text-primary/[0.06] rotate-[-30deg] select-none whitespace-nowrap tracking-widest">
              {watermarkText}
            </span>
          </div>
        )}

        <div className="text-center mb-6 pb-4 relative" style={{ borderBottom: "2px solid #004ac6" }}>
          {watermarkText && (
            <div className="inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700 mb-2">
              {watermarkText}
            </div>
          )}
          <h2 className="font-heading text-xl font-bold text-foreground">
            {watermarkText
              ? "Provisional Form 16"
              : "Form 16 — Certificate under Section 203 of the Income Tax Act"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Financial Year: {data.financialYear} | Assessment Year: {year + 1}-{year + 2}
          </p>
        </div>

        {data.user && (
          <div className="relative grid grid-cols-2 gap-4 mb-6 text-sm">
            <div className="space-y-1.5">
              <p><span className="text-muted-foreground">Name:</span> <span className="font-medium">{data.user.name}</span></p>
              <p><span className="text-muted-foreground">Department:</span> <span className="font-medium">{data.user.department ?? "—"}</span></p>
              {!watermarkText && (
                <p><span className="text-muted-foreground">Designation:</span> <span className="font-medium">{data.user.designation ?? "—"}</span></p>
              )}
            </div>
            <div className="space-y-1.5 text-right">
              <p><span className="text-muted-foreground">PAN:</span> <span className="font-medium">{data.user.panNo ?? "—"}</span></p>
              <p><span className="text-muted-foreground">Employer:</span> <span className="font-medium">{data.user.institution ?? "NITTE University"}</span></p>
            </div>
          </div>
        )}

        {data.slips && data.slips.length === 0 ? (
          <div className="relative p-8 text-center text-sm text-muted-foreground">
            No salary data available for FY {data.financialYear}.
          </div>
        ) : (
          <div className="relative">
            <section className="mb-8">
              <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground mb-3">
                Monthly Salary Summary
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/80">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Month</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {watermarkText ? "Gross" : "Gross Salary"}
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {watermarkText ? "Net" : "Net Salary"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.slips?.map((slip, i) => (
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

            {children}
          </div>
        )}

        <p className="relative mt-6 text-center text-xs text-muted-foreground print:mt-8">
          {watermarkText
            ? "This is a provisional statement and may change. Final Form-16 will be issued after financial year close."
            : "This is a computer-generated Form 16. No signature required."}
        </p>
      </div>

      <div className="print:hidden">
        <Form16PrintButton />
      </div>
    </div>
  );
}