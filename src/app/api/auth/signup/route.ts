import { NextRequest, NextResponse } from "next/server";
import { TokenPurpose } from "@/generated/prisma/client";
import {
    createSessionTokenId,
    hashPassword,
    hashToken,
    signAccessToken,
    signRefreshToken,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserByEmail } from "@/lib/data/users";
import { signupSchema } from "@/lib/schemas/auth";
import { accessTokenCookieOptions, refreshTokenCookieOptions } from "@/lib/session";

export async function POST(request: NextRequest) {
    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
    }

    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            {
                error: parsed.error.issues[0]?.message ?? "Invalid signup request.",
                fieldErrors: parsed.error.flatten().fieldErrors,
            },
            { status: 400 }
        );
    }

    const email = parsed.data.email.trim().toLowerCase();

    try {
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return NextResponse.json(
                { error: "An account with this email already exists." },
                { status: 409 }
            );
        }

        const passwordHash = await hashPassword(parsed.data.password);
        const sessionTokenId = createSessionTokenId();
        const currentYear = new Date().getFullYear();

        const user = await db.$transaction(async (tx) => {
            const createdUser = await tx.user.create({
                data: {
                    name: parsed.data.name.trim(),
                    email,
                    passwordHash,
                    role: "employee",
                    department: parsed.data.department.trim() || null,
                    designation: "Employee",
                    isActive: true,
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                },
            });

            const leaveTypes = await tx.leaveType.findMany({
                select: {
                    id: true,
                    maxDaysPerYear: true,
                },
            });

            if (leaveTypes.length > 0) {
                await tx.leaveBalance.createMany({
                    data: leaveTypes.map((leaveType) => ({
                        userId: createdUser.id,
                        leaveTypeId: leaveType.id,
                        year: currentYear,
                        totalDays: leaveType.maxDaysPerYear,
                        usedDays: 0,
                    })),
                });
            }

            await tx.activityLog.create({
                data: {
                    actorId: createdUser.id,
                    action: "user.signup",
                    entityType: "User",
                    entityId: createdUser.id,
                    message: `Signed up as a new employee account (${createdUser.email}).`,
                    metadata: {
                        source: "public-signup",
                    },
                },
            });

            return createdUser;
        });

        const payload = {
            sub: user.id,
            jti: sessionTokenId,
            email: user.email,
            role: user.role,
            name: user.name,
        };

        const [accessToken, refreshToken] = await Promise.all([
            signAccessToken(payload),
            signRefreshToken(payload),
        ]);

        const tokenHash = await hashToken(refreshToken);
        const expiresAt = new Date();
        expiresAt.setDate(
            expiresAt.getDate() + Number(process.env.JWT_REFRESH_EXPIRES_DAYS ?? 7)
        );

        await db.refreshToken.create({
            data: {
                id: sessionTokenId,
                userId: user.id,
                tokenHash,
                purpose: TokenPurpose.session,
                expiresAt,
            },
        });

        const response = NextResponse.json({
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        }, { status: 201 });

        response.cookies.set("access_token", accessToken, accessTokenCookieOptions());
        response.cookies.set("refresh_token", refreshToken, refreshTokenCookieOptions());

        return response;
    } catch (error) {
        console.error("[SIGNUP]", error);
        const message = error instanceof Error ? error.message : "Internal server error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
