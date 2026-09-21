import { useEffect } from "react";

import { backendEnabled, checkServerReachable, hydrateAccount, hydratePublic } from "@/api/backend";

/**
 * Loads the server's data into the platform store once per page load. When no
 * server address is configured — or the configured one cannot be reached — the
 * app keeps running on the bundled demo content instead.
 */
export function useBackendHydration(): void {
  useEffect(() => {
    if (!backendEnabled) return;
    void (async () => {
      if (!(await checkServerReachable())) return;
      await hydratePublic();
      await hydrateAccount();
    })();
  }, []);
}
