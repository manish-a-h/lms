import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Leave Types ──────────────────────────────────────────────────────────
  const leaveTypes = [
    {
      name: "Casual Leave",
      maxDaysPerYear: 12,
      carryForward: false,
      description: "For personal/casual matters. Max 3 consecutive days.",
    },
    {
      name: "Sick Leave",
      maxDaysPerYear: 12,
      carryForward: false,
      description: "For medical illness. Medical certificate required for >2 days.",
    },
    {
      name: "Earned Leave",
      maxDaysPerYear: 18,
      carryForward: true,
      description: "Accrued based on days worked. Can be carried forward.",
    },
    {
      name: "Maternity Leave",
      maxDaysPerYear: 180,
      carryForward: false,
      description: "For female employees. 26 weeks as per Maternity Benefit Act.",
    },
    {
      name: "Compensatory Off",
      maxDaysPerYear: 10,
      carryForward: false,
      description: "For working on weekends/holidays. Must be applied within 30 days.",
    },
  ];

  for (const lt of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { name: lt.name },
      update: {},
      create: lt,
    });
  }
  console.log(`✅ Seeded ${leaveTypes.length} leave types`);

  // ─── Public Holidays 2026 ─────────────────────────────────────────────────
  const holidays = [
    { name: "New Year's Day", date: new Date("2026-01-01"), isOptional: false },
    { name: "Republic Day", date: new Date("2026-01-26"), isOptional: false },
    { name: "Holi", date: new Date("2026-03-03"), isOptional: false },
    { name: "Good Friday", date: new Date("2026-04-03"), isOptional: false },
    { name: "May Day / Labour Day", date: new Date("2026-05-01"), isOptional: false },
    { name: "Independence Day", date: new Date("2026-08-15"), isOptional: false },
    { name: "Gandhi Jayanti", date: new Date("2026-10-02"), isOptional: false },
    { name: "Dussehra", date: new Date("2026-10-22"), isOptional: false },
    { name: "Diwali", date: new Date("2026-11-08"), isOptional: false },
    { name: "Christmas Day", date: new Date("2026-12-25"), isOptional: false },
  ];

  // Clear existing 2026 holidays and re-seed
  await prisma.holiday.deleteMany({
    where: {
      date: {
        gte: new Date("2026-01-01"),
        lte: new Date("2026-12-31"),
      },
    },
  });
  await prisma.holiday.createMany({ data: holidays });
  console.log(`✅ Seeded ${holidays.length} public holidays for 2026`);

  // ─── Default HR Admin Account ─────────────────────────────────────────────
  const adminEmail = "admin@hrms.local";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existing) {
    const passwordHash = await bcrypt.hash("Admin@1234", 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "HR Admin",
        passwordHash,
        role: "hr_admin",
        department: "Human Resources",
        designation: "HR Administrator",
        isActive: true,
      },
    });
    console.log(`✅ Created default HR Admin — email: ${adminEmail}  password: Admin@1234`);
  } else {
    console.log("ℹ️  HR Admin already exists — skipping");
  }

  console.log("🎉 Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
