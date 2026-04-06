import { SalaryComponentType } from "@/generated/prisma/client";
import { db } from "../db";

export async function getSalaryComponents(userId: string) {
  const components = await db.salaryComponent.findMany({
    where: { userId },
    orderBy: [{ type: "asc" }, { componentName: "asc" }],
  });

  const earnings = components.filter((c) => c.type === SalaryComponentType.earning);
  const deductions = components.filter((c) => c.type === SalaryComponentType.deduction);
  const totalEarnings = earnings.reduce((sum, c) => sum + c.amount, 0);
  const totalDeductions = deductions.reduce((sum, c) => sum + c.amount, 0);

  return {
    earnings,
    deductions,
    totalEarnings,
    totalDeductions,
    netSalary: totalEarnings - totalDeductions,
  };
}

export async function getSalarySlips(
  userId: string,
  year?: number
) {
  const currentYear = year ?? new Date().getFullYear();

  return db.salarySlip.findMany({
    where: {
      userId,
      year: currentYear,
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    select: {
      id: true,
      month: true,
      year: true,
      grossSalary: true,
      netSalary: true,
      generatedAt: true,
    },
  });
}

export async function getSalarySlipDetail(
  userId: string,
  slipId: string
) {
  return db.salarySlip.findFirst({
    where: {
      id: slipId,
      userId,
    },
    include: {
      lineItems: {
        orderBy: [{ type: "asc" }, { componentName: "asc" }],
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          designation: true,
          institution: true,
          panNo: true,
          pfUan: true,
          bankAcctNo: true,
          dateOfJoin: true,
        },
      },
    },
  });
}

export async function getSalarySlipByMonthYear(
  userId: string,
  month: number,
  year: number
) {
  return db.salarySlip.findUnique({
    where: {
      userId_month_year: { userId, month, year },
    },
    include: {
      lineItems: {
        orderBy: [{ type: "asc" }, { componentName: "asc" }],
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          designation: true,
          panNo: true,
        },
      },
    },
  });
}

export async function getForm16Data(
  userId: string,
  startYear: number
) {
  // Financial year: April startYear to March startYear+1
  const endYear = startYear + 1;

  const slips = await db.salarySlip.findMany({
    where: {
      userId,
      OR: [
        { year: startYear, month: { gte: 4 } },
        { year: endYear, month: { lte: 3 } },
      ],
    },
    include: {
      lineItems: true,
    },
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      designation: true,
      institution: true,
      panNo: true,
      pfUan: true,
      dateOfJoin: true,
    },
  });

  // Aggregate totals
  let totalGross = 0;
  let totalNet = 0;
  const componentTotals = new Map<string, { amount: number; type: SalaryComponentType }>();

  for (const slip of slips) {
    totalGross += slip.grossSalary;
    totalNet += slip.netSalary;

    for (const item of slip.lineItems) {
      const existing = componentTotals.get(item.componentName);
      if (existing) {
        existing.amount += item.amount;
      } else {
        componentTotals.set(item.componentName, {
          amount: item.amount,
          type: item.type,
        });
      }
    }
  }

  const earningsTotals = Array.from(componentTotals.entries())
    .filter(([, v]) => v.type === SalaryComponentType.earning)
    .map(([name, v]) => ({ name, amount: v.amount }));

  const deductionsTotals = Array.from(componentTotals.entries())
    .filter(([, v]) => v.type === SalaryComponentType.deduction)
    .map(([name, v]) => ({ name, amount: v.amount }));

  return {
    financialYear: `${startYear}-${endYear}`,
    user,
    slips: slips.map((s) => ({
      month: s.month,
      year: s.year,
      grossSalary: s.grossSalary,
      netSalary: s.netSalary,
    })),
    earningsTotals,
    deductionsTotals,
    totalGross,
    totalNet,
    totalDeductions: totalGross - totalNet,
  };
}
