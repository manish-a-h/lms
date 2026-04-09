import { SalaryComponentType } from "@/generated/prisma/client";
import { db } from "../db";

export async function getSalaryComponents(userId: string) {
  const components = await db.salaryComponent.findMany({
    where: { userId },
    orderBy: [{ type: "asc" }, { componentName: "asc" }],
  });

  const earnings = components.filter((c) => c.type === SalaryComponentType.earning);
  const deductions = components.filter((c) => c.type === SalaryComponentType.deduction);
  const mappedEarnings = earnings.map((c) => ({ ...c, amount: Number(c.amount) }));
  const mappedDeductions = deductions.map((c) => ({ ...c, amount: Number(c.amount) }));
  const totalEarnings = mappedEarnings.reduce((sum, c) => sum + c.amount, 0);
  const totalDeductions = mappedDeductions.reduce((sum, c) => sum + c.amount, 0);

  return {
    earnings: mappedEarnings,
    deductions: mappedDeductions,
    totalEarnings,
    totalDeductions,
    netSalary: totalEarnings - totalDeductions,
  };
}

export async function getSalarySlips(
  userId: string,
  year?: number,
  month?: number
) {
  const currentYear = year ?? new Date().getFullYear();

  const slips = await db.salarySlip.findMany({
    where: {
      userId,
      year: currentYear,
      ...(month !== undefined ? { month } : {}),
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

  return slips.map((s) => ({
    ...s,
    grossSalary: Number(s.grossSalary),
    netSalary: Number(s.netSalary),
  }));
}

export async function getSalarySlipDetail(userId: string, slipId: string) {
  const slip = await db.salarySlip.findFirst({
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

  if (!slip) return null;

  const derivedLineItems = slip.lineItems.length > 0 ? slip.lineItems.map((li) => ({
    ...li,
    amount: Number(li.amount),
  })) : [
    {
      id: "derived-basic",
      salarySlipId: slip.id,
      componentName: "Basic Salary",
      amount: Number(slip.grossSalary),
      type: SalaryComponentType.earning,
    }
  ];

  return {
    ...slip,
    grossSalary: Number(slip.grossSalary),
    netSalary: Number(slip.netSalary),
    lineItems: derivedLineItems,
  };
}

export async function getSalarySlipByMonthYear(
  userId: string,
  month: number,
  year: number
) {
  const slip = await db.salarySlip.findUnique({
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

  if (!slip) return null;

  const derivedLineItems = slip.lineItems.length > 0 ? slip.lineItems.map((li) => ({
    ...li,
    amount: Number(li.amount),
  })) : [
    {
      id: "derived-basic",
      salarySlipId: slip.id,
      componentName: "Basic Salary",
      amount: Number(slip.grossSalary),
      type: SalaryComponentType.earning,
    }
  ];

  return {
    ...slip,
    grossSalary: Number(slip.grossSalary),
    netSalary: Number(slip.netSalary),
    lineItems: derivedLineItems,
  };
}

export async function getForm16Data(userId: string, startYear: number) {
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

  let totalGross = 0;
  let totalNet = 0;
  const componentTotals = new Map<string, { amount: number; type: SalaryComponentType }>();

  for (const slip of slips) {
    totalGross += Number(slip.grossSalary);
    totalNet += Number(slip.netSalary);

    const effectiveLineItems = slip.lineItems.length > 0 ? slip.lineItems : [
      {
        id: "derived-basic",
        salarySlipId: slip.id,
        componentName: "Basic Salary",
        amount: Number(slip.grossSalary),
        type: SalaryComponentType.earning,
      }
    ];

    for (const item of effectiveLineItems) {
      const amount = Number(item.amount);
      const existing = componentTotals.get(item.componentName);

      if (existing) {
        existing.amount += amount;
      } else {
        componentTotals.set(item.componentName, {
          amount,
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
      grossSalary: Number(s.grossSalary),
      netSalary: Number(s.netSalary),
    })),
    earningsTotals,
    deductionsTotals,
    totalGross,
    totalNet,
    totalDeductions: totalGross - totalNet,
  };
}