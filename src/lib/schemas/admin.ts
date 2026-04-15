import { z } from "zod";

export const roleSchema = z.enum(["employee", "manager", "hr_admin"]);

export const approvedEmailFormSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  role: roleSchema,
});

export const roleUpdateFormSchema = z.object({
  id: z.string().min(1, "Missing record id."),
  role: roleSchema,
});

export const approvalStatusFormSchema = z.object({
  id: z.string().min(1, "Missing record id."),
  isActive: z
    .union([z.literal("true"), z.literal("false")])
    .transform((value) => value === "true"),
});
