import { createHmac, timingSafeEqual } from "node:crypto";
import { type Role } from "@/generated/prisma/client";
import { createRemoteJWKSet, decodeJwt, jwtVerify, type JWTPayload } from "jose";

const DEFAULT_TEAMS_SCOPE = "openid profile email User.Read";
export const TEAMS_STATE_COOKIE = "teams_oauth_state";
export const TEAMS_CALLBACK_COOKIE = "teams_oauth_callback";

type TeamsOAuthState = {
    nonce: string;
};

export type TeamsIdentity = {
    email: string;
    name: string;
    tenantId?: string;
    objectId?: string;
    department?: string;
    jobTitle?: string;
    contactNo?: string;
    officeLocation?: string;
    emailAliases?: string[];
};

type TeamsTokenResponse = {
    access_token?: string;
    id_token?: string;
    error?: string;
    error_description?: string;
};

type TeamsTokenClaims = JWTPayload & {
    email?: string;
    iss?: string;
    name?: string;
    oid?: string;
    preferred_username?: string;
    tid?: string;
    upn?: string;
};

type MicrosoftGraphMeResponse = {
    displayName?: string;
    department?: string;
    jobTitle?: string;
    mail?: string;
    mobilePhone?: string;
    officeLocation?: string;
    userPrincipalName?: string;
    businessPhones?: string[];
    otherMails?: string[];
};

function getRequiredTeamsEnv(name: "TEAMS_CLIENT_ID" | "TEAMS_CLIENT_SECRET") {
    const value = process.env[name]?.trim();

    if (!value) {
        throw new Error(`${name} is not configured.`);
    }

    return value;
}

function getTenantId() {
    return process.env.TEAMS_TENANT_ID?.trim() || "organizations";
}

function getTeamsScope() {
    return process.env.TEAMS_SCOPES?.trim() || DEFAULT_TEAMS_SCOPE;
}

export function isTeamsAuthConfigured() {
    return Boolean(process.env.TEAMS_CLIENT_ID?.trim() && process.env.TEAMS_CLIENT_SECRET?.trim());
}

export function getAppOrigin(request: Request) {
    const configuredOrigin =
        process.env.APP_URL?.trim() ||
        process.env.NEXTAUTH_URL?.trim() ||
        process.env.NEXT_PUBLIC_APP_URL?.trim();

    if (configuredOrigin) {
        return configuredOrigin.replace(/\/+$/, "");
    }

    return new URL(request.url).origin;
}

export function getTeamsRedirectUri(request: Request) {
    const configuredRedirectUri = process.env.TEAMS_REDIRECT_URI?.trim();

    if (configuredRedirectUri) {
        return configuredRedirectUri;
    }

    return `${getAppOrigin(request)}/api/auth/teams/callback`;
}

export function getSafeCallbackUrl(value: string | null | undefined) {
    if (!value || !value.startsWith("/") || value.startsWith("//")) {
        return "/dashboard";
    }

    try {
        const parsed = new URL(value, "http://localhost");
        const normalized = `${parsed.pathname}${parsed.search}${parsed.hash}`;

        if (
            parsed.origin !== "http://localhost" ||
            normalized.startsWith("/api/") ||
            normalized.startsWith("/login") ||
            normalized.startsWith("/signup") ||
            normalized.startsWith("/forgot-password") ||
            normalized.startsWith("/reset-password")
        ) {
            return "/dashboard";
        }

        return normalized;
    } catch {
        return "/dashboard";
    }
}

export function teamsStateCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        maxAge: 60 * 10,
    };
}

export function clearTeamsStateCookie(response: { cookies: { set: typeof Response.prototype.headers.set } | { set: (name: string, value: string, options?: Record<string, unknown>) => unknown } }) {
    response.cookies.set(TEAMS_STATE_COOKIE, "", {
        ...teamsStateCookieOptions(),
        maxAge: 0,
    });
    response.cookies.set(TEAMS_CALLBACK_COOKIE, "", {
        ...teamsStateCookieOptions(),
        maxAge: 0,
    });
}

function getTeamsStateSecret() {
    return (
        process.env.TEAMS_STATE_SECRET?.trim() ||
        process.env.JWT_SECRET?.trim() ||
        process.env.JWT_REFRESH_SECRET?.trim() ||
        "local-dev-teams-state-secret"
    );
}

