import { z } from "zod";

export const leaveDayTimeValues = ["full_day", "forenoon", "afternoon"] as const;
export const leaveDecisionValues = ["approved", "rejected"] as const;

export const createLeaveRequestSchema = z
    .object({
        leaveTypeId: z.string().trim().min(1, "Please select a leave type."),
        startDate: z.string().trim().min(1, "Please select a start date."),
        endDate: z.string().trim().min(1, "Please select an end date."),
        dayTime: z.enum(leaveDayTimeValues),
        dutyIncharge: z
            .string()
            .trim()
            .min(2, "Duty incharge must be at least 2 characters.")
            .max(120, "Duty incharge is too long."),
        reason: z
            .string()
            .trim()
            .min(10, "Please provide a short reason for your leave.")
            .max(500, "Reason is too long."),
        confirmation: z.boolean().refine((value) => value, {
            message: "Please confirm that the leave details are correct.",
        }),
    })
    .superRefine((value, ctx) => {
        if (value.endDate < value.startDate) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["endDate"],
                message: "End date must be on or after the start date.",
            });
        }

        if (value.dayTime !== "full_day" && value.startDate !== value.endDate) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["dayTime"],
                message: "Half-day requests must start and end on the same day.",
            });
        }
    });

export const leaveDecisionSchema = z
    .object({
        action: z.enum(leaveDecisionValues),
        comment: z.string().trim().max(500, "Comment is too long.").optional().default(""),
    })
    .superRefine((value, ctx) => {
        if (value.action === "rejected" && !value.comment.trim()) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["comment"],
                message: "A comment is required when rejecting a leave request.",
            });
        }
    });

export const leavePolicySchema = z.object({
    name: z.string().trim().min(2).max(100),
    maxDaysPerYear: z.coerce.number().int().min(0).max(365),
    carryForward: z.boolean(),
    description: z.string().trim().max(500).optional().default(""),
});

export const holidayFormSchema = z.object({
    name: z.string().trim().min(2).max(120),
    date: z.string().trim().min(1),
    isOptional: z.boolean().default(false),
});

export const adminUserUpdateSchema = z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().email(),
    department: z.string().trim().max(120).optional().default(""),
    designation: z.string().trim().max(120).optional().default(""),
    isActive: z.boolean().default(true),
});

export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>;
export type LeaveDecisionInput = z.infer<typeof leaveDecisionSchema>;
