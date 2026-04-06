import { Role } from "@/generated/prisma/client";
import { db } from "../db";

export async function getUserByEmail(email: string) {
  return db.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      passwordHash: true,
      isActive: true,
      department: true,
      designation: true,
    },
  });
}

export async function getUserById(id: string) {
  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      department: true,
      designation: true,
      institution: true,
      panNo: true,
      pfUan: true,
      bankAcctNo: true,
      nitteEmail: true,
      contactNo: true,
      dob: true,
      dateOfJoin: true,
    },
  });
}

export async function updateUserPassword(id: string, passwordHash: string) {
  return db.user.update({
    where: { id },
    data: { passwordHash },
  });
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  role?: Role;
  department?: string;
  designation?: string;
}) {
  return db.user.create({
    data: {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      passwordHash: input.passwordHash,
      role: input.role ?? Role.employee,
      department: input.department?.trim() || null,
      designation: input.designation?.trim() || null,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      department: true,
      designation: true,
    },
  });
}

export async function getAllUsers(page = 1, pageSize = 10) {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safePageSize =
    Number.isInteger(pageSize) && pageSize > 0 ? Math.min(pageSize, 100) : 10;
  const skip = (safePage - 1) * safePageSize;

  const [users, total] = await Promise.all([
    db.user.findMany({
      skip,
      take: safePageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        designation: true,
        isActive: true,
        createdAt: true,
      },
    }),
    db.user.count(),
  ]);

  return { users, total, page: safePage, pageSize: safePageSize };
}
