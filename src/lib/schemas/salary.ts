import { z } from "zod";

export const salarySlipFilterSchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export const form16FilterSchema = z.object({
  financialYear: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{4}$/, "Financial year must be in YYYY-YYYY format (e.g. 2025-2026).")
    .optional(),
});

export type SalarySlipFilter = z.infer<typeof salarySlipFilterSchema>;
export type Form16Filter = z.infer<typeof form16FilterSchema>;
