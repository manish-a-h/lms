"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Briefcase, Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
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

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));
  const loginHref =
    callbackUrl !== "/dashboard"
      ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "/login";

  useAuthPageTransition();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setError(payload?.error ?? "Unable to create your account. Please try again.");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Something went wrong while creating your account.");
    } finally {
      setLoading(false);
    }
  }

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

          {error ? (
            <div className="mb-5 flex items-start gap-3 rounded-xl bg-rose-50/85 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-xl bg-muted/60 px-4 py-3 text-center text-xs text-muted-foreground">
              Already registered?{" "}
              <AuthTransitionLink href={loginHref} scroll={false} className="font-semibold text-primary hover:text-[#183b66]">
                Login
              </AuthTransitionLink>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-sm font-medium text-foreground">
                Full name <span className="text-rose-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                placeholder="Your full name"
                className="h-11 w-full rounded-xl border border-transparent bg-[#e0e3e5] px-3 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#004ac6]/20"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                  Email address <span className="text-rose-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                  placeholder="you@example.com"
                  className="h-11 w-full rounded-xl border border-transparent bg-[#e0e3e5] px-3 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#004ac6]/20"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="department" className="block text-sm font-medium text-foreground">
                  Department
                </label>
                <input
                  id="department"
                  type="text"
                  autoComplete="organization"
                  value={formData.department}
                  onChange={(event) => setFormData((current) => ({ ...current, department: event.target.value }))}
                  placeholder="Engineering"
                  className="h-11 w-full rounded-xl border border-transparent bg-[#e0e3e5] px-3 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#004ac6]/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Create a password"
                  className="h-11 w-full rounded-xl border border-transparent bg-[#e0e3e5] px-3 pr-10 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#004ac6]/20"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirm-password" className="block text-sm font-medium text-foreground">
                Confirm password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={(event) => setFormData((current) => ({ ...current, confirmPassword: event.target.value }))}
                  placeholder="Repeat your password"
                  className="h-11 w-full rounded-xl border border-transparent bg-[#e0e3e5] px-3 pr-10 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#004ac6]/20"
                />
                <button
                  type="button"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[linear-gradient(135deg,#004ac6,#2b6ff0)] text-sm font-semibold text-white shadow-[0_18px_30px_-18px_rgba(0,74,198,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_34px_-18px_rgba(0,74,198,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Sign Up
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <AuthTransitionLink href={loginHref} scroll={false} className="font-medium text-primary hover:text-[#183b66]">
              Login
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
