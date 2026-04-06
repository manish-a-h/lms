import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing DATABASE_URL");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

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
      update: {
        maxDaysPerYear: lt.maxDaysPerYear,
        carryForward: lt.carryForward,
        description: lt.description,
      },
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

  // ─── Optional demo users for every role (development/explicit opt-in) ─────
  const shouldSeedDemoUsers =
    process.env.NODE_ENV === "development" ||
    process.env.SEED_ADMIN === "true" ||
    process.env.SEED_DEMO_USERS === "true";
  const demoPassword = process.env.DEMO_USER_PASSWORD ?? process.env.ADMIN_PASSWORD;

  if (!shouldSeedDemoUsers) {
    console.log("ℹ️  Skipping demo users outside development (set SEED_DEMO_USERS=true to enable).");
  } else if (!demoPassword) {
    console.log("ℹ️  Skipping demo users because DEMO_USER_PASSWORD or ADMIN_PASSWORD is not set.");
  } else {
    const passwordHash = await bcrypt.hash(demoPassword, 12);
    const currentYear = new Date().getFullYear();
    const persistedLeaveTypes = await prisma.leaveType.findMany({ orderBy: { name: "asc" } });

    const demoUsers = [
      {
        email: "admin@hrms.local",
        name: "HR Admin",
        role: "hr_admin" as const,
        department: "Human Resources",
        designation: "HR Administrator",
      },
      {
        email: "manager@hrms.local",
        name: "Maya Manager",
        role: "manager" as const,
        department: "Operations",
        designation: "Team Manager",
      },
      {
        email: "employee@hrms.local",
        name: "Esha Employee",
        role: "employee" as const,
        department: "Engineering",
        designation: "Software Engineer",
      },
      {
        email: "employee2@hrms.local",
        name: "Arjun Employee",
        role: "employee" as const,
        department: "Engineering",
        designation: "QA Analyst",
      },
    ];

    const seededUsers = [] as Array<{ id: string; email: string; role: string; name: string }>;

    for (const demoUser of demoUsers) {
      const user = await prisma.user.upsert({
        where: { email: demoUser.email },
        update: {
          name: demoUser.name,
          passwordHash,
          role: demoUser.role,
          department: demoUser.department,
          designation: demoUser.designation,
          isActive: true,
        },
        create: {
          email: demoUser.email,
          name: demoUser.name,
          passwordHash,
          role: demoUser.role,
          department: demoUser.department,
          designation: demoUser.designation,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
        },
      });

      seededUsers.push(user);
    }

    const managerUser = seededUsers.find((user) => user.role === "manager");
    const employeeUsers = seededUsers.filter((user) => user.role === "employee");

    if (managerUser) {
      for (const employeeUser of employeeUsers) {
        await prisma.teamAssignment.upsert({
          where: {
            managerId_employeeId: {
              managerId: managerUser.id,
              employeeId: employeeUser.id,
            },
          },
          update: { active: true },
          create: {
            managerId: managerUser.id,
            employeeId: employeeUser.id,
            active: true,
          },
        });
      }
    }

    for (const user of seededUsers.filter((entry) => entry.role !== "hr_admin")) {
      for (const leaveType of persistedLeaveTypes) {
        await prisma.leaveBalance.upsert({
          where: {
            userId_leaveTypeId_year: {
              userId: user.id,
              leaveTypeId: leaveType.id,
              year: currentYear,
            },
          },
          update: {
            totalDays: leaveType.maxDaysPerYear,
          },
          create: {
            userId: user.id,
            leaveTypeId: leaveType.id,
            year: currentYear,
            totalDays: leaveType.maxDaysPerYear,
            usedDays: 0,
          },
        });
      }
    }

    const earnedLeave = persistedLeaveTypes.find((leaveType) => leaveType.name === "Earned Leave");
    const sickLeave = persistedLeaveTypes.find((leaveType) => leaveType.name === "Sick Leave");

    if (managerUser && employeeUsers.length > 0 && earnedLeave && sickLeave) {
      await prisma.leaveRequest.deleteMany({
        where: {
          userId: { in: employeeUsers.map((user) => user.id) },
          reason: { startsWith: "Seeded demo:" },
        },
      });

      const approvedRequest = await prisma.leaveRequest.create({
        data: {
          userId: employeeUsers[0].id,
          leaveTypeId: earnedLeave.id,
          startDate: new Date(`${currentYear}-04-14`),
          endDate: new Date(`${currentYear}-04-15`),
          noOfDays: 2,
          reason: "Seeded demo: Family function leave.",
          dutyIncharge: managerUser.name,
          status: "approved",
        },
      });

      await prisma.approvalLog.create({
        data: {
          requestId: approvedRequest.id,
          managerId: managerUser.id,
          action: "approved",
          comment: "Seeded demo approval.",
        },
      });

      await prisma.leaveRequest.createMany({
        data: [
          {
            userId: employeeUsers[0].id,
            leaveTypeId: sickLeave.id,
            startDate: new Date(`${currentYear}-06-18`),
            endDate: new Date(`${currentYear}-06-18`),
            dayTime: "forenoon",
            noOfDays: 0.5,
            reason: "Seeded demo: Medical appointment.",
            dutyIncharge: managerUser.name,
            status: "pending",
          },
          {
            userId: employeeUsers[Math.min(1, employeeUsers.length - 1)].id,
            leaveTypeId: earnedLeave.id,
            startDate: new Date(`${currentYear}-07-07`),
            endDate: new Date(`${currentYear}-07-09`),
            noOfDays: 3,
            reason: "Seeded demo: Planned vacation.",
            dutyIncharge: managerUser.name,
            status: "pending",
          },
        ],
      });

      await prisma.leaveBalance.updateMany({
        where: {
          userId: employeeUsers[0].id,
          leaveTypeId: earnedLeave.id,
          year: currentYear,
        },
        data: { usedDays: 2 },
      });
    }

    console.log(`✅ Seeded demo users for roles: ${seededUsers.map((user) => user.role).join(", ")}`);
    console.log("ℹ️  Use DEMO_USER_PASSWORD (or ADMIN_PASSWORD) to sign in to all seeded accounts.");
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
