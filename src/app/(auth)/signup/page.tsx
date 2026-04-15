"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Briefcase } from "lucide-react";
import { AuthTransitionLink, useAuthPageTransition } from "@/components/auth/auth-transition-link";

function getSafeCallbackUrl(value: string | null) {
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

function SignupPageContent() {
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));
  const loginHref =
    callbackUrl !== "/dashboard"
      ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "/login";
  const teamsHref = `/api/auth/teams/start?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  const authError = searchParams.get("authError");

  useAuthPageTransition();

  return (
    <div className="auth-page-shell min-h-screen animate-in fade-in-0 slide-in-from-bottom-2 duration-300 bg-[radial-gradient(circle_at_top_left,rgba(0,74,198,0.1),transparent_0_32%),linear-gradient(135deg,#f7f9fb_0%,#eef2f6_100%)] px-4 py-8 md:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden lg:flex lg:flex-col lg:justify-center lg:pr-8">
          <p className="eyebrow-label">Employee onboarding</p>
          <h1 className="editorial-title mt-4 text-4xl font-bold text-foreground xl:text-5xl">
            Create your HRMS account to access employee services.
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground">
            Sign up to manage leave requests, view salary information, maintain your profile, and stay connected with HR updates.
          </p>
          <div className="atelier-panel-muted mt-8 space-y-3 p-5 text-sm text-muted-foreground">
            <p><span className="font-semibold text-foreground">Quick access:</span> submit leave, track approvals, and review balances from a single portal.</p>
            <p><span className="font-semibold text-foreground">Employee records:</span> keep your profile and department details current inside the platform.</p>
          </div>
        </section>

        <div className="glass-panel w-full max-w-120 justify-self-center p-7 md:p-8">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#004ac6,#2b6ff0)] shadow-[0_18px_30px_-18px_rgba(0,74,198,0.55)]">
              <Briefcase className="h-7 w-7 text-white" />
            </div>
            <p className="eyebrow-label">Create account</p>
            <h2 className="editorial-title mt-2 text-3xl font-bold text-foreground">
              Set up your employee profile
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign up for the HRMS Portal as an employee account.
            </p>
          </div>

          {authError ? (
            <div className="mb-5 flex items-start gap-3 rounded-xl bg-rose-50/85 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{authError}</span>
            </div>
          ) : null}

          <div className="space-y-5">
            <Link
              href={teamsHref}
              className="flex h-11 w-full items-center justify-center gap-3 rounded-md border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#004ac6]/30 hover:text-[#004ac6]"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-[#004ac6] text-[10px] font-bold text-white">
                T
              </span>
              Continue with Microsoft Teams
            </Link>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Need to return to sign in?{" "}
            <AuthTransitionLink href={loginHref} scroll={false} className="font-medium text-primary hover:text-[#183b66]">
              Go to login
            </AuthTransitionLink>
          </p>
        </div>
      </div>
    </div>
  );
}

function SignupPageFallback() {
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f7f9fb_0%,#eef2f6_100%)] p-4">
      <div className="glass-panel mx-auto w-full max-w-120 p-8 text-center text-sm text-muted-foreground">
        Loading sign-up page…
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupPageFallback />}>
      <SignupPageContent />
    </Suspense>
  );
}
