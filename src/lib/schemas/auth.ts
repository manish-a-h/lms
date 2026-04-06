import { z } from "zod";

export const signupSchema = z
    .object({
        name: z.string().trim().min(2, "Please enter your full name.").max(120),
        email: z.string().trim().email("Please enter a valid email address."),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters.")
            .max(128, "Password is too long."),
        confirmPassword: z.string().min(8, "Please confirm your password."),
        department: z.string().trim().max(120).optional().default(""),
    })
    .superRefine((value, ctx) => {
        if (value.password !== value.confirmPassword) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["confirmPassword"],
                message: "Passwords do not match.",
            });
        }
    });

export type SignupInput = z.infer<typeof signupSchema>;
