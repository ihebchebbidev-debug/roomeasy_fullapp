import { useEffect, useState } from "react";

import { backendEnabled } from "@/api/backend";
import { propertiesApi } from "@/api/http/platform.http";

/**
 * Stays that cannot take the chosen nights, so the search page hides them
 * instead of showing dates that are already taken as bookable.
 * Returns `undefined` while unknown (no dates picked, or still loading), which
 * means "do not filter on dates".
 */
export function useUnavailableStays(from?: string, to?: string): { ids: string[] | undefined; loading: boolean } {
  const [ids, setIds] = useState<string[] | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!backendEnabled || !from || !to || to <= from) {
      setIds(undefined);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    propertiesApi
      .unavailable(from, to)
      .then((result) => {
        if (!cancelled) setIds(result);
      })
      .catch(() => {
        // Availability could not be read: show every stay rather than an
        // empty page, the booking step checks the dates again anyway.
        if (!cancelled) setIds(undefined);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  return { ids, loading };
}
