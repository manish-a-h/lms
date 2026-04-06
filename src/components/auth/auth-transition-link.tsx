"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const AUTH_EXIT_CLASS = "auth-page-exit";

export function useAuthPageTransition() {
  useEffect(() => {
    document.documentElement.classList.remove(AUTH_EXIT_CLASS);
  }, []);
}

type AuthTransitionLinkProps = {
  href: string;
  className?: string;
  children: React.ReactNode;
  scroll?: boolean;
};

export function AuthTransitionLink({
  href,
  className,
  children,
  scroll = false,
}: AuthTransitionLinkProps) {
  const router = useRouter();

  return (
    <Link
      href={href}
      scroll={scroll}
      className={className}
      onClick={(event) => {
        if (
          event.defaultPrevented ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.button !== 0
        ) {
          return;
        }

        event.preventDefault();
        document.documentElement.classList.add(AUTH_EXIT_CLASS);

        window.setTimeout(() => {
          router.push(href, { scroll });
        }, 160);
      }}
    >
      {children}
    </Link>
  );
}
