"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

type LineItem = {
  id: string;
  componentName: string;
  amount: number;
  type: string;
};

type SlipUser = {
  name: string;
  email: string;
  department: string | null;
  designation: string | null;
  institution: string | null;
  panNo: string | null;
  pfUan: string | null;
  bankAcctNo: string | null;
  dateOfJoin: Date | string | null;
};

type SalarySlipDetailProps = {
  slip: {
    id: string;
    month: number;
    year: number;
    grossSalary: number;
    netSalary: number;
    generatedAt: Date | string;
    lineItems: LineItem[];
    user: SlipUser;
  };
};

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

export function SalarySlipDetail({ slip }: SalarySlipDetailProps) {
  const earnings = slip.lineItems.filter((i) => i.type === "earning");
  const deductions = slip.lineItems.filter((i) => i.type === "deduction");
  const totalEarnings = earnings.reduce((sum, i) => sum + i.amount, 0);
  const totalDeductions = deductions.reduce((sum, i) => sum + i.amount, 0);
  const monthName = monthNames[slip.month - 1] ?? "Unknown";

  function handlePrint() {
    window.print();
  }

  return (
    <div>
      {/* Print Button — hidden in print */}
      <div className="flex justify-end mb-4 print:hidden">
        <Button type="button" variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4" />
          Download / Print
        </Button>
      </div>

      <div className="atelier-panel p-6 print:shadow-none print:ring-0 print:bg-white print:rounded-none" id="salary-slip-print">
        {/* Company Header */}
        <div className="text-center mb-6 pb-4" style={{ borderBottom: "2px solid #004ac6" }}>
          <h2 className="font-heading text-xl font-bold text-foreground">
            {slip.user.institution ?? "NITTE University"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Pay Slip for {monthName} {slip.year}
          </p>
        </div>

        {/* Employee Details */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="space-y-1.5">
            <p>
              <span className="text-muted-foreground">Name:</span>{" "}
              <span className="font-medium">{slip.user.name}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Department:</span>{" "}
              <span className="font-medium">{slip.user.department ?? "—"}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Designation:</span>{" "}
              <span className="font-medium">{slip.user.designation ?? "—"}</span>
            </p>
          </div>
          <div className="space-y-1.5 text-right">
            <p>
              <span className="text-muted-foreground">PAN:</span>{" "}
              <span className="font-medium">{slip.user.panNo ?? "—"}</span>
            </p>
            <p>
              <span className="text-muted-foreground">PF UAN:</span>{" "}
              <span className="font-medium">{slip.user.pfUan ?? "—"}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Bank A/C:</span>{" "}
              <span className="font-medium">{slip.user.bankAcctNo ?? "—"}</span>
            </p>
          </div>
        </div>

        {/* Earnings & Deductions Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Earnings */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground mb-2">
              Earnings
            </h3>
            <div className="space-y-0">
              {earnings.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between py-2 text-sm"
                >
                  <span className="text-foreground">{item.componentName}</span>
                  <span className="font-medium text-foreground tabular-nums">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between py-2 text-sm font-semibold" style={{ borderTop: "1px solid rgba(84,95,115,0.18)" }}>
                <span>Total Earnings</span>
                <span className="tabular-nums text-primary">
                  {formatCurrency(totalEarnings)}
                </span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground mb-2">
              Deductions
            </h3>
            <div className="space-y-0">
              {deductions.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between py-2 text-sm"
                >
                  <span className="text-foreground">{item.componentName}</span>
                  <span className="font-medium text-foreground tabular-nums">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between py-2 text-sm font-semibold" style={{ borderTop: "1px solid rgba(84,95,115,0.18)" }}>
                <span>Total Deductions</span>
                <span className="tabular-nums text-destructive">
                  {formatCurrency(totalDeductions)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Net Pay */}
        <div className="rounded-xl bg-accent/40 p-4 flex items-center justify-between">
          <span className="font-heading text-lg font-semibold text-foreground">
            Net Pay
          </span>
          <span className="font-heading text-2xl font-bold text-primary tabular-nums">
            {formatCurrency(slip.netSalary)}
          </span>
        </div>

        {/* Footer */}
        <p className="mt-4 text-center text-xs text-muted-foreground print:mt-8">
          This is a computer-generated payslip. No signature required.
        </p>
      </div>
    </div>
  );
}
