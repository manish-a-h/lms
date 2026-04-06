import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { verifyAccessToken } from "@/lib/auth";
import { getForm16Data } from "@/lib/data/salary";
import { Form16Layout } from "@/components/salary/form16-layout";
import { formatCurrency } from "@/lib/format";

export default async function ProvisionalForm16Page({
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
  const startYear = params.year
    ? parseInt(params.year, 10)
    : currentYear;
  const year = isNaN(startYear) ? currentYear : startYear;

  const data = await getForm16Data(sessionUser.sub, year);

  const years = Array.from({ length: 3 }, (_, i) => currentYear - i);

  return (
    <Form16Layout
      title="Provisional Form-16"
      subtitle={`Provisional tax statement for FY ${data.financialYear}`}
      watermarkText="PROVISIONAL"
      year={year}
      years={years}
      data={data}
      basePath="/salary/form16/provisional"
    >
      <div className="rounded-xl bg-accent/40 p-5">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-3">Provisional Tax Summary</h3>
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gross Salary (Year to Date)</span>
            <span className="font-medium tabular-nums">{formatCurrency(data.totalGross)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Deductions</span>
            <span className="font-medium tabular-nums">−{formatCurrency(data.totalDeductions)}</span>
          </div>
          <div className="flex justify-between pt-2 font-semibold text-base" style={{ borderTop: "1px solid rgba(84,95,115,0.18)" }}>
            <span>Provisional Net Income</span>
            <span className="text-primary tabular-nums">{formatCurrency(data.totalNet)}</span>
          </div>
        </div>
      </div>
    </Form16Layout>
  );
}
