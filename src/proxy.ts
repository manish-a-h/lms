import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/logout",
  "/api/auth/refresh",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/callback",
  "/api/auth/teams",
];

function buildLoginRedirect(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  const rawCallbackUrl = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const callbackUrl = rawCallbackUrl.startsWith("/api/auth/")
    ? "/dashboard"
    : rawCallbackUrl || "/dashboard";

  loginUrl.searchParams.set("callbackUrl", callbackUrl);
  return NextResponse.redirect(loginUrl);
}

function upsertCookieHeader(existingCookieHeader: string, setCookieHeader: string) {
  const [cookiePair] = setCookieHeader.split(";");
  if (!cookiePair) return existingCookieHeader;

  const separatorIndex = cookiePair.indexOf("=");
  if (separatorIndex === -1) return existingCookieHeader;

  const name = cookiePair.slice(0, separatorIndex).trim();
  const value = cookiePair.slice(separatorIndex + 1);
  const cookies = existingCookieHeader
    .split(/;\s*/)
    .filter(Boolean)
    .filter((cookie) => !cookie.startsWith(`${name}=`));

  cookies.push(`${name}=${value}`);
  return cookies.join("; ");
}

async function tryRefreshSession(request: NextRequest) {
  const refreshToken = request.cookies.get("refresh_token")?.value;
  if (!refreshToken) {
    return null;
  }

  try {
    const refreshResponse = await fetch(new URL("/api/auth/refresh", request.url), {
      method: "POST",
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
    });

    if (!refreshResponse.ok) {
      return null;
    }

    const requestHeaders = new Headers(request.headers);
    let updatedCookieHeader = request.headers.get("cookie") ?? "";

    const setCookies = typeof refreshResponse.headers.getSetCookie === "function"
      ? refreshResponse.headers.getSetCookie()
      : (() => {
        const setCookie = refreshResponse.headers.get("set-cookie");
        return setCookie ? [setCookie] : [];
      })();

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    for (const setCookie of setCookies) {
      response.headers.append("set-cookie", setCookie);
      updatedCookieHeader = upsertCookieHeader(updatedCookieHeader, setCookie);
    }

    if (updatedCookieHeader) {
      requestHeaders.set("cookie", updatedCookieHeader);
    }

    return response;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic =
    PUBLIC_PATHS.some((path) => pathname.startsWith(path)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon");

  if (isPublic) return NextResponse.next();

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const token = request.cookies.get("access_token")?.value;

  if (!token) {
    const refreshedResponse = await tryRefreshSession(request);
    return refreshedResponse ?? buildLoginRedirect(request);
  }

  try {
    await verifyAccessToken(token);
    return NextResponse.next();
  } catch {
    const refreshedResponse = await tryRefreshSession(request);
    return refreshedResponse ?? buildLoginRedirect(request);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