function signTeamsStateNonce(nonce: string) {
    return createHmac("sha256", getTeamsStateSecret())
        .update(nonce)
        .digest("base64url");
}

export function encodeTeamsOAuthState(state: TeamsOAuthState) {
    const signature = signTeamsStateNonce(state.nonce);
    return `${state.nonce}.${signature}`;
}

export function decodeTeamsOAuthState(value: string | null) {
    const trimmed = value?.trim();
    if (!trimmed) {
        return null;
    }

    const separatorIndex = trimmed.indexOf(".");
    if (separatorIndex <= 0 || separatorIndex === trimmed.length - 1) {
        return null;
    }

    const nonce = trimmed.slice(0, separatorIndex);
    const signature = trimmed.slice(separatorIndex + 1);
    const expectedSignature = signTeamsStateNonce(nonce);

    if (signature.length !== expectedSignature.length) {
        return null;
    }

    const isValid = timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );

    if (!isValid) {
        return null;
    }

    return {
        nonce,
    } satisfies TeamsOAuthState;
}

export function buildTeamsAuthorizationUrl(request: Request, state: string) {
    const url = new URL(`https://login.microsoftonline.com/${getTenantId()}/oauth2/v2.0/authorize`);

    url.searchParams.set("client_id", getRequiredTeamsEnv("TEAMS_CLIENT_ID"));
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", getTeamsRedirectUri(request));
    url.searchParams.set("response_mode", "query");
    url.searchParams.set("scope", getTeamsScope());
    url.searchParams.set("state", state);
    url.searchParams.set("prompt", "select_account");

    return url;
}

function normalizeOptionalString(value: string | null | undefined) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
}

export function normalizeTeamsEmail(value: string | null | undefined) {
    const normalized = normalizeOptionalString(value)?.toLowerCase();

    if (!normalized) {
        return undefined;
    }

    const guestMatch = /^(.*)#ext#@.*\.onmicrosoft\.com$/i.exec(normalized);
    if (!guestMatch?.[1]) {
        return normalized;
    }

    const alias = guestMatch[1];
    const atIndex = alias.lastIndexOf("_");

    if (atIndex <= 0) {
        return normalized;
    }

    return `${alias.slice(0, atIndex)}@${alias.slice(atIndex + 1)}`;
}

export function buildTeamsProfileDefaults(identity: TeamsIdentity) {
    const email = normalizeTeamsEmail(identity.email) ?? identity.email.trim().toLowerCase();

    return {
        name: normalizeOptionalString(identity.name) ?? "Teams User",
        email,
        department: normalizeOptionalString(identity.department),
        designation: normalizeOptionalString(identity.jobTitle) ?? "Employee",
        institution: normalizeOptionalString(identity.officeLocation),
        contactNo: normalizeOptionalString(identity.contactNo),
    };
}

function matchesAllowedTeamsDomain(email: string) {
    const allowedDomains = (process.env.TEAMS_ALLOWED_DOMAINS ?? "")
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean);

    if (allowedDomains.length === 0) {
        return true;
    }

    const domain = email.split("@")[1]?.toLowerCase() ?? "";
    return allowedDomains.includes(domain);
}

function getBootstrapApprovedRole(email: string): Role | null {
    const normalizedEmail = email.trim().toLowerCase();
    const hrEmails = (process.env.TEAMS_HR_EMAILS ?? "")
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean);

    return hrEmails.includes(normalizedEmail) ? "hr_admin" : null;
}

export async function getApprovedTeamsSignIn(email: string): Promise<{ allowed: boolean; role: Role | null }> {
    const normalizedEmail = normalizeTeamsEmail(email) ?? email.trim().toLowerCase();

    if (!matchesAllowedTeamsDomain(normalizedEmail)) {
        return { allowed: false, role: null };
    }

    const bootstrapRole = getBootstrapApprovedRole(normalizedEmail);

    try {
        const { db } = await import("@/lib/db");
        const approvedEmail = await db.approvedEmail.findUnique({
            where: { email: normalizedEmail },
            select: {
                role: true,
                isActive: true,
            },
        });

        if (approvedEmail?.isActive) {
            return {
                allowed: true,
                role: approvedEmail.role,
            };
        }
    } catch {
        if (bootstrapRole) {
            return { allowed: true, role: bootstrapRole };
        }

        return { allowed: true, role: null };
    }

    if (bootstrapRole) {
        return { allowed: true, role: bootstrapRole };
    }

    return { allowed: false, role: null };
}

