import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

import { getPlatform, usePlatform } from "@/hooks/usePlatform";

/** Sends signed-out visitors back to the landing page; returns the session. */
export function useRequireSession() {
  const { session } = usePlatform();
  const navigate = useNavigate();
  useEffect(() => {
    // The first client render uses the empty server snapshot; read the
    // device copy directly so a hard refresh does not bounce signed-in users.
    if (!session && !getPlatform().session) void navigate({ to: "/", replace: true });
  }, [navigate, session]);
  return session;
}
