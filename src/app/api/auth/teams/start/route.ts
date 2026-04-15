import { NextRequest, NextResponse } from "next/server";
import {
    buildTeamsAuthorizationUrl,
    encodeTeamsOAuthState,
    getSafeCallbackUrl,
    isTeamsAuthConfigured,
    teamsStateCookieOptions,
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

export async function GET(request: NextRequest) {
    const callbackUrl = getSafeCallbackUrl(request.nextUrl.searchParams.get("callbackUrl"));

    if (!isTeamsAuthConfigured()) {
        return NextResponse.redirect(
            buildLoginRedirect(request, "Teams sign-in is not configured yet.", callbackUrl)
        );
    }

    const nonce = crypto.randomUUID();
    const state = encodeTeamsOAuthState({ nonce });
    const response = NextResponse.redirect(buildTeamsAuthorizationUrl(request, state));

    response.cookies.set(TEAMS_STATE_COOKIE, nonce, teamsStateCookieOptions());
    response.cookies.set(TEAMS_CALLBACK_COOKIE, callbackUrl, teamsStateCookieOptions());

    return response;
}
