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
import { accessTokenCookieOptions, refreshTokenCookieOptions } from "@/lib/session";
import {
    buildTeamsProfileDefaults,
    clearTeamsStateCookie,
    decodeTeamsOAuthState,
    exchangeTeamsCodeForIdentity,
    getApprovedTeamsSignIn,
    getSafeCallbackUrl,
    TEAMS_CALLBACK_COOKIE,
    TEAMS_STATE_COOKIE,
} from "@/lib/teams-auth";

function buildLoginRedirect(request: NextRequest, message: string, callbackUrl: string) {
    const url = new URL("/login", request.url);
    url.searchParams.set("authError", message);

    if (callbackUrl !== "/dashboard") {
        url.searchParams.set("callbackUrl", callbackUrl);
    }

    return url;
}

function isAutoProvisionEnabled() {
    return (process.env.TEAMS_AUTO_PROVISION ?? "true").trim().toLowerCase() !== "false";
}

function getProvisionedRole(email: string, approvedRole?: "employee" | "manager" | "hr_admin" | null) {
    if (approvedRole) {
        return approvedRole;
    }

    const hrEmails = (process.env.TEAMS_HR_EMAILS ?? "")
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);

    return hrEmails.includes(email.trim().toLowerCase()) ? "hr_admin" : "employee";
}

function getErrorMessage(error: unknown) {
    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }

    return "Microsoft Teams sign-in failed. Please try again.";
}

export async function GET(request: NextRequest) {
    const state = decodeTeamsOAuthState(request.nextUrl.searchParams.get("state"));
    const callbackUrl = getSafeCallbackUrl(
        request.cookies.get(TEAMS_CALLBACK_COOKIE)?.value ??
        request.nextUrl.searchParams.get("callbackUrl")
    );

    const microsoftError = request.nextUrl.searchParams.get("error");
    if (microsoftError) {
        const response = NextResponse.redirect(
            buildLoginRedirect(request, "Microsoft Teams sign-in was cancelled or denied.", callbackUrl)
        );
        clearTeamsStateCookie(response);
        return response;
    }

    const stateCookie = request.cookies.get(TEAMS_STATE_COOKIE)?.value;
    if (!state?.nonce || (stateCookie && stateCookie !== state.nonce)) {
        const response = NextResponse.redirect(
            buildLoginRedirect(request, "Could not verify the Microsoft Teams sign-in request.", callbackUrl)
        );
        clearTeamsStateCookie(response);
        return response;
    }

    const code = request.nextUrl.searchParams.get("code");
    if (!code) {
        const response = NextResponse.redirect(
            buildLoginRedirect(request, "The Microsoft Teams sign-in response was incomplete.", callbackUrl)
        );
        clearTeamsStateCookie(response);
        return response;
    }

    try {
        const identity = await exchangeTeamsCodeForIdentity(request, code);
        const approvedSignIn = await getApprovedTeamsSignIn(identity.email);

        if (!approvedSignIn.allowed) {
            throw new Error("Your email is not approved for Microsoft Teams sign-in. Please contact HR.");
        }

        const currentYear = new Date().getFullYear();

        const user = await db.$transaction(async (tx) => {
            const profileDefaults = buildTeamsProfileDefaults(identity);
            const assignedRole = getProvisionedRole(profileDefaults.email, approvedSignIn.role);
            const emailAliases = Array.from(
                new Set([profileDefaults.email, ...(identity.emailAliases ?? [])])
            );

            const existingUser = await tx.user.findFirst({
                where: {
                    OR: emailAliases.flatMap((emailAlias) => [
                        { email: emailAlias },
                        { nitteEmail: emailAlias },
                    ]),
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    isActive: true,
                    department: true,
                    designation: true,
                    institution: true,
                    contactNo: true,
                },
            });

            if (existingUser) {
                if (!existingUser.isActive) {
                    throw new Error("Your LMS account is inactive. Please contact HR.");
                }

                return tx.user.update({
                    where: { id: existingUser.id },
                    data: {
                        email: profileDefaults.email,
                        role: assignedRole,
                        name: existingUser.name || profileDefaults.name,
                        nitteEmail: null,
                        department: existingUser.department || profileDefaults.department,
                        designation: existingUser.designation || profileDefaults.designation,
                        institution: existingUser.institution || profileDefaults.institution,
                        contactNo: existingUser.contactNo || profileDefaults.contactNo,
                    },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        isActive: true,
                    },
                });
            }

            if (!isAutoProvisionEnabled()) {
                throw new Error("No LMS account is linked to this Teams profile.");
            }

            const passwordHash = await hashPassword(crypto.randomUUID());
            const createdUser = await tx.user.create({
                data: {
                    ...profileDefaults,
                    passwordHash,
                    role: assignedRole,
                    isActive: true,
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    isActive: true,
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
                    action: "user.teams-signup",
                    entityType: "User",
                    entityId: createdUser.id,
                    message: `Joined via Microsoft Teams (${createdUser.email}).`,
                    metadata: {
                        source: "teams-sso",
                        tenantId: identity.tenantId,
                        microsoftObjectId: identity.objectId,
                    },
                },
            });

            return createdUser;
        });

        const sessionTokenId = createSessionTokenId();
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

        const response = NextResponse.redirect(new URL(callbackUrl, request.url));

        response.cookies.set("access_token", accessToken, accessTokenCookieOptions());
        response.cookies.set("refresh_token", refreshToken, refreshTokenCookieOptions());
        clearTeamsStateCookie(response);

        return response;
    } catch (error) {
        console.error("[TEAMS_CALLBACK]", error);

        const response = NextResponse.redirect(
            buildLoginRedirect(request, getErrorMessage(error), callbackUrl)
        );
        clearTeamsStateCookie(response);
        return response;
    }
}
