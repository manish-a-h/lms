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

export async function getAllUsers(page = 1, pageSize = 10) {
  const skip = (page - 1) * pageSize;
  const [users, total] = await Promise.all([
    db.user.findMany({
      skip,
      take: pageSize,
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
  return { users, total, page, pageSize };
}
