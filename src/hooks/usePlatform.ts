import { useSyncExternalStore } from "react";

import {
  type Booking,
  type HostListing,
  type Payout,
  type PlatformUser,
  type FeeRates,
  type RateRules,
  type HostReview,
  type CalendarMap,
  type SessionUser,
  type TeamMember,
  type Thread,
} from "@/data/platform";
import type { Property } from "@/data/properties";

export type PlatformState = {
  accountDataStatus: "idle" | "loading" | "ready" | "error";
  session: SessionUser | null;
  bookings: Booking[];
  listings: HostListing[];
  threads: Thread[];
  users: PlatformUser[];
  payouts: Payout[];
  reviews: HostReview[];
  team: TeamMember[];
  rateRules: RateRules;
  /** Service and tax rate, as configured in the service settings. */
  feeRates: FeeRates;
  // (blocked nights live in `calendar`, keyed by property then date)
  commissionRate: number;
  stripeOnboarded: boolean;
  cookiesChoice: "accepted" | "essential" | null;
  customProperties: Property[];
  calendar: CalendarMap;
  propertyOverrides: Record<string, Partial<Property>>;
  hostDashboard: import("@/api/http/platform.http").HostDashboardDto | null;
  adminOverview: import("@/api/http/platform.http").AdminOverviewDto | null;
};

const STORAGE_KEY = "nestara.platform";

/** The store starts empty and is filled from the database. */
const initialState: PlatformState = {
  accountDataStatus: "idle",
  session: null,
  bookings: [],
  listings: [],
  threads: [],
  users: [],
  payouts: [],
  reviews: [],
  team: [],
  rateRules: { weekend: 0, longStay: 0, lastMinute: 0 },
  feeRates: { serviceFeeRate: 0, taxRate: 0 },
  
  commissionRate: 12,
  stripeOnboarded: false,
  cookiesChoice: null,
  customProperties: [],
  calendar: {},
  propertyOverrides: {},
  hostDashboard: null,
  adminOverview: null,
};

let state: PlatformState = initialState;
let hydrated = false;
const listeners = new Set<() => void>();

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
}

function emit() {
  for (const listener of listeners) listener();
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      state = { ...initialState, ...(JSON.parse(raw) as Partial<PlatformState>) };
      emit();
    }
  } catch {
    /* ignore malformed state */
  }
}

function subscribe(listener: () => void) {
  hydrate();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setPlatform(update: Partial<PlatformState> | ((current: PlatformState) => Partial<PlatformState>)) {
  // Read the device copy first: otherwise a later first subscriber would run
  // hydrate() and replace freshly loaded server data with the stale snapshot.
  hydrate();
  const patch = typeof update === "function" ? update(state) : update;
  state = { ...state, ...patch };
  persist();
  emit();
}

/** Snapshot for non-React callers (API adapters, services). */
export function getPlatform(): PlatformState {
  hydrate();
  return state;
}

export function usePlatform(): PlatformState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => initialState,
  );
}

export function useSession() {
  return usePlatform().session;
}
