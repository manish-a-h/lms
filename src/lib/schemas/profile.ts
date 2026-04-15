import { z } from "zod";

const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const phoneRegex = /^[6-9]\d{9}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(120, "Name is too long."),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address."),
  contactNo: z
    .string()
    .trim()
    .regex(phoneRegex, "Please enter a valid 10-digit Indian mobile number.")
    .optional()
    .or(z.literal("")),
  panNo: z
    .string()
    .trim()
    .toUpperCase()
    .regex(panRegex, "PAN must follow the format ABCDE1234F.")
    .optional()
    .or(z.literal("")),
  pfUan: z
    .string()
    .trim()
    .max(30, "PF UAN is too long.")
    .optional()
    .or(z.literal("")),
  bankAcctNo: z
    .string()
    .trim()
    .max(30, "Bank account number is too long.")
    .optional()
    .or(z.literal("")),
  department: z
    .string()
    .trim()
    .max(120, "Department name is too long.")
    .optional()
    .or(z.literal("")),
  designation: z
    .string()
    .trim()
    .max(120, "Designation is too long.")
    .optional()
    .or(z.literal("")),
  institution: z
    .string()
    .trim()
    .max(200, "Institution name is too long.")
    .optional()
    .or(z.literal("")),
  dob: z
    .string()
    .trim()
    .refine((v) => v === "" || dateRegex.test(v), "Invalid date format (YYYY-MM-DD).")
    .optional()
    .or(z.literal("")),
  dateOfJoin: z
    .string()
    .trim()
    .refine((v) => v === "" || dateRegex.test(v), "Invalid date format (YYYY-MM-DD).")
    .optional()
    .or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
