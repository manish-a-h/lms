"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "@/lib/auth";
import {
  setApprovedTeamsEmailStatus,
  updateManagedUserRole,
  upsertApprovedTeamsEmail,
} from "@/lib/data/admin";
import {
  approvalStatusFormSchema,
  approvedEmailFormSchema,
  roleUpdateFormSchema,
} from "@/lib/schemas/admin";

async function requireHrAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const sessionUser = await verifyAccessToken(token).catch(() => null);
  if (!sessionUser || sessionUser.role !== "hr_admin") {
    redirect("/dashboard");
  }

  return sessionUser;
}

export async function addApprovedEmailAction(formData: FormData) {
  const sessionUser = await requireHrAdmin();

  const parsed = approvedEmailFormSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid approved email.");
  }

  await upsertApprovedTeamsEmail({
    ...parsed.data,
    actorId: sessionUser.sub,
  });

  revalidatePath("/admin");
}

export async function updateApprovedEmailRoleAction(formData: FormData) {
  const sessionUser = await requireHrAdmin();

  const parsed = roleUpdateFormSchema.safeParse({
    id: formData.get("id"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid role update.");
  }

  const email = formData.get("email");
  if (typeof email !== "string" || !email.trim()) {
    throw new Error("Missing email for approved record.");
  }

  await upsertApprovedTeamsEmail({
    email,
    role: parsed.data.role,
    actorId: sessionUser.sub,
  });

  revalidatePath("/admin");
}

export async function toggleApprovedEmailStatusAction(formData: FormData) {
  const sessionUser = await requireHrAdmin();

  const parsed = approvalStatusFormSchema.safeParse({
    id: formData.get("id"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid access toggle request.");
  }

  await setApprovedTeamsEmailStatus({
    ...parsed.data,
    actorId: sessionUser.sub,
  });

  revalidatePath("/admin");
}

export async function updateUserRoleAction(formData: FormData) {
  const sessionUser = await requireHrAdmin();

  const parsed = roleUpdateFormSchema.safeParse({
    id: formData.get("id"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid user role update.");
  }

  await updateManagedUserRole({
    userId: parsed.data.id,
    role: parsed.data.role,
    actorId: sessionUser.sub,
  });

  revalidatePath("/admin");
}