export function isAllowedTeamsEmail(email: string) {
    const normalizedEmail = normalizeTeamsEmail(email) ?? email.trim().toLowerCase();
    return matchesAllowedTeamsDomain(normalizedEmail);
}

async function getMicrosoftGraphProfile(accessToken: string) {
    try {
        const response = await fetch(
            "https://graph.microsoft.com/v1.0/me?$select=displayName,mail,userPrincipalName,otherMails,department,jobTitle,mobilePhone,officeLocation,businessPhones",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                cache: "no-store",
            }
        );

        if (!response.ok) {
            return null;
        }

        return (await response.json()) as MicrosoftGraphMeResponse;
    } catch {
        return null;
    }
}

export async function exchangeTeamsCodeForIdentity(
    request: Request,
    code: string
): Promise<TeamsIdentity> {
    const clientId = getRequiredTeamsEnv("TEAMS_CLIENT_ID");
    const clientSecret = getRequiredTeamsEnv("TEAMS_CLIENT_SECRET");
    const tenantId = getTenantId();

    const response = await fetch(
        `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                grant_type: "authorization_code",
                redirect_uri: getTeamsRedirectUri(request),
                scope: getTeamsScope(),
            }),
            cache: "no-store",
        }
    );

    const tokenData = (await response.json()) as TeamsTokenResponse;

    if (!response.ok || !tokenData.id_token) {
        throw new Error(
            tokenData.error_description || tokenData.error || "Microsoft Teams authentication failed."
        );
    }

    const decodedClaims = decodeJwt(tokenData.id_token) as TeamsTokenClaims;
    const resolvedTenantId = decodedClaims.tid || tenantId;
    const resolvedIssuer =
        typeof decodedClaims.iss === "string" && decodedClaims.iss
            ? decodedClaims.iss
            : `https://login.microsoftonline.com/${resolvedTenantId}/v2.0`;

    const jwks = createRemoteJWKSet(
        new URL(`https://login.microsoftonline.com/${resolvedTenantId}/discovery/v2.0/keys`)
    );

    const verified = await jwtVerify(tokenData.id_token, jwks, {
        audience: clientId,
        issuer: resolvedIssuer,
    });

    const claims = verified.payload as TeamsTokenClaims;
    const graphProfile = tokenData.access_token
        ? await getMicrosoftGraphProfile(tokenData.access_token)
        : null;

    const emailCandidates = [
        graphProfile?.mail,
        ...(graphProfile?.otherMails ?? []),
        graphProfile?.userPrincipalName,
        claims.preferred_username,
        claims.email,
        claims.upn,
    ]
        .filter((value): value is string => typeof value === "string" && value.includes("@"))
        .map((value) => value.trim().toLowerCase());

    const normalizedCandidates = emailCandidates
        .map((value) => normalizeTeamsEmail(value))
        .filter((value): value is string => Boolean(value));

    const email = normalizedCandidates[0];

    if (!email) {
        throw new Error("Microsoft Teams did not return a valid work email address.");
    }

    const name =
        normalizeOptionalString(graphProfile?.displayName) ||
        (typeof claims.name === "string" && claims.name.trim()) ||
        email.split("@")[0] ||
        "Teams User";

    return {
        email,
        name,
        tenantId: claims.tid || resolvedTenantId,
        objectId: claims.oid,
        department: normalizeOptionalString(graphProfile?.department),
        jobTitle: normalizeOptionalString(graphProfile?.jobTitle),
        contactNo:
            normalizeOptionalString(graphProfile?.mobilePhone) ||
            normalizeOptionalString(graphProfile?.businessPhones?.[0]),
        officeLocation: normalizeOptionalString(graphProfile?.officeLocation),
        emailAliases: Array.from(new Set([...emailCandidates, ...normalizedCandidates])),
    };
}
