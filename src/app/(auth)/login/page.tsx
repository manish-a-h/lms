"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Briefcase, AlertCircle } from "lucide-react";
import { useAuthPageTransition } from "@/components/auth/auth-transition-link";

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

function LoginPageContent() {
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));
  const authError = searchParams.get("authError");
  const teamsHref = `/api/auth/teams/start?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  useAuthPageTransition();

  return (
    <div className="auth-page-shell min-h-screen animate-in fade-in-0 slide-in-from-bottom-2 duration-300 bg-[radial-gradient(circle_at_top_left,rgba(0,74,198,0.1),transparent_0_32%),linear-gradient(135deg,#f7f9fb_0%,#eef2f6_100%)] px-4 py-8 md:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden lg:flex lg:flex-col lg:justify-center lg:pr-8">
          <p className="eyebrow-label">HRMS Platform</p>
          <h1 className="editorial-title mt-4 text-4xl font-bold text-foreground xl:text-5xl">
            Manage leave, salary, profiles, and approvals in one place.
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground">
            Use the platform to track employee requests, review approvals, and stay up to date with HR operations.
          </p>
          <div className="atelier-panel-muted mt-8 grid gap-4 p-5 text-sm text-muted-foreground sm:grid-cols-2">
            <div>
              <p className="font-semibold text-foreground">Employee tools</p>
              <p className="mt-1">Apply for leave, check balances, and view your personal HR information.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Manager & HR workflows</p>
              <p className="mt-1">Review requests, monitor activity, and manage workforce operations efficiently.</p>
            </div>
          </div>
        </section>

        <div className="glass-panel w-full max-w-105 justify-self-center p-7 md:p-8">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#004ac6,#2b6ff0)] shadow-[0_18px_30px_-18px_rgba(0,74,198,0.55)]">
              <Briefcase className="h-7 w-7 text-white" />
            </div>
            <p className="eyebrow-label">Welcome back</p>
            <h2 className="editorial-title mt-2 text-3xl font-bold text-foreground">
              Sign in to HRMS Portal
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">Access leave, payroll, and HR workflows in one place.</p>
          </div>

          {authError && (
            <div className="mb-5 flex items-start gap-3 rounded-xl bg-rose-50/85 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

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

            <p className="text-center text-xs text-muted-foreground">
              Use your organization&apos;s Microsoft 365 identity for secure access and automatic account provisioning.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginPageFallback() {
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f7f9fb_0%,#eef2f6_100%)] p-4">
      <div className="glass-panel mx-auto w-full max-w-105 p-8 text-center text-sm text-muted-foreground">
        Loading sign-in page…
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
