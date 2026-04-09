import { db } from "../db";
import { parseLocalDateInput } from "../utils";

export async function getFullProfile(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      nitteEmail: true,
      name: true,
      role: true,
      avatarUrl: true,
      department: true,
      designation: true,
      institution: true,
      panNo: true,
      pfUan: true,
      bankAcctNo: true,
      contactNo: true,
      dob: true,
      dateOfJoin: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function updateProfile(
  userId: string,
  data: {
    name: string;
    email: string;
    nitteEmail?: string;
    contactNo?: string;
    panNo?: string;
    pfUan?: string;
    bankAcctNo?: string;
    department?: string;
    designation?: string;
    institution?: string;
    dob?: string;
    dateOfJoin?: string;
  }
) {
  const normalizedEmail = data.email.trim().toLowerCase();

  // Check email uniqueness before update
  const existingUser = await db.user.findFirst({
    where: { email: normalizedEmail, id: { not: userId } },
    select: { id: true },
  });
  if (existingUser) {
    throw new Error("Validation error: This email address is already in use.");
  }

  return db.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: {
        name: data.name.trim(),
        email: normalizedEmail,
        nitteEmail: data.nitteEmail?.trim() || null,
        contactNo: data.contactNo?.trim() || null,
        panNo: data.panNo?.trim().toUpperCase() || null,
        pfUan: data.pfUan?.trim() || null,
        bankAcctNo: data.bankAcctNo?.trim() || null,
        department: data.department?.trim() || null,
        designation: data.designation?.trim() || null,
        institution: data.institution?.trim() || null,
        dob: data.dob ? parseLocalDateInput(data.dob) : null,
        dateOfJoin: data.dateOfJoin ? parseLocalDateInput(data.dateOfJoin) : null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        designation: true,
      },
    });

    await tx.activityLog.create({
      data: {
        actorId: userId,
        action: "profile.updated",
        entityType: "User",
        entityId: userId,
        message: `${updated.name} updated their profile.`,
      },
    });

    return updated;
  });
}
