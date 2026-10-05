import { useEffect, useState } from "react";

import { backendEnabled } from "@/api/backend";
import { propertiesApi } from "@/api/http/platform.http";
import { toISODate } from "@/lib/pricing";

/**
 * Nights a guest cannot sleep in on a stay page, for the coming 12 months.
 * `booked` nights are taken by other bookings: they can't be part of a stay,
 * but a guest may still check out on that morning. `blocked` nights are
 * blocked by the host and can't be picked at all.
 * Checkout still re-checks availability on the server.
 */
export function useStayUnavailableNights(propertyId: string | undefined): { booked: Set<string>; blocked: Set<string> } {
  const [state, setState] = useState<{ booked: Set<string>; blocked: Set<string> }>(() => ({
    booked: new Set(),
    blocked: new Set(),
  }));

  useEffect(() => {
    if (!backendEnabled || !propertyId) return;
    let cancelled = false;
    const start = new Date();
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);
    propertiesApi
      .calendar(propertyId, toISODate(start), toISODate(end))
      .then((result) => {
        if (cancelled) return;
        const booked = new Set<string>(result.bookedNights ?? []);
        const blocked = new Set<string>();
        for (const n of result.nights ?? []) if (n.blocked) blocked.add(n.night);
        setState({ booked, blocked });
      })
      .catch(() => {
        /* calendar unreadable: checkout still validates the dates */
      });
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  return state;
}
