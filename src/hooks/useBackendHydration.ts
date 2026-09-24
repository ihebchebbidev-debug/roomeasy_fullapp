import { useEffect } from "react";

import { backendEnabled, checkServerReachable, hydrateAccount, hydratePublic } from "@/api/backend";
import { setPlatform } from "@/hooks/usePlatform";

/**
 * Loads the server's data into the platform store once per page load. When no
 * server address is configured — or the configured one cannot be reached — the
 * app keeps running on the bundled demo content instead.
 */
export function useBackendHydration(): void {
  useEffect(() => {
    if (!backendEnabled) {
      setPlatform({ accountDataStatus: "ready" });
      return;
    }
    setPlatform({ accountDataStatus: "loading" });
    void (async () => {
      if (!(await checkServerReachable())) {
        setPlatform({ accountDataStatus: "error" });
        return;
      }
      try {
        await hydratePublic();
        await hydrateAccount();
        setPlatform({ accountDataStatus: "ready" });
      } catch {
        setPlatform({ accountDataStatus: "error" });
      }
    })();
  }, []);
}
