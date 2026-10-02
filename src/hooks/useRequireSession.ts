import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

import { usePlatform } from "@/hooks/usePlatform";

/** Sends signed-out visitors back to the landing page; returns the session. */
export function useRequireSession() {
  const { session } = usePlatform();
  const navigate = useNavigate();
  useEffect(() => {
    if (!session) void navigate({ to: "/", replace: true });
  }, [navigate, session]);
  return session;
}
