"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Briefcase, Loader2, AlertCircle } from "lucide-react";
import { AuthTransitionLink, useAuthPageTransition } from "@/components/auth/auth-transition-link";

function getSafeCallbackUrl(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  try {
    const parsed = new URL(value, "http://localhost");
    return parsed.origin === "http://localhost"
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : "/dashboard";
  } catch {
    return "/dashboard";
  }
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));
  const signupHref =
    callbackUrl !== "/dashboard"
      ? `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "/signup";

  useAuthPageTransition();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Invalid credentials. Please try again.");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

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

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl bg-rose-50/85 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-xl bg-muted/60 px-4 py-3 text-center text-xs text-muted-foreground">
              Don&apos;t have an account?{" "}
              <AuthTransitionLink href={signupHref} scroll={false} className="font-semibold text-primary hover:text-[#183b66]">
                Sign up
              </AuthTransitionLink>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email address <span className="text-rose-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11 w-full rounded-xl border border-transparent bg-[#e0e3e5] px-3 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#004ac6]/20"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-11 w-full rounded-xl border border-transparent bg-[#e0e3e5] px-3 pr-10 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#004ac6]/20"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex justify-between gap-3">
                <AuthTransitionLink href={signupHref} scroll={false} className="text-xs font-medium text-primary transition hover:text-[#183b66]">
                  Sign up
                </AuthTransitionLink>
                <Link href="/forgot-password" className="text-xs font-medium text-primary transition hover:text-[#183b66]">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              id="sign-in-button"
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[linear-gradient(135deg,#004ac6,#2b6ff0)] text-sm font-semibold text-white shadow-[0_18px_30px_-18px_rgba(0,74,198,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_34px_-18px_rgba(0,74,198,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
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
