import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";

import { getPlatform, usePlatform } from "@/hooks/usePlatform";

/** Renders children only for administrators / back-office staff; others go home. */
export function BackOfficeGate({ children }: { children: ReactNode }) {
  const { session } = usePlatform();
  const navigate = useNavigate();
  // The server has no session; wait for the browser so the first render matches.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const current = mounted ? (session ?? getPlatform().session) : null;
  const allowed = !!current && (current.role === "admin" || !!current.backOffice);
  useEffect(() => {
    if (mounted && !allowed) void navigate({ to: "/", replace: true });
  }, [mounted, allowed, navigate]);
  if (!allowed) return null;
  return <>{children}</>;
}
