import { Link, useCanGoBack, useRouter, type LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";

/**
 * A "back" link that returns to the page the person actually came from
 * (keeping its tab, filters and scroll). The fallback address is only used
 * when the page was opened directly, with no in-app history behind it.
 */
export function BackLink({ children, className, ...fallback }: LinkProps & { children: ReactNode; className?: string }) {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  return (
    <Link
      {...fallback}
      className={className}
      onClick={(event) => {
        if (!canGoBack || event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        router.history.back();
      }}
    >
      {children}
    </Link>
  );
}
