import { useLocation } from "@tanstack/react-router";

/** Search params for a "Sign in" link that brings the person back to this page. */
export function useSignInReturn() {
  const href = useLocation({ select: (location) => location.href });
  return () => (href.startsWith("/auth") || href === "/" ? {} : { redirect: href });
}
