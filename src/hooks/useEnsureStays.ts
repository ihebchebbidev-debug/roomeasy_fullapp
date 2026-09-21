import { useEffect, useState } from "react";

import { ensureStays } from "@/api/backend";

/**
 * Makes sure the given stays are loaded, whatever the browser holds already.
 * Pages that look a stay up by id (trips, messages, checkout, a booking) use
 * this so a stay outside the first slice of the catalogue still shows its
 * photo, title and city instead of nothing.
 *
 * Returns true while stays are still being fetched, so a page can wait instead
 * of announcing "not found" too early.
 */
export function useEnsureStays(ids: Array<string | undefined | null>): boolean {
  const key = [...new Set(ids.filter((id): id is string => Boolean(id)))].sort().join(",");
  const [loading, setLoading] = useState(Boolean(key));

  useEffect(() => {
    if (!key) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    void ensureStays(key.split(",")).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [key]);

  return loading;
}
